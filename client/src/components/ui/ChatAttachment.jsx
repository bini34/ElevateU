"use client";

import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { isMessageImage, loadMessageAttachment } from '@/lib/attachments';

export default function ChatAttachment({ content }) {
  const { authToken } = useContext(AuthContext);
  const { id, mime } = content;
  const image = isMessageImage(content.mime);
  const [requested, setRequested] = useState(image);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(null);
  const current = state?.session === authToken && state?.id === content.id ? state : null;

  useEffect(() => {
    if (!authToken || !requested) return undefined;
    const controller = new AbortController();
    let objectUrl;
    const session = authToken;
    setState({ session, id, loading: true });
    loadMessageAttachment({ id, mime }, { signal: controller.signal })
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ session, id, url: objectUrl });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({ session, id, error: error.status === 403 || error.status === 404
            ? 'This attachment is unavailable or you no longer have access.'
            : 'Could not load this attachment.' });
        }
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [authToken, id, mime, requested, attempt]);

  return (
    <div className="p-3 bg-gray-100 rounded-xl my-2">
      <p className="text-sm font-medium break-all">{content.name}</p>
      {current?.loading && <p role="status" className="text-sm">Loading attachment...</p>}
      {current?.error && (
        <div role="alert">
          <p className="text-sm">{current.error}</p>
          <button type="button" className="underline" onClick={() => setAttempt((value) => value + 1)}>Retry</button>
        </div>
      )}
      {current?.url && image && (
        // Authenticated bytes stay in a session-scoped blob, never Next's public image cache.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current.url} alt={content.name || 'Message attachment'} className="rounded-lg max-w-full h-auto" />
      )}
      {current?.url && <a href={current.url} download={content.name} className="underline text-blue-700">Download</a>}
      {!requested && <button type="button" className="underline text-blue-700" onClick={() => setRequested(true)}>Load attachment</button>}
    </div>
  );
}
