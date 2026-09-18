import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { fetcher } from '@/utils/fetcher';
import { getToken } from '@/lib/token';

// Singleton Echo connection shared by every chat surface. pusher-js handles
// automatic reconnection with backoff; subscriptions are re-established (and
// re-authorized) transparently after a reconnect.
let echoInstance = null;
let echoToken = null;

export function getEcho() {
    if (typeof window === 'undefined') return null;
    const token = getToken();
    if (echoInstance && echoToken !== token) disconnectEcho();
    if (echoInstance) return echoInstance;
    if (!token || !process.env.NEXT_PUBLIC_REVERB_APP_KEY) return null;

    window.Pusher = Pusher;

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost',
        wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT || 80),
        wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT || 443),
        forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'http') === 'https',
        enabledTransports: ['ws', 'wss'],
        // Authorize private/presence channels through the API with the
        // bearer token attached by our fetcher.
        authorizer: (channel) => ({
            authorize: (socketId, callback) => {
                fetcher('/broadcasting/auth', {
                    method: 'POST',
                    body: JSON.stringify({
                        socket_id: socketId,
                        channel_name: channel.name,
                    }),
                })
                    .then((response) => callback(null, response))
                    .catch((error) => callback(error, null));
            },
        }),
    });
    echoToken = token;

    // Expose the socket id so the fetcher can send X-Socket-Id, letting the
    // server exclude the sender's own socket via broadcast()->toOthers().
    const connection = echoInstance.connector.pusher.connection;
    connection.bind('connected', () => {
        window.__echoSocketId = connection.socket_id;
    });
    connection.bind('disconnected', () => {
        window.__echoSocketId = null;
    });

    return echoInstance;
}

export function disconnectEcho() {
    if (echoInstance) {
        echoInstance.disconnect();
        echoInstance = null;
    }
    echoToken = null;
    if (typeof window !== 'undefined') {
        window.__echoSocketId = null;
    }
}

