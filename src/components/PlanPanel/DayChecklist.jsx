import { addToCalendar } from '../../utils/calendar.js';
import { sortByStart } from '../../utils/schedule.js';
import { formatDuration, formatRange, minutesNow } from '../../utils/time.js';

function statusFor(task, nowMin) {
  if (task.done) return { label: 'Done', tone: 'done' };
  if (nowMin >= task.start + task.duration) return { label: 'Overdue', tone: 'late' };
  if (nowMin >= task.start) return { label: 'Now', tone: 'now' };
  return { label: `in ${formatDuration(Math.ceil(task.start - nowMin))}`, tone: 'later' };
}

export default function DayChecklist({ tasks, now, onToggleDone }) {
  const nowMin = minutesNow(now);
  const ordered = sortByStart(tasks);
  const doneCount = tasks.filter((t) => t.done).length;
  const progress = tasks.length ? doneCount / tasks.length : 0;

  return (
    <div className="checklist">
      <div className="checklist__top">
        <h2 className="plan-panel__heading">Today’s plan</h2>
        <p className="checklist__count">
          <span className="mono">{doneCount}</span> of <span className="mono">{tasks.length}</span> done
        </p>
      </div>
      {tasks.some((t) => !t.done) && (
        <button
          type="button"
          className="checklist__calendar-all"
          onClick={() => addToCalendar(ordered.filter((t) => !t.done))}
        >
          Add to Calendar with reminders
        </button>
      )}
      <div
        className="checklist__bar"
        role="progressbar"
        aria-label="Tasks done"
        aria-valuemin={0}
        aria-valuemax={tasks.length}
        aria-valuenow={doneCount}
      >
        <span style={{ width: `${progress * 100}%` }} />
      </div>

      {tasks.length === 0 ? (
        <p className="plan-panel__lead">Your plan is empty. Add a task above to get going.</p>
      ) : (
        <ul className="checklist__list">
          {ordered.map((task) => {
            const status = statusFor(task, nowMin);
            const inputId = `check-${task.id}`;
            return (
              <li key={task.id} className={`checklist__item checklist__item--${status.tone}`}>
                <input
                  id={inputId}
                  type="checkbox"
                  className="checklist__box"
                  checked={task.done}
                  onChange={() => onToggleDone(task.id)}
                />
                <label htmlFor={inputId} className="checklist__label">
                  <span className="checklist__name">{task.name}</span>
                  <span className="checklist__time mono">
                    {formatRange(task.start, task.duration)} · {formatDuration(task.duration)}
                  </span>
                </label>
                <span className={`pill pill--${status.tone}`}>{status.label}</span>
                <button
                  type="button"
                  className="checklist__calendar"
                  onClick={() => addToCalendar([task], 'todo-today-task.ics')}
                  aria-label={`Add ${task.name} to Calendar with a reminder`}
                  title="Add to Calendar with a reminder"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <rect x="3.5" y="5" width="17" height="15.5" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
