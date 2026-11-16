// Calendar export. Builds an .ics file (the standard calendar format) with one
// event per task, each carrying an alarm so the phone's calendar reminds you
// when the task starts. On iPhone/iPad, opening the file in Safari shows an
// "Add to Calendar" sheet; on a Mac it opens Calendar; elsewhere it downloads.

import { sortByStart } from './schedule.js';

const pad = (n) => String(n).padStart(2, '0');

/** Date → "20261116T143000Z" (UTC, so no time zone table is needed). */
function icsDate(date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/** Minutes since midnight on `day` → a real Date. 1440 rolls over to the next day. */
function atMinutes(day, minutes) {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
}

/** Escape text per RFC 5545: backslash, semicolon, comma and newlines. */
function escapeText(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Lines longer than 75 bytes must be folded (continuation lines start with a space). */
function fold(line) {
  const bytes = new TextEncoder();
  if (bytes.encode(line).length <= 75) return line;
  const parts = [];
  let current = '';
  for (const char of line) {
    const limit = parts.length ? 74 : 75; // continuation lines lose a byte to the leading space
    if (bytes.encode(current + char).length > limit) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join('\r\n ');
}

function eventLines(task, day, stamp) {
  const start = atMinutes(day, task.start);
  const end = atMinutes(day, task.start + task.duration);
  return [
    'BEGIN:VEVENT',
    // Stable per task, so adding the same task again updates it rather than duplicating it.
    `UID:${task.id}@todo-today`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeText(task.name)}`,
    'DESCRIPTION:Planned with Todo Today',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(`Time to start: ${task.name}`)}`,
    'TRIGGER:PT0M', // fire right when the task starts
    'END:VALARM',
    'END:VEVENT',
  ];
}

/** An .ics document for the given tasks on `day` (defaults to today). */
export function buildCalendar(tasks, day = new Date()) {
  const stamp = icsDate(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Todo Today//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...sortByStart(tasks).flatMap((task) => eventLines(task, day, stamp)),
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

function isAppleMobile() {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, so also check for touch.
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/**
 * Hand the tasks to the device's calendar. iOS Safari shows its "Add to
 * Calendar" sheet when it navigates to a text/calendar document, so there we
 * open it directly; other browsers get a normal .ics download.
 */
export function addToCalendar(tasks, filename = 'todo-today.ics') {
  const ics = buildCalendar(tasks);

  if (isAppleMobile()) {
    window.location.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
    return;
  }

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
