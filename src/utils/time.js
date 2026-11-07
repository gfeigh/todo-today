// Time helpers. All times in the app are "minutes since midnight" (0–1440).

export const DAY_MINUTES = 24 * 60;
export const STEP_MINUTES = 15; // drag/resize snap size
export const DEFAULT_DURATION = 60;

/** A string that changes once per calendar day, e.g. "2026-11-7". */
export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** Minutes since midnight, with seconds as a fraction. */
export function minutesNow(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

/** The next :00 or :30 strictly after `minutes`. 10:12 → 10:30, 10:30 → 11:00. */
export function nextHalfHour(minutes) {
  return Math.floor(minutes / 30) * 30 + 30;
}

export function msUntilMidnight(date = new Date()) {
  const midnight = new Date(date);
  midnight.setHours(24, 0, 0, 0);
  return midnight - date;
}

/** 570 → "9:30 AM", 1440 → "12 AM". */
export function formatTime(minutes) {
  const m = ((Math.round(minutes) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const hours24 = Math.floor(m / 60);
  const mins = m % 60;
  const suffix = hours24 < 12 ? 'AM' : 'PM';
  const hours12 = hours24 % 12 || 12;
  return mins ? `${hours12}:${String(mins).padStart(2, '0')} ${suffix}` : `${hours12} ${suffix}`;
}

export function formatRange(start, duration) {
  return `${formatTime(start)} – ${formatTime(start + duration)}`;
}

/** 75 → "1 hr 15 min", 45 → "45 min". */
export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h} hr ${m} min`;
  if (h) return `${h} hr`;
  return `${m} min`;
}

export function formatToday(date = new Date()) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
