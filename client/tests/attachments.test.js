import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import http from 'node:http';
import { loadMessageAttachment, isMessageImage } from '../src/lib/attachments.js';

const id = 'f081c1c5-9ae2-4b87-a719-a3a12bfc9985';
let server;
let requestPath;
let status = 200;
const original = process.env.NEXT_PUBLIC_BACKEND_URL;

before(async () => {
  server = http.createServer((request, response) => {
    requestPath = request.url;
    response.writeHead(status, { 'Content-Type': 'application/octet-stream' });
    response.end(Buffer.from([137, 80, 78, 71]));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  process.env.NEXT_PUBLIC_BACKEND_URL = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_BACKEND_URL;
  else process.env.NEXT_PUBLIC_BACKEND_URL = original;
  await new Promise((resolve) => server.close(resolve));
});

test('uses the API-relative ID, ignores untrusted URLs and preserves binary bytes', async () => {
  const blob = await loadMessageAttachment({ id, url: 'https://attacker.invalid/collect', mime: 'image/png' });
  assert.equal(requestPath, `/api/message-attachments/${id}`);
  assert.equal(blob.type, 'image/png');
  assert.deepEqual([...new Uint8Array(await blob.arrayBuffer())], [137, 80, 78, 71]);
});

test('never treats SVG or HTML uploads as inline image blobs', async () => {
  assert.equal(isMessageImage('image/svg+xml'), false);
  const blob = await loadMessageAttachment({ id, mime: 'text/html' });
  assert.equal(blob.type, 'application/octet-stream');
});

test('rejects an unauthorized attachment instead of creating a success blob', async () => {
  status = 403;
  try {
    await assert.rejects(loadMessageAttachment({ id, mime: 'image/png' }), (error) => error.status === 403);
  } finally {
    status = 200;
  }
});

test('refuses malformed attachment identifiers before making a request', async () => {
  await assert.rejects(loadMessageAttachment({ id: '../../private', mime: 'image/png' }), /valid identifier/);
});

test('canceled media requests do not return downloaded bytes', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(loadMessageAttachment({ id, mime: 'image/png' }, { signal: controller.signal }));
});
