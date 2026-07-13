// End-to-end tests for profiles + account security:
// profile show/update, avatar upload, change password (token revocation),
// forgot/reset password via the logged email, and 401 semantics.
//
// Run with the docker stack up:  node scripts/profile-e2e.mjs
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.join(__dirname, '..', 'server', 'storage', 'logs', 'laravel.log');
const BASE = 'http://localhost:8080/api';

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

async function api(pathname, { method = 'GET', token, body, form } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${pathname}`, { method, headers, body: payload });
  let json = null;
  try {
    json = await res.json();
  } catch { /* empty */ }
  return { status: res.status, json };
}

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function main() {
  const suffix = Date.now().toString(36);
  const email = `pat_${suffix}@example.com`;
  const userName = `pat_${suffix}`;

  console.log('== Setup ==');
  const reg = await api('/auth/register', {
    method: 'POST',
    body: {
      first_name: 'Pat', last_name: 'Profile',
      user_name: userName, email,
      password: 'password123', password_confirmation: 'password123',
    },
  });
  const token = reg.json?.data?.token;
  check('register works', reg.status === 201 && !!token);

  console.log('== Profile show ==');
  const show = await api(`/profiles/${userName}`, { token });
  check('profile fetched by user_name', show.status === 200 && show.json?.data?.user?.user_name === userName);
  check('profile includes posts_count', typeof show.json?.data?.posts_count === 'number');

  const missing = await api('/profiles/no_such_user_xyz', { token });
  check('unknown profile is 404', missing.status === 404, `got ${missing.status}`);

  console.log('== Profile update ==');
  const update = await api('/profile', {
    method: 'PUT', token,
    body: { first_name: 'Patricia', last_name: 'Profile', bio: 'Testing bios', location: 'Addis Ababa', birthdate: '1999-04-01' },
  });
  check('profile update saves', update.status === 200 && update.json?.data?.user?.profile?.bio === 'Testing bios', JSON.stringify(update.json)?.slice(0, 200));
  check('name change persists', update.json?.data?.user?.profile?.first_name === 'Patricia');

  const badDate = await api('/profile', { method: 'PUT', token, body: { birthdate: '2999-01-01' } });
  check('future birthdate rejected (422)', badDate.status === 422, `got ${badDate.status}`);

  console.log('== Avatar upload ==');
  const form = new FormData();
  form.append('avatar', new Blob([Buffer.from(PNG_BASE64, 'base64')], { type: 'image/png' }), 'avatar.png');
  const avatar = await api('/profile/avatar', { method: 'POST', token, form });
  const avatarUrl = avatar.json?.data?.user?.profile?.profile_picture_URL;
  check('avatar upload stores a URL', avatar.status === 200 && !!avatarUrl && avatarUrl.startsWith('http'), JSON.stringify(avatar.json)?.slice(0, 200));

  if (avatarUrl) {
    const img = await fetch(avatarUrl);
    check('avatar URL serves the image', img.status === 200 && (img.headers.get('content-type') || '').startsWith('image/'), `status ${img.status}`);
  }

  const badAvatarForm = new FormData();
  badAvatarForm.append('avatar', new Blob([Buffer.from('not an image')], { type: 'text/plain' }), 'evil.txt');
  const badAvatar = await api('/profile/avatar', { method: 'POST', token, form: badAvatarForm });
  check('non-image avatar rejected (422)', badAvatar.status === 422, `got ${badAvatar.status}`);

  console.log('== Change password ==');
  const wrongCurrent = await api('/auth/change-password', {
    method: 'POST', token,
    body: { current_password: 'nope-wrong', password: 'newpassword456', password_confirmation: 'newpassword456' },
  });
  check('wrong current password rejected (422)', wrongCurrent.status === 422, `got ${wrongCurrent.status}`);

  // A second session that should die when the password changes
  const otherLogin = await api('/auth/login', { method: 'POST', body: { email, password: 'password123' } });
  const otherToken = otherLogin.json?.data?.token;

  const change = await api('/auth/change-password', {
    method: 'POST', token,
    body: { current_password: 'password123', password: 'newpassword456', password_confirmation: 'newpassword456' },
  });
  check('change password succeeds', change.status === 200, JSON.stringify(change.json)?.slice(0, 200));

  const oldLogin = await api('/auth/login', { method: 'POST', body: { email, password: 'password123' } });
  check('old password no longer works', oldLogin.status === 401, `got ${oldLogin.status}`);

  const newLogin = await api('/auth/login', { method: 'POST', body: { email, password: 'newpassword456' } });
  check('new password works', newLogin.status === 200);

  const revoked = await api('/user', { token: otherToken });
  check('other sessions were revoked (401)', revoked.status === 401, `got ${revoked.status}`);

  const currentStillValid = await api('/user', { token });
  check('current session stays valid', currentStillValid.status === 200, `got ${currentStillValid.status}`);

  console.log('== Forgot / reset password (via logged email) ==');
  const forgot = await api('/auth/forgot-password', { method: 'POST', body: { email } });
  check('forgot-password accepts the request', forgot.status === 200);

  const unknownForgot = await api('/auth/forgot-password', { method: 'POST', body: { email: 'ghost@nowhere.test' } });
  check('unknown email gets the same response (no probing)', unknownForgot.status === 200);

  // The log mailer writes the email into laravel.log; pull the newest token
  await new Promise((r) => setTimeout(r, 1000));
  const log = await readFile(LOG_PATH, 'utf8');
  const matches = [...log.matchAll(/reset-password\?token=3D([a-f0-9]+)|reset-password\?token=([a-f0-9]+)/g)];
  const lastMatch = matches.at(-1);
  const resetToken = lastMatch?.[1] || lastMatch?.[2];
  check('reset link found in mail log', !!resetToken, `matches: ${matches.length}`);

  if (resetToken) {
    const badReset = await api('/auth/reset-password', {
      method: 'POST',
      body: { token: 'bogus-token', email, password: 'resetpass789', password_confirmation: 'resetpass789' },
    });
    check('bogus reset token rejected (422)', badReset.status === 422, `got ${badReset.status}`);

    const reset = await api('/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, email, password: 'resetpass789', password_confirmation: 'resetpass789' },
    });
    check('reset with real token succeeds', reset.status === 200, JSON.stringify(reset.json)?.slice(0, 200));

    const resetLogin = await api('/auth/login', { method: 'POST', body: { email, password: 'resetpass789' } });
    check('login works with the reset password', resetLogin.status === 200);

    const oldTokenDead = await api('/user', { token });
    check('all previous tokens revoked after reset', oldTokenDead.status === 401, `got ${oldTokenDead.status}`);
  }

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
