import { bookedAfter } from '../../utils/schedule.js';
import { DAY_MINUTES, formatDuration, minutesNow } from '../../utils/time.js';

export default function DraftSummary({ tasks, now, onClearSamples }) {
  const nowMin = minutesNow(now);
  const booked = tasks.reduce((sum, t) => sum + t.duration, 0);
  const free = Math.max(0, DAY_MINUTES - nowMin - bookedAfter(tasks, nowMin));
  const hasSamples = tasks.some((t) => t.sample);

  if (tasks.length === 0) {
    return (
      <div className="draft draft--empty">
        <h2 className="plan-panel__heading">Nothing on the list yet</h2>
        <p className="plan-panel__lead">
          Type the first thing you’ve been putting off. It lands on the timeline at the next half hour, and
          you can drag it from there.
        </p>
      </div>
    );
  }

  return (
    <div className="draft">
      <div className="draft__intro">
        <h2 className="plan-panel__heading">Arrange your day</h2>
        <p className="plan-panel__lead">
          Drag a block to move it. Drag its left or right edge to change how long it runs, 15 minutes at a
          time. When it looks right, hit <strong>Plan my Day!</strong>
        </p>
      </div>

      <dl className="draft__stats">
        <div>
          <dt>Tasks</dt>
          <dd className="mono">{tasks.length}</dd>
        </div>
        <div>
          <dt>Booked</dt>
          <dd className="mono">{formatDuration(booked)}</dd>
        </div>
        <div>
          <dt>Free until midnight</dt>
          <dd className="mono">{formatDuration(free)}</dd>
        </div>
      </dl>

      {/* {hasSamples && (
        <p className="draft__samples">
          The blocks marked <span className="draft__sample-tag">Sample</span> are there so you can try dragging.{' '}
          <button type="button" className="btn btn--link" onClick={onClearSamples}>
            Clear samples
          </button>
        </p>
      )} */}
    </div>
  );
}
