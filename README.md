# Todo Today

A minimalist productivity app for procrastinators.

Type a task, and it lands on today's timeline at the next half hour for one hour.
Drag blocks to move them, drag their edges to change the length (15-minute steps),
then hit **Plan my Day!** to get a checklist and a nudge as each task starts.
At midnight the timeline clears for a new day.

## Run it

```bash
npm install
npm run dev        # local dev server at http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## How the code is organised

```
todo-today/
├── index.html                 Page shell and Google Fonts
├── public/
│   └── sw.js                  Service worker that shows task-start notifications
└── src/
    ├── main.jsx               Mounts <App />, registers the service worker
    ├── App.jsx / App.css      Page layout; wires state to components
    │
    ├── components/            What you see. One folder per component, with its CSS.
    │   ├── Header/            Logo, date, alerts on/off chip
    │   ├── TaskInput/         "What are you putting off?" box + where the task will land
    │   ├── PlanPanel/
    │   │   ├── PlanPanel.jsx      Switches between the two views below
    │   │   ├── DraftSummary.jsx   Before planning: tips and stats
    │   │   └── DayChecklist.jsx   After planning: checkbox list with progress
    │   ├── Timeline/
    │   │   ├── Timeline.jsx       The scrollable midnight-to-midnight grid
    │   │   ├── TimeRuler.jsx      Hour labels along the top
    │   │   ├── TaskBlock.jsx      One draggable, resizable task block
    │   │   └── useBlockDrag.js    Pointer/touch drag handling and edge auto-scroll
    │   └── Toasts/            Pop-up messages
    │
    ├── hooks/                 Behaviour and state, no markup
    │   ├── useDay.js              Today's tasks, saving, and the midnight reset
    │   ├── useNotifications.js    Fires alerts when planned tasks start
    │   ├── useNow.js              Current time, ticking every 10 seconds
    │   ├── useHourWidth.js        Timeline zoom per screen size
    │   └── useToasts.js           Toast queue
    │
    ├── utils/                 Plain functions, no React
    │   ├── schedule.js            Overlap checks, finding free slots, drag rules
    │   ├── time.js                Minutes-since-midnight helpers and formatting
    │   ├── storage.js             Save/load to localStorage
    │   ├── calendar.js            .ics export with a reminder per task
    │   └── chime.js               The start-of-task sound
    │
    └── styles/
        ├── theme.css              Color, font and radius tokens (light + dark)
        └── base.css               Reset and shared button styles
```

Times are stored as **minutes since midnight** (0–1440) everywhere, which keeps
the scheduling math in `utils/schedule.js` simple.

## Notes

- **Overlaps** are never allowed. Moving a block onto another snaps it to the nearest
  free spot (so you can hop a block past its neighbour to re-order), and edges stop at
  the neighbouring block.
- **Keyboard:** focus a block with Tab, use ←/→ to move it 15 minutes,
  Shift+←/→ to change its length, and Delete to remove it.
- **Notifications** need the browser's permission (asked when you plan your day) and
  an `https://` site or `localhost`. They fire while the app is open in a tab, even in
  the background. Alerts with the app fully closed would need a push server
  (Web Push), which this app doesn't include.
- **Calendar reminders:** after planning, **Add to Calendar with reminders** (or the
  calendar icon on a single task) exports an `.ics` file with an alarm at each task's
  start. On iPhone/iPad, Safari shows an *Add to Calendar* sheet, and iOS Calendar
  then reminds you even when the app is closed. A web app can't write to the
  calendar directly, so if you move a task later, add it again. Same task, same ID,
  so the calendar should update the event rather than add a second one.
- Data is saved in the browser (`localStorage`) and is per device.
