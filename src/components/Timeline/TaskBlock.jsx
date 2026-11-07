import { useState } from 'react';
import { formatRange, STEP_MINUTES } from '../../utils/time.js';
import { useBlockDrag } from './useBlockDrag.js';

export default function TaskBlock({ task, hourWidth, scrollerRef, isActive, onDrag, onDragEnd, onRemove }) {
  const { dragging, blocked, handlers } = useBlockDrag({ task, scrollerRef, hourWidth, onDrag, onDragEnd });
  const [shake, setShake] = useState(false);

  const left = (task.start / 60) * hourWidth;
  const width = (task.duration / 60) * hourWidth;
  const range = formatRange(task.start, task.duration);
  const compact = width < 100;

  // Keyboard: arrows move by 15 min, Shift+arrows resize, Delete removes.
  function handleKeyDown(event) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onRemove(task.id);
      return;
    }
    const dir = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    event.preventDefault();
    const origin = { start: task.start, duration: task.duration };
    const wasBlocked = onDrag(task.id, event.shiftKey ? 'end' : 'move', origin, dir * STEP_MINUTES);
    onDragEnd();
    if (wasBlocked) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  const classes = [
    'block',
    isActive && 'block--active',
    task.done && 'block--done',
    task.sample && 'block--sample',
    compact && 'block--compact',
    dragging && 'block--dragging',
    (blocked || shake) && 'block--blocked',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{ left, width }}
      tabIndex={0}
      role="group"
      aria-label={`${task.name}, ${range}. Arrow keys move it, Shift plus arrow keys change its length, Delete removes it.`}
      title={`${task.name}\n${range}`}
      onKeyDown={handleKeyDown}
      {...handlers}
    >
      <span className="block__handle block__handle--start" data-handle="start" aria-hidden="true" />
      <div className="block__body">
        <span className="block__name">{task.name}</span>
        <span className="block__time mono">{range}</span>
      </div>
      <button
        type="button"
        className="block__remove"
        onClick={() => onRemove(task.id)}
        aria-label={`Delete ${task.name}`}
      >
        ×
      </button>
      <span className="block__handle block__handle--end" data-handle="end" aria-hidden="true" />
    </div>
  );
}
