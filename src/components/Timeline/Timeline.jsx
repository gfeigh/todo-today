import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useHourWidth } from '../../hooks/useHourWidth.js';
import { applyDrag } from '../../utils/schedule.js';
import { formatDuration, formatTime, minutesNow } from '../../utils/time.js';
import TaskBlock from './TaskBlock.jsx';
import TimeRuler from './TimeRuler.jsx';
import './Timeline.css';

export default function Timeline({ tasks, now, planned, onUpdateTask, onRemoveTask, onPlan }) {
  const scrollerRef = useRef(null);
  const hourWidth = useHourWidth();
  const [notice, setNotice] = useState('');

  // Drag math always runs against the newest task list.
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const nowMin = minutesNow(now);
  const nowX = (nowMin / 60) * hourWidth;
  const booked = tasks.reduce((sum, t) => sum + t.duration, 0);

  const scrollToNow = useCallback(
    (behavior = 'smooth') => {
      const el = scrollerRef.current;
      if (!el) return;
      const x = (minutesNow() / 60) * hourWidth - el.clientWidth * 0.25;
      el.scrollTo({ left: Math.max(0, x), behavior });
    },
    [hourWidth],
  );

  // Open on the current time, and again when the scale changes.
  useLayoutEffect(() => scrollToNow('auto'), [scrollToNow]);

  // Let a regular mouse wheel scroll the day sideways.
  useEffect(() => {
    const el = scrollerRef.current;
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Clear the "blocked" notice shortly after it appears.
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(''), 1800);
    return () => clearTimeout(id);
  }, [notice]);

  const handleDrag = useCallback(
    (id, mode, origin, delta) => {
      const result = applyDrag(tasksRef.current, id, mode, origin, delta);
      onUpdateTask(id, { start: result.start, duration: result.duration });
      if (result.blocked) setNotice('Tasks can’t overlap');
      return result.blocked;
    },
    [onUpdateTask],
  );

  const handleDragEnd = useCallback(() => {}, []);

  return (
    <section className="timeline" aria-label="Timeline">
      <div className="timeline__bar">
        <div className="timeline__heading">
          <h2>Timeline</h2>
          <p className="timeline__sub">
            Midnight to midnight · <span className="mono">{formatDuration(booked)}</span> booked
          </p>
        </div>
        <p className="timeline__notice" role="status" aria-live="polite">
          {notice}
        </p>
        <div className="timeline__actions">
          <button type="button" className="btn btn--ghost" onClick={() => scrollToNow()}>
            Jump to now
          </button>
          <button type="button" className="btn btn--cta" onClick={onPlan}>
            {planned ? 'Update plan' : 'Plan my Day!'}
          </button>
        </div>
      </div>

      <div className="timeline__scroller" ref={scrollerRef}>
        <div className="timeline__track" style={{ width: hourWidth * 24, '--hour': `${hourWidth}px` }}>
          <TimeRuler hourWidth={hourWidth} />
          <div className="timeline__lane">
            <div className="timeline__past" style={{ width: nowX }} aria-hidden="true" />

            {tasks.length === 0 && (
              <p className="timeline__empty" style={{ left: nowX + 16 }}>
                New tasks appear here
              </p>
            )}

            {tasks.map((task) => (
              <TaskBlock
                key={task.id}
                task={task}
                hourWidth={hourWidth}
                scrollerRef={scrollerRef}
                isActive={!task.done && nowMin >= task.start && nowMin < task.start + task.duration}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onRemove={onRemoveTask}
              />
            ))}

            <div className="timeline__now" style={{ left: nowX }} aria-hidden="true">
              <span className="timeline__now-label mono">{formatTime(nowMin)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
