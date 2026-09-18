"use client";
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { getEcho } from '@/lib/echo';

// Session hydration and sign-in can happen after this hook first mounts.
// Create sockets in an effect and refresh every consumer when the token changes.
const useEcho = () => {
    const { authToken } = useContext(AuthContext);
    const [echo, setEcho] = useState(null);
    const [connectionState, setConnectionState] = useState('initialized');

    useEffect(() => {
        const instance = authToken ? getEcho() : null;
        setEcho(instance);
        if (!instance) {
            setConnectionState(authToken ? 'unavailable' : 'initialized');
            return undefined;
        }

        const connection = instance.connector.pusher.connection;
        const handleStateChange = (states) => setConnectionState(states.current);
        connection.bind('state_change', handleStateChange);
        setConnectionState(connection.state);

        return () => connection.unbind('state_change', handleStateChange);
    }, [authToken]);

    return { echo, connectionState };
};

export default useEcho;
