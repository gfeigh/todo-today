// The app's main state: today's tasks, whether the day has been planned, and
// which start notifications have already gone out. Saved to the browser on
// every change and wiped clean when the date rolls over at midnight.

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { findOpenSlot } from '../utils/schedule.js';
import { loadDay, saveDay } from '../utils/storage.js';
import { DEFAULT_DURATION, minutesNow, msUntilMidnight, nextHalfHour, todayKey } from '../utils/time.js';

const SAMPLE_TASKS = [
  { name: 'Reply to the email I keep avoiding', duration: 60 },
  { name: 'Laundry, start to finish', duration: 45 },
  { name: 'Read 20 pages', duration: 30 },
];

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function freshDay() {
  return { date: todayKey(), tasks: [], planned: false, notified: {}, isFirstVisit: false };
}

/** First visit only: drop a few sample tasks on the timeline to show how it works. */
function dayWithSamples() {
  const day = { ...freshDay(), isFirstVisit: true };
  let cursor = nextHalfHour(minutesNow());
  for (const sample of SAMPLE_TASKS) {
    const slot = findOpenSlot(day.tasks, cursor, sample.duration);
    if (!slot) break;
    day.tasks.push({ id: newId(), name: sample.name, ...slot, done: false, sample: true });
    cursor = slot.start + slot.duration + 30;
  }
  return day;
}

function initialDay() {
  const saved = loadDay();
  if (!saved) return dayWithSamples();
  if (saved.date !== todayKey()) return freshDay();
  return { ...saved, isFirstVisit: false };
}

function reducer(day, action) {
  switch (action.type) {
    case 'add':
      return { ...day, tasks: [...day.tasks, action.task] };
    case 'update':
      return {
        ...day,
        tasks: day.tasks.map((t) => (t.id === action.id ? { ...t, ...action.changes } : t)),
      };
    case 'toggleDone':
      return {
        ...day,
        tasks: day.tasks.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t)),
      };
    case 'remove':
      return { ...day, tasks: day.tasks.filter((t) => t.id !== action.id) };
    case 'clearSamples':
      return { ...day, tasks: day.tasks.filter((t) => !t.sample) };
    case 'plan':
      return { ...day, planned: true };
    case 'markNotified':
      return { ...day, notified: { ...day.notified, [action.key]: true } };
    case 'newDay':
      return freshDay();
    default:
      return day;
  }
}

export function useDay() {
  const [day, dispatch] = useReducer(reducer, undefined, initialDay);
  const dayRef = useRef(day);
  dayRef.current = day;

  // Persist every change.
  useEffect(() => {
    saveDay(day);
  }, [day]);

  // Clear the timeline at midnight. The interval and visibility check cover
  // laptops that were asleep when the clock passed 12 AM.
  useEffect(() => {
    const check = () => {
      if (dayRef.current.date !== todayKey()) dispatch({ type: 'newDay' });
    };
    const timeout = setTimeout(check, msUntilMidnight() + 1000);
    const interval = setInterval(check, 30_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  /** Adds a task at the next half hour (or the next open gap after it). */
  const addTask = useCallback((name) => {
    const slot = findOpenSlot(dayRef.current.tasks, nextHalfHour(minutesNow()), DEFAULT_DURATION);
    if (!slot) return { ok: false };
    const task = { id: newId(), name, ...slot, done: false, sample: false };
    dispatch({ type: 'add', task });
    return { ok: true, task };
  }, []);

  const updateTask = useCallback((id, changes) => dispatch({ type: 'update', id, changes }), []);
  const toggleDone = useCallback((id) => dispatch({ type: 'toggleDone', id }), []);
  const removeTask = useCallback((id) => dispatch({ type: 'remove', id }), []);
  const clearSamples = useCallback(() => dispatch({ type: 'clearSamples' }), []);
  const planDay = useCallback(() => dispatch({ type: 'plan' }), []);
  const markNotified = useCallback((key) => dispatch({ type: 'markNotified', key }), []);

  return {
    date: day.date,
    tasks: day.tasks,
    planned: day.planned,
    notified: day.notified,
    isFirstVisit: day.isFirstVisit,
    addTask,
    updateTask,
    toggleDone,
    removeTask,
    clearSamples,
    planDay,
    markNotified,
  };
}
