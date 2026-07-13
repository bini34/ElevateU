"use client";
import { useEffect, useState } from 'react';
import useEcho from './echo';

// Joins the "online" presence channel and tracks which user ids are
// currently connected. Presence membership is managed by the server, so
// this survives reconnects automatically.
export default function useOnlineUsers() {
  const { echo, connectionState } = useEcho();
  const [onlineIds, setOnlineIds] = useState(() => new Set());

  useEffect(() => {
    if (!echo) return undefined;

    echo.join('online')
      .here((users) => {
        setOnlineIds(new Set(users.map((user) => user.id)));
      })
      .joining((user) => {
        setOnlineIds((current) => new Set(current).add(user.id));
      })
      .leaving((user) => {
        setOnlineIds((current) => {
          const next = new Set(current);
          next.delete(user.id);
          return next;
        });
      })
      .error(() => {
        // Auth failure or transport error; presence simply stays empty
      });

    return () => {
      echo.leave('online');
    };
  }, [echo]);

  return { onlineIds, connectionState };
}
