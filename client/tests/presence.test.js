import assert from 'node:assert/strict';
import { test } from 'node:test';
import { subscribeToOnlineUsers } from '../src/lib/presence.js';

function createEcho() {
  const events = {};
  const channel = Object.fromEntries(['here', 'joining', 'leaving', 'error'].map((event) => [event, (callback) => {
    events[event] = callback;
    return channel;
  }]));
  return {
    events, joins: 0, leaves: 0,
    join(name) { assert.equal(name, 'online'); this.joins++; return channel; },
    leave(name) { assert.equal(name, 'online'); this.leaves++; },
  };
}

test('late consumers receive current presence and one consumer cannot disconnect another', () => {
  const echo = createEcho();
  let listIds;
  let chatIds;
  const leaveList = subscribeToOnlineUsers(echo, (ids) => { listIds = ids; }, () => {});
  echo.events.here([{ id: 'first' }]);
  const leaveChat = subscribeToOnlineUsers(echo, (ids) => { chatIds = ids; }, () => {});
  assert.equal(echo.joins, 1);
  assert.deepEqual([...chatIds], ['first']);
  leaveChat();
  assert.equal(echo.leaves, 0);
  echo.events.joining({ id: 'second' });
  assert.deepEqual([...listIds], ['first', 'second']);
  echo.events.leaving({ id: 'first' });
  assert.deepEqual([...listIds], ['second']);
  leaveList();
  assert.equal(echo.leaves, 1);
});

test('presence errors clear stale users and reach each consumer', () => {
  const echo = createEcho();
  let ids;
  let error;
  const cleanup = subscribeToOnlineUsers(echo, (next) => { ids = next; }, (next) => { error = next; });
  echo.events.here([{ id: 'first' }]);
  echo.events.error({ message: 'Subscription denied.' });
  assert.equal(ids.size, 0);
  assert.equal(error, 'Subscription denied.');
  echo.events.here([{ id: 'second' }]);
  assert.equal(error, null);
  cleanup();
});

test('a new session has no users left over from the previous connection', () => {
  const echo = createEcho();
  const cleanup = subscribeToOnlineUsers(echo, () => {}, () => {});
  echo.events.here([{ id: 'previous-user' }]);
  cleanup();
  let ids;
  const nextCleanup = subscribeToOnlineUsers(echo, (next) => { ids = next; }, () => {});
  assert.equal(echo.joins, 2);
  assert.equal(ids.size, 0);
  nextCleanup();
});
