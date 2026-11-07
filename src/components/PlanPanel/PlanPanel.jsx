import DayChecklist from './DayChecklist.jsx';
import DraftSummary from './DraftSummary.jsx';
import './PlanPanel.css';

/** Middle of the page: arranging tips before planning, the checklist after. */
export default function PlanPanel({ tasks, planned, now, onToggleDone, onClearSamples }) {
  return (
    <section className="plan-panel" aria-label={planned ? "Today's plan" : 'Arrange your day'}>
      {planned ? (
        <DayChecklist tasks={tasks} now={now} onToggleDone={onToggleDone} />
      ) : (
        <DraftSummary tasks={tasks} now={now} onClearSamples={onClearSamples} />
      )}
    </section>
  );
}
