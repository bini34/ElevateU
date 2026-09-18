import { fetcher } from '../utils/fetcher.js';

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

// Build an API-relative path from the attachment ID. Never send a bearer token
// to a supplied attachment URL, redirect target or arbitrary external origin.
export async function loadMessageAttachment(attachment, { signal } = {}) {
  if (!/^[a-f0-9-]{36}$/i.test(attachment.id || '')) {
    throw new Error('The attachment has no valid identifier.');
  }
  const blob = await fetcher(`/message-attachments/${attachment.id}`, { responseType: 'arraybuffer', signal });
  const type = IMAGE_MIMES.has(attachment.mime) ? attachment.mime : 'application/octet-stream';
  return new Blob([blob], { type });
}

export const isMessageImage = (mime) => IMAGE_MIMES.has(mime);
