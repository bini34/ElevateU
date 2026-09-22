import { register } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
register('./tsx-loader.mjs', import.meta.url);
const { validateAuth, authFailure, recoveryMessage, invalidResetMessage } = await import('../src/lib/auth-form.ts');
const { PasswordInput } = await import('../src/components/ui/PasswordInput.tsx');
const registration = { first_name: 'Ada', last_name: 'Lee', user_name: 'ada', email: 'ada@example.test', password: 'correct horse', password_confirmation: 'correct horse' };

test('login requires email/password without imposing registration password rules', () => {
  assert.deepEqual(validateAuth('login', { email: 'a@example.test', password: 'a' }), {});
  assert.deepEqual(Object.keys(validateAuth('login', {})), ['email', 'password']);
  assert.ok(validateAuth('login', { email: 'bad address', password: 'a' }).email);
});
test('registration validates all six fields and matching backend password bounds', () => {
  assert.equal(Object.keys(validateAuth('register', {})).length, 6);
  assert.deepEqual(validateAuth('register', registration), {});
  assert.ok(validateAuth('register', { ...registration, password_confirmation: 'wrong' }).password_confirmation);
  for (const password of ['1234567', 'x'.repeat(4097)]) assert.ok(validateAuth('register', { ...registration, password, password_confirmation: password }).password);
  for (const password of ['a'.repeat(8), 'a'.repeat(4096), '🌱'.repeat(8)]) assert.deepEqual(validateAuth('register', { ...registration, password, password_confirmation: password }), {});
  assert.ok(validateAuth('register', { ...registration, first_name: 'x'.repeat(256) }).first_name);
});
test('recovery validates email and reset confirms the password', () => {
  assert.deepEqual(validateAuth('forgot', { email: registration.email }), {});
  assert.ok(validateAuth('forgot', { email: 'x' }).email);
  assert.deepEqual(validateAuth('reset', registration), {});
  assert.ok(validateAuth('reset', { ...registration, password_confirmation: '' }).password_confirmation);
});
test('legacy registration validation maps duplicate email and username safely', () => {
  const result = authFailure('register', { status: 400, data: { message: ['The email has already been taken.', 'The user name has already been taken.', 'SQL sensitive detail'] } });
  assert.deepEqual(result.errors, { email: 'Email is already in use.', user_name: 'Username is already in use.' });
  assert.equal(result.message, '');
});
test('structured validation maps known fields without exposing raw details', () => {
  const result = authFailure('reset', { status: 422, data: { errors: { password: ['The password field confirmation does not match.'], email: ['SECRET SQL'], admin: ['INTERNAL'] } } });
  assert.equal(result.errors.password_confirmation, 'Passwords do not match.');
  assert.doesNotMatch(JSON.stringify(result), /SECRET|SQL|INTERNAL/);
  const unexpected = authFailure('login', { status: 422, data: { errors: { first_name: ['Unexpected field'] } } });
  assert.deepEqual(unexpected.errors, {});
  assert.ok(unexpected.message, 'unexpected fields still produce visible form feedback');
});
test('credentials, throttling, network and unexpected errors have safe feedback', () => {
  assert.equal(authFailure('login', { status: 401 }).message, 'Invalid email or password.');
  assert.match(authFailure('forgot', { status: 429 }).message, /wait/);
  assert.match(authFailure('login', {}).message, /connection/);
  assert.doesNotMatch(authFailure('register', { status: 500, data: { message: 'SQL SECRET' } }).message, /SQL|SECRET/);
  assert.doesNotMatch(authFailure('login', { status: 400, data: { message: ['The password field is required.'] } }).errors.password, /8|4096/);
});
test('recovery is neutral and all invalid reset links share one message', () => {
  assert.match(recoveryMessage, /^If an account exists/);
  for (const message of ['Unknown user', 'Expired token', 'Reused token']) assert.equal(authFailure('reset', { status: 422, data: { message } }).message, invalidResetMessage);
});
test('password controls remain labeled and password-manager friendly', () => {
  const html = render(h(PasswordInput, { label: 'Confirm password', name: 'password_confirmation', autoComplete: 'new-password', required: true }));
  assert.match(html, /type="password"/);
  assert.match(html, /autoComplete="new-password"/);
  assert.match(html, /aria-label="Show confirm password"/);
  assert.match(html, /type="button"/);
});
