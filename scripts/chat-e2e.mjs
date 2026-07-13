// End-to-end tests for ElevateU chat: REST (idempotency, authorization,
// history, read receipts, cards) and live WebSockets via Reverb (delivery,
// toOthers exclusion, typing whispers, presence, read events).
//
// Run with the docker stack up:  node scripts/chat-e2e.mjs
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, '..', 'client', 'package.json'));
const Pusher = require('pusher-js');

const BASE = 'http://localhost:8080/api';
const REVERB_KEY = process.env.REVERB_APP_KEY || 'ls7yo6wrxrmbtvuv86qo';
const WS_HOST = 'localhost';
const WS_PORT = 6001;

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

async function api(pathname, { method = 'GET', token, body, form, socketId } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (socketId) headers['X-Socket-Id'] = socketId;
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

function makeSocket(token, name) {
  const pusher = new Pusher(REVERB_KEY, {
    wsHost: WS_HOST,
    wsPort: WS_PORT,
    forceTLS: false,
    enabledTransports: ['ws'],
    cluster: 'mt1', // required by pusher-js, unused with a custom wsHost
    disableStats: true,
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        fetch(`${BASE}/broadcasting/auth`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
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
  pusher._name = name;
  return pusher;
}

const waitForConnection = (pusher) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${pusher._name} ws connect timeout`)), 8000);
    pusher.connection.bind('connected', () => {
      clearTimeout(timer);
      resolve(pusher.connection.socket_id);
    });
    pusher.connection.bind('failed', () => reject(new Error('connection failed')));
  });

const subscribe = (pusher, channelName) =>
  new Promise((resolve, reject) => {
    const channel = pusher.subscribe(channelName);
    const timer = setTimeout(() => reject(new Error(`subscribe timeout ${channelName}`)), 8000);
    channel.bind('pusher:subscription_succeeded', (data) => {
      clearTimeout(timer);
      resolve({ channel, data });
    });
    channel.bind('pusher:subscription_error', (err) => {
      clearTimeout(timer);
      reject(Object.assign(new Error(`subscription_error ${channelName}`), { subscriptionError: err }));
    });
  });

const waitForEvent = (channel, event, timeoutMs = 6000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), timeoutMs);
    channel.bind(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const suffix = Date.now().toString(36);
  const mkUser = (name) => ({
    first_name: name, last_name: 'Chat',
    user_name: `${name.toLowerCase()}_${suffix}`, email: `${name.toLowerCase()}_${suffix}@example.com`,
    password: 'password123', password_confirmation: 'password123',
  });

  console.log('== Setup: register three users ==');
  const [regA, regB, regC] = await Promise.all([
    api('/auth/register', { method: 'POST', body: mkUser('Anna') }),
    api('/auth/register', { method: 'POST', body: mkUser('Ben') }),
    api('/auth/register', { method: 'POST', body: mkUser('Cara') }),
  ]);
  const tokenA = regA.json?.data?.token;
  const tokenB = regB.json?.data?.token;
  const tokenC = regC.json?.data?.token;
  const idA = regA.json?.data?.user?.id;
  const idB = regB.json?.data?.user?.id;
  check('three users registered', !!(tokenA && tokenB && tokenC));

  console.log('== REST: sending + persistence ==');
  const clientUuid = crypto.randomUUID();
  const send1 = await api('/messages', {
    method: 'POST', token: tokenA,
    body: { message: 'Hello Ben!', receiver_id: idB, client_uuid: clientUuid },
  });
  check('A sends first message (201)', send1.status === 201 && !!send1.json?.data?.message?.id, JSON.stringify(send1.json)?.slice(0, 300));
  const message1 = send1.json?.data?.message;
  const conversationId = message1?.conversation_id;
  check('conversation auto-created', !!conversationId);
  check('message includes sender profile', message1?.sender?.profile?.first_name === 'Anna');

  const resend = await api('/messages', {
    method: 'POST', token: tokenA,
    body: { message: 'Hello Ben!', receiver_id: idB, client_uuid: clientUuid },
  });
  check('idempotent retry returns same message (200, same id)', resend.status === 200 && resend.json?.data?.message?.id === message1.id, `status ${resend.status}`);

  const count = await api(`/conversations/${conversationId}/messages`, { token: tokenA });
  check('no duplicate rows after retry', count.json?.data?.total === 1, `total ${count.json?.data?.total}`);

  const selfMsg = await api('/messages', { method: 'POST', token: tokenA, body: { message: 'hi me', receiver_id: idA } });
  check('messaging yourself rejected (422)', selfMsg.status === 422, `got ${selfMsg.status}`);

  const emptyMsg = await api('/messages', { method: 'POST', token: tokenA, body: { receiver_id: idB } });
  check('empty message rejected (422)', emptyMsg.status === 422, `got ${emptyMsg.status}`);

  console.log('== REST: authorization ==');
  const outsiderHistory = await api(`/conversations/${conversationId}/messages`, { token: tokenC });
  check('outsider cannot read history (403)', outsiderHistory.status === 403, `got ${outsiderHistory.status}`);

  const outsiderRead = await api(`/conversations/${conversationId}/read`, { method: 'POST', token: tokenC });
  check('outsider cannot mark read (403)', outsiderRead.status === 403, `got ${outsiderRead.status}`);

  const noAuth = await api('/message-cards');
  check('cards require auth (401)', noAuth.status === 401, `got ${noAuth.status}`);

  console.log('== REST: history + read receipts ==');
  for (let i = 1; i <= 25; i++) {
    await api('/messages', { method: 'POST', token: tokenB, body: { message: `reply ${i}`, receiver_id: idA, client_uuid: crypto.randomUUID() } });
  }

  const page1 = await api(`/conversations/${conversationId}/messages`, { token: tokenA });
  const page2 = await api(`/conversations/${conversationId}/messages?page=2`, { token: tokenA });
  check('history paginates (20 newest first)', page1.json?.data?.data?.length === 20 && page1.json?.data?.data?.[0]?.message === 'reply 25', `first: ${page1.json?.data?.data?.[0]?.message}`);
  check('page 2 holds older messages', page2.json?.data?.data?.some((m) => m.message === 'Hello Ben!'));

  const cardsA = await api('/message-cards', { token: tokenA });
  const cardA = cardsA.json?.data?.find((c) => c.conversation_id === conversationId);
  check('card shows last message + unread count 25', cardA?.last_message === 'reply 25' && cardA?.unread_count === 25, JSON.stringify({ lm: cardA?.last_message, uc: cardA?.unread_count }));

  const readRes = await api(`/conversations/${conversationId}/read`, { method: 'POST', token: tokenA });
  check('mark read updates 25 messages', readRes.status === 200 && readRes.json?.data?.updated === 25, JSON.stringify(readRes.json?.data));

  const cardsAfter = await api('/message-cards', { token: tokenA });
  const cardAfter = cardsAfter.json?.data?.find((c) => c.conversation_id === conversationId);
  check('unread count drops to 0 after read', cardAfter?.unread_count === 0, `got ${cardAfter?.unread_count}`);

  const historyAfterRead = await api(`/conversations/${conversationId}/messages`, { token: tokenB });
  const bMessages = historyAfterRead.json?.data?.data?.filter((m) => m.sender_id === idB) ?? [];
  check('B sees read_at on messages A read', bMessages.length > 0 && bMessages.every((m) => m.read_at), `sample ${bMessages[0]?.read_at}`);

  const conversationWith = await api(`/conversations/with/${idB}`, { token: tokenA });
  check('conversations/with resolves peer + conversation', conversationWith.json?.data?.conversation_id === conversationId && conversationWith.json?.data?.user?.user_id === idB);

  console.log('== WebSockets: connection ==');
  const socketA = makeSocket(tokenA, 'A');
  const socketB = makeSocket(tokenB, 'B');
  const [socketIdA, socketIdB] = await Promise.all([waitForConnection(socketA), waitForConnection(socketB)]);
  check('both users connect to Reverb', !!(socketIdA && socketIdB), `A=${socketIdA} B=${socketIdB}`);

  const channelName = `private-conversations.${conversationId}`;
  const [subA, subB] = await Promise.all([subscribe(socketA, channelName), subscribe(socketB, channelName)]);
  check('both subscribe to the private conversation channel', !!(subA.channel && subB.channel));

  console.log('== WebSockets: delivery + no self-echo ==');
  let aGotOwnMessage = false;
  subA.channel.bind('message.sent', () => { aGotOwnMessage = true; });
  const bDelivery = waitForEvent(subB.channel, 'message.sent');
  const wsSend = await api('/messages', {
    method: 'POST', token: tokenA, socketId: socketIdA,
    body: { message: 'realtime hello', receiver_id: idB, client_uuid: crypto.randomUUID() },
  });
  check('ws-era message accepted (201)', wsSend.status === 201);
  const delivered = await bDelivery;
  check('B receives message.sent in real time', delivered?.message?.message === 'realtime hello', JSON.stringify(delivered)?.slice(0, 200));
  check('delivered payload has sender profile', delivered?.message?.sender?.profile?.first_name === 'Anna');
  await delay(1500);
  check('sender does not receive own echo (toOthers)', !aGotOwnMessage);

  console.log('== WebSockets: typing whisper ==');
  const typingReceived = waitForEvent(subB.channel, 'client-typing');
  subA.channel.trigger('client-typing', { user_id: idA });
  const typingEvent = await typingReceived;
  check('B receives typing whisper', typingEvent?.user_id === idA, JSON.stringify(typingEvent));

  console.log('== WebSockets: read receipts ==');
  const readEventPromise = waitForEvent(subA.channel, 'messages.read');
  const wsRead = await api(`/conversations/${conversationId}/read`, { method: 'POST', token: tokenB, socketId: socketIdB });
  check('B marks conversation read', wsRead.status === 200 && wsRead.json?.data?.updated >= 1, JSON.stringify(wsRead.json?.data));
  const readEvent = await readEventPromise;
  check('A receives messages.read event', readEvent?.reader_id === idB && !!readEvent?.read_at, JSON.stringify(readEvent));

  console.log('== WebSockets: presence (online status) ==');
  const presenceA = await subscribe(socketA, 'presence-online');
  const membersAtJoin = presenceA.data?.count ?? Object.keys(presenceA.data?.members ?? {}).length;
  check('A joins presence channel and sees members', membersAtJoin >= 1, `count ${membersAtJoin}`);

  const memberAdded = waitForEvent(presenceA.channel, 'pusher:member_added');
  await subscribe(socketB, 'presence-online');
  const added = await memberAdded;
  check('A sees B come online (member_added)', added?.id === idB || added?.info?.id === idB, JSON.stringify(added)?.slice(0, 200));
  check('presence member carries profile info', (added?.info?.user_name ?? '').startsWith('ben_'), JSON.stringify(added?.info));

  const memberRemoved = waitForEvent(presenceA.channel, 'pusher:member_removed', 10000);
  socketB.disconnect();
  const removed = await memberRemoved;
  check('A sees B go offline (member_removed)', removed?.id === idB || removed?.info?.id === idB, JSON.stringify(removed)?.slice(0, 200));

  console.log('== WebSockets: channel authorization ==');
  const socketC = makeSocket(tokenC, 'C');
  await waitForConnection(socketC);
  let outsiderBlocked = false;
  try {
    await subscribe(socketC, channelName);
  } catch (err) {
    outsiderBlocked = true;
  }
  check('outsider cannot subscribe to the conversation channel', outsiderBlocked);

  socketA.disconnect();
  socketC.disconnect();

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
