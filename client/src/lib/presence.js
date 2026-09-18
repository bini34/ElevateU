// A chat list and its open conversation share one presence subscription.
// Keep it alive until the final consumer leaves, and replay the current list
// to consumers mounted after the server's initial subscription response.
const subscriptions = new WeakMap();

export function subscribeToOnlineUsers(echo, onChange, onError) {
  let subscription = subscriptions.get(echo);
  if (!subscription) {
    subscription = { listeners: new Set(), ids: new Set(), error: null };
    subscriptions.set(echo, subscription);
    const publish = () => {
      for (const listener of subscription.listeners) {
        listener.onChange(new Set(subscription.ids));
        listener.onError(subscription.error);
      }
    };

    echo.join('online')
      .here((users) => {
        subscription.ids = new Set(users.map((user) => user.id));
        subscription.error = null;
        publish();
      })
      .joining((user) => {
        subscription.ids.add(user.id);
        publish();
      })
      .leaving((user) => {
        subscription.ids.delete(user.id);
        publish();
      })
      .error((error) => {
        subscription.ids.clear();
        subscription.error = error?.message || 'Online status is unavailable.';
        publish();
      });
  }

  const listener = { onChange, onError };
  subscription.listeners.add(listener);
  onChange(new Set(subscription.ids));
  onError(subscription.error);

  return () => {
    subscription.listeners.delete(listener);
    if (subscription.listeners.size === 0) {
      echo.leave('online');
      subscriptions.delete(echo);
    }
  };
}
