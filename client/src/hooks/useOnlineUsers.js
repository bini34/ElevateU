"use client";
import { useEffect, useState } from 'react';
import useEcho from './echo';
import { subscribeToOnlineUsers } from '@/lib/presence';

// Joins the "online" presence channel and tracks which user ids are
// currently connected. Presence membership is managed by the server, so
// this survives reconnects automatically.
export default function useOnlineUsers() {
  const { echo, connectionState } = useEcho();
  const [onlineIds, setOnlineIds] = useState(() => new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    setOnlineIds(new Set());
    setError(null);
    if (!echo) return undefined;
    return subscribeToOnlineUsers(echo, setOnlineIds, setError);
  }, [echo]);

  return { onlineIds, connectionState, error };
}
