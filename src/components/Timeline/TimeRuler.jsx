import { formatTime } from '../../utils/time.js';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

/** Hour labels across the top of the timeline, 12 AM through 11 PM. */
export default function TimeRuler({ hourWidth }) {
  return (
    <div className="ruler" aria-hidden="true">
      {HOURS.map((h) => (
        <span key={h} className="ruler__label mono" style={{ left: h * hourWidth }}>
          {formatTime(h * 60)}
        </span>
      ))}
    </div>
  );
}
