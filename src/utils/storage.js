// Saves the day to the browser so a refresh doesn't lose anything.
// Storage can be unavailable (private mode, blocked site data), so every
// access is wrapped and the app keeps working in memory without it.

const KEY = 'todo-today:v1';

export function loadDay() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDay(day) {
  try {
    localStorage.setItem(KEY, JSON.stringify(day));
  } catch {
    // Ignore: the app still works for this session.
  }
}
