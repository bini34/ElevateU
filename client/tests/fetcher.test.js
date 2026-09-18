import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import http from 'node:http';
import { fetcher } from '../src/utils/fetcher.js';
import { signIn, signUp, signOut } from '../src/lib/auth.js';
import { getToken, setToken } from '../src/lib/token.js';

let server;
let lastRequest;
let onLogout;
const originalBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

before(async () => {
  server = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    lastRequest = { url: request.url, method: request.method, headers: request.headers, body: Buffer.concat(chunks).toString() };
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/api/auth/logout' && onLogout) {
      onLogout(response);
    } else if (request.url === '/api/auth/login') {
      response.writeHead(401);
      response.end(JSON.stringify({ status: 'error', message: ['Invalid credentials.'] }));
    } else if (request.url === '/api/invalid') {
      response.writeHead(422);
      response.end(JSON.stringify({ message: 'Validation failed.', errors: { content: ['Content is required.'] } }));
    } else {
      response.end(JSON.stringify({ status: 'success', data: { accepted: true } }));
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  process.env.NEXT_PUBLIC_BACKEND_URL = `http://127.0.0.1:${server.address().port}/api/`;
});

after(async () => {
  if (originalBackendUrl === undefined) delete process.env.NEXT_PUBLIC_BACKEND_URL;
  else process.env.NEXT_PUBLIC_BACKEND_URL = originalBackendUrl;
  await new Promise((resolve) => server.close(resolve));
});

test('normalizes the API URL and attaches bearer and custom headers', async () => {
  assert.deepEqual(await fetcher('/posts', { token: 'test-token', headers: { 'X-Test': 'request' } }), {
    status: 'success', data: { accepted: true },
  });
  assert.equal(lastRequest.url, '/api/posts');
  assert.equal(lastRequest.headers.authorization, 'Bearer test-token');
  assert.equal(lastRequest.headers['x-test'], 'request');
});

test('sign-in rejects invalid credentials with the API message and HTTP status', async () => {
  await assert.rejects(signIn('test@example.com', 'wrong-password'), (error) => {
    assert.equal(error.message, 'Invalid credentials.');
    assert.equal(error.status, 401);
    return true;
  });
});

test('registration uses the shared JSON transport without double encoding', async () => {
  await signUp('tester', 'Test', 'User', 'test@example.com', 'test-password', 'test-password');
  assert.equal(lastRequest.url, '/api/auth/register');
  assert.equal(lastRequest.method, 'POST');
  assert.equal(JSON.parse(lastRequest.body).user_name, 'tester');
  assert.equal(lastRequest.headers['content-type'], 'application/json');
});

test('retains field validation errors for callers', async () => {
  await assert.rejects(fetcher('/invalid'), (error) => {
    assert.equal(error.status, 422);
    assert.deepEqual(error.data.errors, { content: ['Content is required.'] });
    return true;
  });
});

test('sends file uploads with a multipart boundary', async () => {
  const body = new FormData();
  body.append('content', 'Progress update');
  body.append('file', new Blob(['image fixture'], { type: 'image/png' }), 'test.png');
  await fetcher('/post', { method: 'POST', body });
  assert.match(lastRequest.headers['content-type'], /^multipart\/form-data; boundary=/);
  assert.match(lastRequest.body, /Progress update/);
  assert.match(lastRequest.body, /filename="test.png"/);
});

test('a delayed failed logout cannot remove a new session', async () => {
  const cookies = new Map();
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  globalThis.window = { location: { protocol: 'http:', pathname: '/signin' } };
  globalThis.document = {
    get cookie() { return [...cookies].map(([key, value]) => `${key}=${value}`).join('; '); },
    set cookie(value) {
      const [pair, ...attributes] = value.split('; ');
      const [key, token] = pair.split('=');
      const expired = attributes.some((attribute) => attribute.startsWith('expires=') && new Date(attribute.slice(8)) < new Date());
      if (expired) cookies.delete(key);
      else cookies.set(key, token);
    },
  };
  try {
    setToken('old-session');
    const received = new Promise((resolve) => { onLogout = resolve; });
    const logout = signOut();
    const response = await received;
    setToken('new-session');
    response.writeHead(401);
    response.end(JSON.stringify({ message: 'Old session expired.' }));
    await assert.rejects(logout, /Old session expired/);
    assert.equal(getToken(), 'new-session');
  } finally {
    onLogout = null;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
