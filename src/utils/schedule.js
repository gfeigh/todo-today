// Scheduling rules: where tasks may go, and how drags are constrained.
// Everything here is a pure function of the task list, so it is easy to test.

import { DAY_MINUTES, DEFAULT_DURATION, STEP_MINUTES } from './time.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function sortByStart(tasks) {
  return [...tasks].sort((a, b) => a.start - b.start);
}

/** True if [start, start+duration) overlaps any task other than `ignoreId`. */
export function collides(tasks, start, duration, ignoreId) {
  return tasks.some(
    (t) => t.id !== ignoreId && start < t.start + t.duration && t.start < start + duration,
  );
}

/**
 * First open slot at or after `from`. Prefers the full `wanted` length; if no
 * gap that long exists, falls back to the longest shorter gap (15 min minimum).
 * Returns { start, duration } or null when the rest of the day is full.
 */
export function findOpenSlot(tasks, from, wanted = DEFAULT_DURATION) {
  const first = Math.ceil(from / STEP_MINUTES) * STEP_MINUTES;

  for (let duration = wanted; duration >= STEP_MINUTES; duration -= STEP_MINUTES) {
    for (let start = first; start + duration <= DAY_MINUTES; start += STEP_MINUTES) {
      if (!collides(tasks, start, duration)) return { start, duration };
    }
  }
  return null;
}

/** Start of the closest task that begins at or after `start`, or midnight. */
function nextStartAfter(others, start) {
  return others.reduce((min, t) => (t.start >= start ? Math.min(min, t.start) : min), DAY_MINUTES);
}

/** End of the closest task that begins before `start`, or 0. */
function prevEndBefore(others, start) {
  return others.reduce((max, t) => (t.start < start ? Math.max(max, t.start + t.duration) : max), 0);
}

/**
 * Closest free start to `target` for a block of `duration`. Candidates are the
 * target itself and the spots flush against each neighbour, which lets a
 * block hop past another one (re-ordering) without ever overlapping it.
 */
function nearestFreeStart(others, target, duration, fallback) {
  const candidates = [target, fallback];
  others.forEach((t) => candidates.push(t.start - duration, t.start + t.duration));

  let best = null;
  for (const c of candidates) {
    if (c < 0 || c + duration > DAY_MINUTES || collides(others, c, duration)) continue;
    if (best === null || Math.abs(c - target) < Math.abs(best - target)) best = c;
  }
  return best ?? fallback;
}

/**
 * Apply a drag to a task.
 *   mode   "move" | "start" (left edge) | "end" (right edge)
 *   origin the task's { start, duration } when the drag began
 *   delta  minutes the pointer has travelled, already snapped to 15 min
 * Returns the new { start, duration } plus `blocked` when an overlap was refused.
 */
export function applyDrag(tasks, id, mode, origin, delta) {
  const others = tasks.filter((t) => t.id !== id);

  if (mode === 'move') {
    const start = clamp(origin.start + delta, 0, DAY_MINUTES - origin.duration);
    if (!collides(others, start, origin.duration)) {
      return { start, duration: origin.duration, blocked: false };
    }
    return {
      start: nearestFreeStart(others, start, origin.duration, origin.start),
      duration: origin.duration,
      blocked: true,
    };
  }

  if (mode === 'end') {
    const limit = nextStartAfter(others, origin.start) - origin.start;
    const wanted = clamp(origin.duration + delta, STEP_MINUTES, DAY_MINUTES - origin.start);
    return { start: origin.start, duration: Math.min(wanted, limit), blocked: wanted > limit };
  }

  // mode === 'start': the right edge stays put while the left edge moves.
  const end = origin.start + origin.duration;
  const floor = prevEndBefore(others, origin.start);
  const wanted = clamp(origin.start + delta, 0, end - STEP_MINUTES);
  const start = Math.max(wanted, floor);
  return { start, duration: end - start, blocked: wanted < floor };
}

/** Minutes of tasks that fall between `from` and midnight. */
export function bookedAfter(tasks, from) {
  return tasks.reduce((sum, t) => {
    const s = Math.max(t.start, from);
    const e = t.start + t.duration;
    return sum + Math.max(0, e - s);
  }, 0);
}
