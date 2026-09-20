// HTTP smoke tests for a built Next server and a disposable Laravel stack.
// Private attachment authorization is covered by chat-e2e.mjs; optimizer
// rejection here only checks that private paths cannot enter image processing.
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { api } from './e2e-support.mjs';

const requireClient = createRequire(new URL('../client/package.json', import.meta.url));
const sharp = requireClient('sharp');

function origin(value, name) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
      || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${name} must be an HTTP(S) origin without credentials or a path.`);
  }
  return url.origin;
}

const CLIENT = origin(process.env.ELEVATEU_TEST_CLIENT_URL || 'http://127.0.0.1:13000', 'ELEVATEU_TEST_CLIENT_URL');
const IMAGE_ORIGIN = origin(process.env.ELEVATEU_TEST_IMAGE_ORIGIN || 'http://host.docker.internal:18080', 'ELEVATEU_TEST_IMAGE_ORIGIN');
const TIMEOUT_MS = Number(process.env.ELEVATEU_TEST_TIMEOUT_MS || 60000);
let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) passed++;
  else failed++;
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
}

function request(url, options = {}) {
  return fetch(url, { ...options, redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
}

function optimizerUrl(source, width) {
  const url = new URL('/_next/image', CLIENT);
  url.search = new URLSearchParams({ url: source, w: String(width), q: '75' });
  return url;
}

// API APP_URL can use localhost for host-side tests while the Next container
// reaches the same API via host.docker.internal. Only the optimizer request
// substitutes this explicit origin, which must match its build-time allowlist.
// Raw public URLs below are fetched exactly as returned by Laravel.
function optimizerSource(publicUrl, folder) {
  const url = new URL(publicUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
      || url.search || url.hash || !url.pathname.startsWith(`/storage/uploads/${folder}/`)) {
    throw new Error('Upload returned an unexpected public image URL.');
  }
  return new URL(url.pathname, IMAGE_ORIGIN).href;
}

async function publicBytes(name, url, expected) {
  const response = await request(url);
  const bytes = Buffer.from(await response.arrayBuffer());
  check(`${name} serves the original bytes`, response.status === 200
    && (response.headers.get('content-type') || '').startsWith('image/')
    && bytes.equals(expected), `HTTP ${response.status}`);
}

async function optimizedImage(name, source, original) {
  for (const width of [64, 128]) {
    const response = await request(optimizerUrl(source, width), { headers: { Accept: 'image/webp' } });
    const bytes = Buffer.from(await response.arrayBuffer());
    check(`${name} at ${width}px negotiates WebP`, response.status === 200
      && response.headers.get('content-type') === 'image/webp', `HTTP ${response.status}`);
    let decoded;
    try {
      // Full pixel decoding catches corrupt/truncated responses that metadata
      // parsing alone could accept.
      decoded = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
    } catch {
      check(`${name} at ${width}px decodes at the expected dimensions`, false);
      continue;
    }
    const expectedWidth = Math.min(width, original.width);
    const expectedHeight = Math.round(original.height * expectedWidth / original.width);
    check(`${name} at ${width}px decodes at the expected dimensions`,
      decoded.info.width === expectedWidth && decoded.info.height === expectedHeight
      && decoded.data.length > 0);
  }
}

async function main() {
  let token;
  let postId;
  try {
    const signin = await request(new URL('/signin', CLIENT));
    check('production sign-in page responds', signin.status === 200, `HTTP ${signin.status}`);
    const protectedPage = await request(new URL('/', CLIENT));
    check('anonymous root redirects to sign-in', protectedPage.status === 307
      && new URL(protectedPage.headers.get('location') || '/', CLIENT).pathname === '/signin');

    const localBytes = await readFile(new URL('../client/public/images/avator.png', import.meta.url));
    await publicBytes('local avatar asset', new URL('/images/avator.png', CLIENT), localBytes);
    await optimizedImage('local avatar asset', '/images/avator.png', await sharp(localBytes).metadata());

    const suffix = `${Date.now().toString(36)}${randomBytes(4).toString('hex')}`;
    const password = `Eu!${randomBytes(24).toString('base64url')}`;
    const registration = await api('/auth/register', {
      method: 'POST',
      body: {
        first_name: 'Image', last_name: 'Test', user_name: `image_${suffix}`,
        email: `image_${suffix}@elevateu.test`, password, password_confirmation: password,
      },
    });
    token = registration.json?.data?.token;
    check('disposable image account registers', registration.status === 201 && !!token,
      `HTTP ${registration.status}`);
    if (!token) throw new Error('Image fixture registration failed.');

    const png = await sharp({ create: {
      width: 256, height: 128, channels: 3, background: { r: 32, g: 128, b: 224 },
    } }).png().toBuffer();
    const avatarForm = new FormData();
    avatarForm.append('avatar', new Blob([png], { type: 'image/png' }), 'image-test-avatar.png');
    const avatar = await api('/profile/avatar', { method: 'POST', token, form: avatarForm });
    const avatarUrl = avatar.json?.data?.user?.profile?.profile_picture_URL;
    check('avatar upload succeeds', avatar.status === 200 && !!avatarUrl, `HTTP ${avatar.status}`);
    if (!avatarUrl) throw new Error('Avatar fixture upload failed.');

    const postForm = new FormData();
    postForm.append('content', 'Disposable image optimizer regression fixture');
    postForm.append('file[0]', new Blob([png], { type: 'image/png' }), 'image-test-post.png');
    const post = await api('/post', { method: 'POST', token, form: postForm });
    postId = post.json?.data?.post?.id;
    const postUrl = post.json?.data?.post?.attachments?.[0]?.url;
    check('post image upload succeeds', post.status === 201 && !!postId && !!postUrl, `HTTP ${post.status}`);
    if (!postUrl) throw new Error('Post image fixture upload failed.');

    await publicBytes('uploaded avatar', avatarUrl, png);
    await publicBytes('post media', postUrl, png);
    await optimizedImage('uploaded avatar', optimizerSource(avatarUrl, 'avatars'), { width: 256, height: 128 });
    await optimizedImage('post media', optimizerSource(postUrl, 'posts'), { width: 256, height: 128 });

    const privatePath = '/api/message-attachments/00000000-0000-0000-0000-000000000000';
    const rejectedSources = [
      ['private attachment API', new URL(privatePath, IMAGE_ORIGIN).href],
      ['legacy storage message path', new URL('/storage/uploads/messages/private.png', IMAGE_ORIGIN).href],
      ['legacy public message path', new URL('/uploads/messages/private.png', IMAGE_ORIGIN).href],
      ['unlisted external origin', 'https://example.invalid/image.png'],
    ];
    // No bearer token, cookie or credential query parameter enters the optimizer.
    for (const [name, source] of rejectedSources) {
      const response = await request(optimizerUrl(source, 64), { headers: { Accept: 'image/webp' } });
      check(`optimizer rejects ${name}`, response.status === 400, `HTTP ${response.status}`);
      await response.arrayBuffer();
    }
  } finally {
    // The disposable stack removes the account/avatar after verification.
    // Remove our post and revoke our token even if an image check failed.
    if (postId && token) {
      try {
        const deletion = await api(`/post/${postId}`, { method: 'DELETE', token });
        check('fixture post is deleted', deletion.status === 200, `HTTP ${deletion.status}`);
      } catch {
        check('fixture post is deleted', false, 'cleanup request failed');
      }
    }
    if (token) {
      try {
        const logout = await api('/auth/logout', { method: 'POST', token });
        check('fixture session is revoked', logout.status === 200, `HTTP ${logout.status}`);
      } catch {
        check('fixture session is revoked', false, 'cleanup request failed');
      }
    }
  }
}

main().catch((error) => {
  failed++;
  // API helper errors contain method/status, never identity or response bodies.
  console.error(`  FAIL  Image suite stopped: ${error.message}`);
}).finally(() => {
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exitCode = failed ? 1 : 0;
});
