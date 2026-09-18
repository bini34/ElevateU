// These suites create real users/content. Point them only at a disposable stack.
export const BASE = (process.env.ELEVATEU_TEST_API_URL || 'http://localhost:8080/api').replace(/\/$/, '');
export const WS_HOST = process.env.ELEVATEU_TEST_WS_HOST || 'localhost';
export const WS_PORT = Number(process.env.ELEVATEU_TEST_WS_PORT || 6001);
export const WS_TLS = process.env.ELEVATEU_TEST_WS_SCHEME === 'https';
// Cold PHP autoloading through a Windows Docker bind mount can exceed 15s.
const TIMEOUT_MS = Number(process.env.ELEVATEU_TEST_TIMEOUT_MS || 60000);
if (!Number.isFinite(TIMEOUT_MS) || TIMEOUT_MS < 1000 || TIMEOUT_MS > 120000) {
  throw new Error('ELEVATEU_TEST_TIMEOUT_MS must be between 1000 and 120000.');
}

export function reverbKey() {
  const key = process.env.REVERB_APP_KEY;
  if (!key) throw new Error('Set REVERB_APP_KEY to the disposable server\'s Reverb app key before running WebSocket tests.');
  return key;
}

export async function api(pathname, { method = 'GET', token, body, form, socketId } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (socketId) headers['X-Socket-Id'] = socketId;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const response = await fetch(`${BASE}${pathname}`, {
    method, headers, body: payload, signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (response.status === 204) return { status: response.status, json: null };
  try {
    return { status: response.status, json: await response.json() };
  } catch (cause) {
    throw new Error(`${method} ${pathname} returned HTTP ${response.status} with a non-JSON body`, { cause });
  }
}
