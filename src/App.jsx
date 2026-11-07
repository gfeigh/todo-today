import { useEffect, useRef } from 'react';
import Header from './components/Header/Header.jsx';
import PlanPanel from './components/PlanPanel/PlanPanel.jsx';
import TaskInput from './components/TaskInput/TaskInput.jsx';
import Timeline from './components/Timeline/Timeline.jsx';
import Toasts from './components/Toasts/Toasts.jsx';
import { useDay } from './hooks/useDay.js';
import { useNotifications } from './hooks/useNotifications.js';
import { useNow } from './hooks/useNow.js';
import { useToasts } from './hooks/useToasts.js';
import { unlockAudio } from './utils/chime.js';
import './App.css';

export default function App() {
  const now = useNow();
  const day = useDay();
  const { toasts, pushToast, dismissToast } = useToasts();
  const { permission, requestPermission } = useNotifications({
    tasks: day.tasks,
    planned: day.planned,
    notified: day.notified,
    markNotified: day.markNotified,
    now,
    onToast: pushToast,
  });

  // Browsers only allow the start chime after the first interaction.
  useEffect(() => {
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
  }, []);

  // Announce the midnight reset.
  const lastDate = useRef(day.date);
  useEffect(() => {
    if (lastDate.current !== day.date) {
      pushToast({ title: 'A new day', body: 'Yesterday is cleared. Your timeline is empty and ready.' });
      lastDate.current = day.date;
    }
  }, [day.date, pushToast]);

  async function handlePlan() {
    if (day.tasks.length === 0) {
      pushToast({ title: 'Add a task first', body: 'Type something above and it lands on the timeline.' });
      return;
    }
    const wasPlanned = day.planned;
    day.planDay();
    if (permission === 'default') await requestPermission();
    pushToast({
      title: wasPlanned ? 'Plan updated' : 'Your day is planned',
      body: 'You’ll get a nudge as each task starts.',
    });
  }

  return (
    <div className="app">
      <Header now={now} permission={permission} onEnableAlerts={requestPermission} />
      <TaskInput tasks={day.tasks} now={now} onAdd={day.addTask} />

      <main className="app__middle">
        <PlanPanel
          tasks={day.tasks}
          planned={day.planned}
          now={now}
          onToggleDone={day.toggleDone}
          onClearSamples={day.clearSamples}
        />
      </main>

      <Timeline
        tasks={day.tasks}
        now={now}
        planned={day.planned}
        onUpdateTask={day.updateTask}
        onRemoveTask={day.removeTask}
        onPlan={handlePlan}
      />

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
