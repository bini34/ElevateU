import { useState, useEffect } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { fetcher } from '@/utils/fetcher';

if (typeof window !== 'undefined') {
    window.Pusher = Pusher;
}

const useEcho = () => {
    const [echoInstance, setEchoInstance] = useState(null);

    useEffect(() => {
        const echo = new Echo({
            broadcaster: 'pusher', // Confirm if 'reverb' is correct or 'pusher' should be used
            key: process.env.NEXT_PUBLIC_REVERB_APP_KEY, // Use NEXT_PUBLIC to expose env variables in Next.js
            authorizer: channel => {
                return {
                    authorize: (socketId, callback) => {
                        fetcher('/api/broadcasting/auth', {
                            method: 'POST',
                            body: JSON.stringify({
                                socket_id: socketId,
                                channel_name: channel.name
                            }),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }).then(response => {
                            callback(false, response);
                        }).catch(error => {
                            callback(true, error);
                        });
                    }
                };
            },
            wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
            wsPort: process.env.NEXT_PUBLIC_REVERB_PORT || 80,
            wssPort: process.env.NEXT_PUBLIC_REVERB_PORT || 443,
            forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'https') === 'https',
            enabledTransports: ['ws', 'wss'],
        });

        setEchoInstance(echo);

        // Clean up the Echo instance on unmount
        return () => {
            echo.disconnect();
        };
    }, []);

    return echoInstance;
};

export default useEcho;
