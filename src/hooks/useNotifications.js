// Task-start alerts. Once the day is planned, every task gets a nudge when it
// begins: a system notification (if the person allowed them), plus an in-page
// toast, a chime and a vibration on phones that support it.

import { useCallback, useEffect, useRef, useState } from 'react';
import { playChime } from '../utils/chime.js';
import { formatRange, minutesNow } from '../utils/time.js';

// How late an alert may still fire. Background tabs can throttle timers,
// so a few minutes of slack avoids silently missing a start.
const GRACE_MINUTES = 5;

function currentPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission; // "default" | "granted" | "denied"
}

async function showSystemNotification(title, options) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    // Fall through to the page-level API.
  }
  try {
    new Notification(title, options);
  } catch {
    // Some browsers only allow service-worker notifications; the toast still shows.
  }
}

export function useNotifications({ tasks, planned, notified, markNotified, now, onToast }) {
  const [permission, setPermission] = useState(currentPermission);
  const fired = useRef(new Set()); // guards against double alerts between renders

  const requestPermission = useCallback(async () => {
    if (currentPermission() !== 'default') return setPermission(currentPermission());
    try {
      setPermission(await Notification.requestPermission());
    } catch {
      setPermission(currentPermission());
    }
  }, []);

  useEffect(() => {
    if (!planned) return;
    const nowMin = minutesNow(now);

    for (const task of tasks) {
      // Keyed by start time, so a task moved later gets a fresh alert.
      const key = `${task.id}@${task.start}`;
      if (task.done || notified[key] || fired.current.has(key)) continue;
      if (nowMin < task.start || nowMin - task.start > GRACE_MINUTES) continue;

      fired.current.add(key);
      markNotified(key);
      const range = formatRange(task.start, task.duration);
      onToast({ title: `Time to start: ${task.name}`, body: range, tone: 'start' });
      playChime();
      navigator.vibrate?.([120, 60, 120]);
      if (currentPermission() === 'granted') {
        showSystemNotification('Todo Today: time to start', {
          body: `${task.name}\n${range}`,
          tag: key,
        });
      }
    }
  }, [now, tasks, planned, notified, markNotified, onToast]);

  return { permission, requestPermission };
}
