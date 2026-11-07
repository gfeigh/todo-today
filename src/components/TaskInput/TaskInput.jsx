import { useState } from 'react';
import { findOpenSlot } from '../../utils/schedule.js';
import { DEFAULT_DURATION, formatDuration, formatTime, minutesNow, nextHalfHour } from '../../utils/time.js';
import './TaskInput.css';

export default function TaskInput({ tasks, now, onAdd }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Preview where the next task will land so there are no surprises.
  const preview = findOpenSlot(tasks, nextHalfHour(minutesNow(now)), DEFAULT_DURATION);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Type a task first.');
      return;
    }
    const result = onAdd(trimmed);
    if (!result.ok) {
      setError('No open time left before midnight. Shorten or delete a task to make room.');
      return;
    }
    setName('');
    setError('');
  }

  return (
    <form className="task-input" onSubmit={handleSubmit} noValidate>
      <label htmlFor="new-task" className="visually-hidden">
        New task
      </label>
      <div className="task-input__row">
        <input
          id="new-task"
          className="task-input__field"
          type="text"
          placeholder="What are you putting off?"
          autoComplete="off"
          maxLength={80}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
        />
        <button type="submit" className="btn btn--primary task-input__add">
          Add task
        </button>
      </div>
      <p className={`task-input__hint${error ? ' task-input__hint--error' : ''}`} aria-live="polite">
        {error ||
          (preview ? (
            <>
              Lands at <strong className="mono">{formatTime(preview.start)}</strong> for{' '}
              {formatDuration(preview.duration)}. Drag it anywhere after.
            </>
          ) : (
            'The rest of today is booked.'
          ))}
      </p>
    </form>
  );
}
