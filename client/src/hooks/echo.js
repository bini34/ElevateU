"use client";
import { useEffect, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { fetcher } from '@/utils/fetcher';
import { getToken } from '@/lib/token';

// Singleton Echo connection shared by every chat surface. pusher-js handles
// automatic reconnection with backoff; subscriptions are re-established (and
// re-authorized) transparently after a reconnect.
let echoInstance = null;

export function getEcho() {
    if (typeof window === 'undefined') return null;
    if (echoInstance) return echoInstance;
    if (!getToken()) return null; // don't open sockets for guests

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
    if (typeof window !== 'undefined') {
        window.__echoSocketId = null;
    }
}

// Hook returning the shared Echo instance plus the live connection state
// ('connected', 'connecting', 'unavailable', ...) for UI indicators.
const useEcho = () => {
    const [echo] = useState(() => getEcho());
    const [connectionState, setConnectionState] = useState(
        () => echo?.connector?.pusher?.connection?.state ?? 'initialized'
    );

    useEffect(() => {
        if (!echo) return undefined;

        const connection = echo.connector.pusher.connection;
        const handleStateChange = (states) => setConnectionState(states.current);
        connection.bind('state_change', handleStateChange);
        setConnectionState(connection.state);

        return () => {
            connection.unbind('state_change', handleStateChange);
        };
    }, [echo]);

    return { echo, connectionState };
};

export default useEcho;
