import { register } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
register('./tsx-loader.mjs', import.meta.url);
const { middleware, config } = await import('../src/middleware.js');

function withEnvironment(environment, callback) {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = environment;
  try { callback(); } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
}

test('production preview is a hard 404 regardless of query, subpath or token', () => {
  withEnvironment('production', () => {
    for (const path of ['/design-system', '/design-system?theme=dark', '/design-system/example']) {
      for (const headers of [{}, { Cookie: 'token=test-only' }]) {
        const response = middleware(new NextRequest(`http://localhost${path}`, { headers }));
        assert.equal(response.status, 404);
        assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
        assert.equal(response.headers.get('cache-control'), 'no-store');
      }
    }
    assert.ok(config.matcher.includes('/design-system/:path*'));
  });
});

test('development preview can render without a product session', () => {
  withEnvironment('development', () => {
    assert.equal(middleware(new NextRequest('http://localhost/design-system')).headers.get('x-middleware-next'), '1');
  });
});

test('preview guard preserves existing protected-route redirects in both environments', () => {
  for (const environment of ['development', 'production']) withEnvironment(environment, () => {
    for (const path of ['/', '/chat', '/groups/example', '/settings', '/notifications']) {
      const response = middleware(new NextRequest(`http://localhost${path}`));
      assert.equal(response.status, 307);
      assert.equal(response.headers.get('location'), 'http://localhost/signin');
      const authenticated = middleware(new NextRequest(`http://localhost${path}`, { headers: { Cookie: 'token=test-only' } }));
      assert.equal(authenticated.headers.get('x-middleware-next'), '1');
    }
  });
});
