// End-to-end tests for notifications: created on like/comment/message,
// no self-notifications, unread counts, mark-read, and live delivery on
// the recipient's private channel (broadcast leg runs via the queue worker).
//
// Run with the docker stack up:  node scripts/notifications-e2e.mjs
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, '..', 'client', 'package.json'));
const Pusher = require('pusher-js');

import { api, BASE, WS_HOST, WS_PORT, WS_TLS, reverbKey } from './e2e-support.mjs';
const REVERB_KEY = reverbKey();
const BROADCAST_EVENT = 'Illuminate\\Notifications\\Events\\BroadcastNotificationCreated';

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


function makeSocket(token) {
  return new Pusher(REVERB_KEY, {
    wsHost: WS_HOST,
    wsPort: WS_PORT,
    wssPort: WS_PORT,
    forceTLS: WS_TLS,
    enabledTransports: WS_TLS ? ['wss'] : ['ws'],
    cluster: 'mt1',
    disableStats: true,
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        fetch(`${BASE}/broadcasting/auth`, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
        })
          .then(async (res) => {
            if (!res.ok) throw new Error(`auth ${res.status}`);
            callback(null, await res.json());
          })
          .catch((err) => callback(err, null));
      },
    }),
  });
}

const waitForConnection = (pusher) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('ws connect timeout')), 8000);
    pusher.connection.bind('connected', () => {
      clearTimeout(timer);
      resolve(pusher.connection.socket_id);
    });
  });

const subscribe = (pusher, channelName) =>
  new Promise((resolve, reject) => {
    const channel = pusher.subscribe(channelName);
    const timer = setTimeout(() => reject(new Error(`subscribe timeout ${channelName}`)), 8000);
    channel.bind('pusher:subscription_succeeded', () => {
      clearTimeout(timer);
      resolve(channel);
    });
    channel.bind('pusher:subscription_error', (err) => {
      clearTimeout(timer);
      reject(new Error(`subscription_error: ${JSON.stringify(err)}`));
    });
  });

const waitForEvent = (channel, event, timeoutMs = 10000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), timeoutMs);
    channel.bind(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

async function main() {
  const suffix = Date.now().toString(36);
  const mkUser = (name) => ({
    first_name: name, last_name: 'Notify',
    user_name: `${name.toLowerCase()}_${suffix}`, email: `${name.toLowerCase()}_${suffix}@example.com`,
    password: 'password123', password_confirmation: 'password123',
  });

  console.log('== Setup ==');
  const [regA, regB] = await Promise.all([
    api('/auth/register', { method: 'POST', body: mkUser('Nora') }),
    api('/auth/register', { method: 'POST', body: mkUser('Omar') }),
  ]);
  const tokenA = regA.json?.data?.token;
  const tokenB = regB.json?.data?.token;
  const idA = regA.json?.data?.user?.id;
  check('two users registered', !!(tokenA && tokenB && idA));

  // A creates a post (uses multipart like the app does not matter here; JSON works via /post? StorePostRequest expects content/file — send form)
  const postForm = new FormData();
  postForm.append('content', 'Notify me about this post');
  const postRes = await fetch(`${BASE}/post`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${tokenA}` },
    body: postForm,
  });
  const postJson = await postRes.json();
  const postId = postJson?.data?.post?.id;
  check('A created a post', postRes.status === 201 && !!postId);

  console.log('== Live delivery ==');
  const socketA = makeSocket(tokenA);
  await waitForConnection(socketA);
  const channelA = await subscribe(socketA, `private-App.Models.User.${idA}`);
  check('A subscribed to their private notification channel', true);

  const liveLike = waitForEvent(channelA, BROADCAST_EVENT);
  const like = await api(`/posts/${postId}/like`, { method: 'POST', token: tokenB });
  check('B liked the post', like.status === 200 && like.json?.data?.liked === true);

  const likeEvent = await liveLike;
  check('A received the like notification in real time', likeEvent?.kind === 'post_liked' && likeEvent?.post_id === postId, JSON.stringify(likeEvent)?.slice(0, 200));
  check('live payload names the actor', (likeEvent?.actor?.user_name ?? '').startsWith('omar_'), JSON.stringify(likeEvent?.actor));

  const liveComment = waitForEvent(channelA, BROADCAST_EVENT);
  const comment = await api(`/posts/${postId}/comments`, { method: 'POST', token: tokenB, body: { content: 'Great post, notifying you!' } });
  check('B commented', comment.status === 201);
  const commentEvent = await liveComment;
  check('A received the comment notification live (with snippet)', commentEvent?.kind === 'post_commented' && (commentEvent?.snippet ?? '').includes('Great post'), JSON.stringify(commentEvent)?.slice(0, 200));

  const liveMessage = waitForEvent(channelA, BROADCAST_EVENT);
  const message = await api('/messages', { method: 'POST', token: tokenB, body: { message: 'DM ping', receiver_id: idA, client_uuid: crypto.randomUUID() } });
  check('B sent a direct message', message.status === 201);
  const messageEvent = await liveMessage;
  check('A received the message notification live', messageEvent?.kind === 'new_message' && messageEvent?.snippet === 'DM ping', JSON.stringify(messageEvent)?.slice(0, 200));

  socketA.disconnect();

  console.log('== Persistence + self-notification guard ==');
  const selfLike = await api(`/posts/${postId}/like`, { method: 'POST', token: tokenA });
  check('A can like own post', selfLike.status === 200);

  const list = await api('/notifications', { token: tokenA });
  const items = list.json?.data?.data ?? [];
  check('A has exactly 3 notifications (no self-notification)', items.length === 3, `got ${items.length}`);
  check('notifications carry kind + text + actor', items.every((n) => n.data?.kind && n.data?.text && n.data?.actor?.id));

  const count1 = await api('/notifications/unread-count', { token: tokenA });
  check('unread count is 3', count1.json?.data?.count === 3, `got ${count1.json?.data?.count}`);

  console.log('== Mark read ==');
  const first = items[0];
  const markOne = await api(`/notifications/${first.id}/read`, { method: 'POST', token: tokenA });
  check('mark one read succeeds', markOne.status === 200);
  const count2 = await api('/notifications/unread-count', { token: tokenA });
  check('unread count drops to 2', count2.json?.data?.count === 2, `got ${count2.json?.data?.count}`);

  const foreignMark = await api(`/notifications/${first.id}/read`, { method: 'POST', token: tokenB });
  check("B cannot touch A's notification (404)", foreignMark.status === 404, `got ${foreignMark.status}`);

  const markAll = await api('/notifications/read-all', { method: 'POST', token: tokenA });
  check('mark all read succeeds', markAll.status === 200);
  const count3 = await api('/notifications/unread-count', { token: tokenA });
  check('unread count is 0', count3.json?.data?.count === 0, `got ${count3.json?.data?.count}`);

  const bNotifications = await api('/notifications', { token: tokenB });
  check('B has no notifications of their own actions', (bNotifications.json?.data?.data ?? []).length === 0);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log('Failures:');
    failures.forEach((f) => console.log(` - ${f}`));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
