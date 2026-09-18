// End-to-end tests for the ElevateU feed API.
// Exercises: register/login, post create (text + image), feed pagination &
// ordering, like toggle, comments CRUD, ownership rules, edit, delete.
import { api, BASE } from './e2e-support.mjs';

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}


// 1x1 red PNG
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const suffix = Date.now().toString(36);
const userA = {
  first_name: 'Alice', last_name: 'Tester',
  user_name: `alice_${suffix}`, email: `alice_${suffix}@example.com`,
  password: 'password123', password_confirmation: 'password123',
};
const userB = {
  first_name: 'Bob', last_name: 'Tester',
  user_name: `bob_${suffix}`, email: `bob_${suffix}@example.com`,
  password: 'password123', password_confirmation: 'password123',
};

async function main() {
  console.log('== Auth ==');
  const regA = await api('/auth/register', { method: 'POST', body: userA });
  check('register A returns 201 + token', regA.status === 201 && !!regA.json?.data?.token, JSON.stringify(regA.json)?.slice(0, 300));
  check('register A includes profile', regA.json?.data?.user?.profile?.first_name === 'Alice');
  const tokenA = regA.json?.data?.token;
  const idA = regA.json?.data?.user?.id;

  const regB = await api('/auth/register', { method: 'POST', body: userB });
  check('register B returns 201 + token', regB.status === 201 && !!regB.json?.data?.token);
  const tokenB = regB.json?.data?.token;

  const badLogin = await api('/auth/login', { method: 'POST', body: { email: userA.email, password: 'wrongpassword' } });
  check('wrong password rejected with 401', badLogin.status === 401);

  const login = await api('/auth/login', { method: 'POST', body: { email: userA.email, password: userA.password } });
  check('login works', login.status === 200 && !!login.json?.data?.token);

  const me = await api('/user', { token: tokenA });
  check('GET /user returns the authed user', me.status === 200 && me.json?.email === userA.email);

  console.log('== Route protection ==');
  const noAuth = await api('/posts');
  check('GET /posts without token is 401', noAuth.status === 401, `got ${noAuth.status}`);
  const badToken = await api('/posts', { token: 'not-a-real-token' });
  check('GET /posts with garbage token is 401', badToken.status === 401, `got ${badToken.status}`);

  console.log('== Create posts ==');
  const textForm = new FormData();
  textForm.append('content', 'Hello world from Alice!');
  const post1 = await api('/post', { method: 'POST', token: tokenA, form: textForm });
  check('text post created (201)', post1.status === 201 && post1.json?.data?.post?.id, JSON.stringify(post1.json)?.slice(0, 300));
  const post1Data = post1.json?.data?.post;
  check('created post has author + profile', post1Data?.user?.profile?.first_name === 'Alice');
  check('created post has counts', post1Data?.likes_count === 0 && post1Data?.comments_count === 0);

  const imgForm = new FormData();
  imgForm.append('content', 'Post with a picture');
  imgForm.append('file[0]', new Blob([Buffer.from(PNG_BASE64, 'base64')], { type: 'image/png' }), 'pixel.png');
  const post2 = await api('/post', { method: 'POST', token: tokenA, form: imgForm });
  check('image post created (201)', post2.status === 201 && post2.json?.data?.post?.id, JSON.stringify(post2.json)?.slice(0, 300));
  const post2Data = post2.json?.data?.post;
  const attachment = post2Data?.attachments?.[0];
  check('image post has attachment with absolute url', !!attachment?.url && attachment.url.startsWith('http'), JSON.stringify(attachment)?.slice(0, 200));

  if (attachment?.url) {
    const img = await fetch(attachment.url);
    check('attachment url serves the file (200 image/*)', img.status === 200 && (img.headers.get('content-type') || '').startsWith('image/'), `status ${img.status} type ${img.headers.get('content-type')}`);
  }

  const imgOnlyForm = new FormData();
  imgOnlyForm.append('file[0]', new Blob([Buffer.from(PNG_BASE64, 'base64')], { type: 'image/png' }), 'only.png');
  const post3 = await api('/post', { method: 'POST', token: tokenA, form: imgOnlyForm });
  check('image-only post (no content) created', post3.status === 201, JSON.stringify(post3.json)?.slice(0, 300));
  const post3Id = post3.json?.data?.post?.id;

  const emptyForm = new FormData();
  const emptyPost = await api('/post', { method: 'POST', token: tokenA, form: emptyForm });
  check('empty post rejected (422)', emptyPost.status === 422, `got ${emptyPost.status}`);

  const badFileForm = new FormData();
  badFileForm.append('file[0]', new Blob([Buffer.from('#!/bin/sh\necho hacked')], { type: 'application/x-sh' }), 'evil.sh');
  const badFile = await api('/post', { method: 'POST', token: tokenA, form: badFileForm });
  check('disallowed file type rejected (422)', badFile.status === 422, `got ${badFile.status}`);

  console.log('== Feed ==');
  const feed = await api('/posts', { token: tokenB });
  const feedPosts = feed.json?.data?.data;
  check('feed returns paginated posts', feed.status === 200 && Array.isArray(feedPosts), JSON.stringify(feed.json)?.slice(0, 200));
  check('feed is newest-first', feedPosts?.[0]?.id === post3Id, `first is ${feedPosts?.[0]?.id}, expected ${post3Id}`);
  check('feed posts expose is_liked=false for B', feedPosts?.every((p) => !p.is_liked));
  check('feed post author profile is present', !!feedPosts?.[0]?.user?.profile);

  console.log('== Likes ==');
  const like1 = await api(`/posts/${post1Data.id}/like`, { method: 'POST', token: tokenB });
  check('B likes post (liked=true, count=1)', like1.status === 200 && like1.json?.data?.liked === true && like1.json?.data?.likes_count === 1, JSON.stringify(like1.json)?.slice(0, 200));

  const like2 = await api(`/posts/${post1Data.id}/like`, { method: 'POST', token: tokenB });
  check('second toggle unlikes (liked=false, count=0)', like2.json?.data?.liked === false && like2.json?.data?.likes_count === 0, JSON.stringify(like2.json)?.slice(0, 200));

  const like3 = await api(`/posts/${post1Data.id}/like`, { method: 'POST', token: tokenB });
  check('third toggle likes again', like3.json?.data?.liked === true && like3.json?.data?.likes_count === 1);

  const likeA = await api(`/posts/${post1Data.id}/like`, { method: 'POST', token: tokenA });
  check('A also likes (count=2)', likeA.json?.data?.likes_count === 2);

  const likers = await api(`/posts/${post1Data.id}/likes`, { token: tokenA });
  check('likers list returns 2 users with profiles', likers.status === 200 && likers.json?.data?.data?.length === 2 && !!likers.json?.data?.data?.[0]?.user?.profile);

  const feedAfterLike = await api('/posts', { token: tokenB });
  const likedInFeed = feedAfterLike.json?.data?.data?.find((p) => p.id === post1Data.id);
  check('feed reflects is_liked=true + likes_count=2 for B', Boolean(likedInFeed?.is_liked) === true && likedInFeed?.likes_count === 2, JSON.stringify({ is_liked: likedInFeed?.is_liked, likes_count: likedInFeed?.likes_count }));

  const likeMissing = await api(`/posts/00000000-0000-0000-0000-000000000000/like`, { method: 'POST', token: tokenB });
  check('liking a missing post is 404', likeMissing.status === 404, `got ${likeMissing.status}`);

  console.log('== Comments ==');
  const c1 = await api(`/posts/${post1Data.id}/comments`, { method: 'POST', token: tokenB, body: { content: 'Nice post!' } });
  check('B comments (201, author present)', c1.status === 201 && c1.json?.data?.comment?.user?.user_name === userB.user_name, JSON.stringify(c1.json)?.slice(0, 300));
  const comment1 = c1.json?.data?.comment;

  const cEmpty = await api(`/posts/${post1Data.id}/comments`, { method: 'POST', token: tokenB, body: { content: '' } });
  check('empty comment rejected (422)', cEmpty.status === 422, `got ${cEmpty.status}`);

  const cEdit = await api(`/comments/${comment1.id}`, { method: 'PUT', token: tokenB, body: { content: 'Nice post! (edited)' } });
  check('B edits own comment', cEdit.status === 200 && cEdit.json?.data?.comment?.content === 'Nice post! (edited)');

  const cEditForeign = await api(`/comments/${comment1.id}`, { method: 'PUT', token: tokenA, body: { content: 'hijacked' } });
  check("A cannot edit B's comment (403)", cEditForeign.status === 403, `got ${cEditForeign.status}`);

  const c2 = await api(`/posts/${post1Data.id}/comments`, { method: 'POST', token: tokenA, body: { content: 'Thanks Bob!' } });
  check('A comments too', c2.status === 201);

  const commentList = await api(`/posts/${post1Data.id}/comments`, { token: tokenA });
  const commentItems = commentList.json?.data?.data;
  check('comment list has 2, oldest first', commentItems?.length === 2 && commentItems[0].id === comment1.id, JSON.stringify(commentItems?.map((c) => c.content)));

  const postWithCounts = await api(`/posts/${post1Data.id}`, { token: tokenA });
  check('post shows comments_count=2', postWithCounts.json?.data?.comments_count === 2, JSON.stringify(postWithCounts.json?.data?.comments_count));

  const cDeleteByPostOwner = await api(`/comments/${comment1.id}`, { method: 'DELETE', token: tokenA });
  check("post owner can delete B's comment", cDeleteByPostOwner.status === 200, `got ${cDeleteByPostOwner.status}`);

  const commentsAfterDelete = await api(`/posts/${post1Data.id}/comments`, { token: tokenA });
  check('comment list has 1 after delete', commentsAfterDelete.json?.data?.data?.length === 1);

  console.log('== Ownership on posts ==');
  const editForeign = await api(`/posts/${post1Data.id}`, { method: 'PUT', token: tokenB, body: { content: 'hijacked!' } });
  check("B cannot edit A's post (403)", editForeign.status === 403, `got ${editForeign.status}`);

  const deleteForeign = await api(`/post/${post1Data.id}`, { method: 'DELETE', token: tokenB });
  check("B cannot delete A's post (403)", deleteForeign.status === 403, `got ${deleteForeign.status}`);

  const editOwn = await api(`/posts/${post1Data.id}`, { method: 'PUT', token: tokenA, body: { content: 'Hello world (edited)' } });
  check('A edits own post', editOwn.status === 200 && editOwn.json?.data?.post?.content === 'Hello world (edited)', JSON.stringify(editOwn.json)?.slice(0, 200));
  check('edited post keeps like/comment counts', editOwn.json?.data?.post?.likes_count === 2 && editOwn.json?.data?.post?.comments_count === 1);

  console.log('== User posts + search ==');
  const userPosts = await api(`/user/${idA}/posts`, { token: tokenB });
  check("A's posts endpoint returns 3", userPosts.status === 200 && userPosts.json?.data?.data?.length === 3, `got ${userPosts.json?.data?.data?.length}`);

  const search = await api(`/posts/search?query=picture`, { token: tokenB });
  check('search finds the picture post', search.status === 200 && search.json?.data?.data?.some((p) => p.id === post2Data.id), JSON.stringify(search.json?.data?.data?.map((p) => p.content)));

  console.log('== Delete + cleanup ==');
  const del = await api(`/post/${post2Data.id}`, { method: 'DELETE', token: tokenA });
  check('A deletes own image post', del.status === 200);

  if (attachment?.url) {
    // Laravel 11's storage serve route answers 403 for missing files behind
    // nginx's try_files fallback; both statuses mean the file is gone.
    const imgAfter = await fetch(attachment.url);
    check('attachment file removed from storage', imgAfter.status === 404 || imgAfter.status === 403, `got ${imgAfter.status}`);
  }

  const feedFinal = await api('/posts', { token: tokenA });
  check('deleted post gone from feed', !feedFinal.json?.data?.data?.some((p) => p.id === post2Data.id));

  const showDeleted = await api(`/posts/${post2Data.id}`, { token: tokenA });
  check('deleted post returns 404', showDeleted.status === 404, `got ${showDeleted.status}`);

  console.log('== Pagination ==');
  // Create 12 quick posts as B to force a second page (per_page defaults to 10)
  for (let i = 0; i < 12; i++) {
    const f = new FormData();
    f.append('content', `Bulk post ${i}`);
    await api('/post', { method: 'POST', token: tokenB, form: f });
  }
  const page1 = await api('/posts?page=1', { token: tokenA });
  const page2 = await api('/posts?page=2', { token: tokenA });
  check('page 1 has 10 posts', page1.json?.data?.data?.length === 10, `got ${page1.json?.data?.data?.length}`);
  check('page 2 has the rest', (page2.json?.data?.data?.length ?? 0) >= 1);
  check('page 1 exposes next_page_url', !!page1.json?.data?.next_page_url);
  const ids1 = new Set(page1.json?.data?.data?.map((p) => p.id));
  check('no overlap between pages', !page2.json?.data?.data?.some((p) => ids1.has(p.id)));

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log('Failures:');
    failures.forEach((f) => console.log(` - ${f}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
