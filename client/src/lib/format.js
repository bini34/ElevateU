// Compact relative timestamp for feed items, e.g. "now", "5m", "3h", "2d".
export function timeAgo(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;

  return date.toLocaleDateString();
}

// Author display helpers that tolerate missing profiles.
export function authorName(user) {
  const first = user?.profile?.first_name || '';
  const last = user?.profile?.last_name || '';
  const full = `${first} ${last}`.trim();
  return full || user?.user_name || 'Unknown user';
}

export function authorHandle(user) {
  return user?.user_name ? `@${user.user_name}` : '';
}
