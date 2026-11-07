import { useCallback, useRef, useState } from 'react';

/** In-page messages. Each toast is { id, title, body, tone } and clears itself. */
export function useToasts(lifetimeMs = 6000) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ title, body = '', tone = 'info' }) => {
      const id = ++nextId.current;
      setToasts((list) => [...list.slice(-2), { id, title, body, tone }]);
      setTimeout(() => dismissToast(id), lifetimeMs);
    },
    [dismissToast, lifetimeMs],
  );

  return { toasts, pushToast, dismissToast };
}
