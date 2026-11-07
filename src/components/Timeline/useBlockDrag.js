// Pointer handling for one task block. Works with mouse, pen and touch.
// Grabbing the middle moves the block; grabbing an edge (data-handle="start"
// or "end") resizes it. The timeline scrolls on its own when the pointer is
// held near its left or right edge, so blocks can travel the whole day.

import { useRef, useState } from 'react';
import { STEP_MINUTES } from '../../utils/time.js';

const EDGE_PX = 56; // auto-scroll zone at each side of the timeline
const MAX_SCROLL_SPEED = 18; // px per frame

export function useBlockDrag({ task, scrollerRef, hourWidth, onDrag, onDragEnd }) {
  const [state, setState] = useState({ dragging: false, blocked: false });
  const drag = useRef(null);
  const frame = useRef(0);

  // Keep the newest callbacks reachable from the animation-frame loop.
  const latest = useRef({});
  latest.current = { onDrag, onDragEnd, hourWidth };

  // Pointer position inside the scrolled content, so scrolling counts as movement.
  const contentX = (clientX) => {
    const el = scrollerRef.current;
    return clientX - el.getBoundingClientRect().left + el.scrollLeft;
  };

  const update = () => {
    const d = drag.current;
    if (!d) return;
    const quarterPx = latest.current.hourWidth / 4;
    const delta = Math.round((contentX(d.clientX) - d.startX) / quarterPx) * STEP_MINUTES;
    if (delta === d.lastDelta) return;
    d.lastDelta = delta;
    const blocked = latest.current.onDrag(task.id, d.mode, d.origin, delta);
    setState((s) => (s.blocked === blocked ? s : { ...s, blocked }));
  };

  const autoScroll = () => {
    const d = drag.current;
    if (!d) return;
    const el = scrollerRef.current;
    const { left, right } = el.getBoundingClientRect();
    let speed = 0;
    if (d.clientX < left + EDGE_PX) speed = -Math.min(MAX_SCROLL_SPEED, (left + EDGE_PX - d.clientX) / 3);
    else if (d.clientX > right - EDGE_PX) speed = Math.min(MAX_SCROLL_SPEED, (d.clientX - (right - EDGE_PX)) / 3);
    if (speed) {
      el.scrollLeft += speed;
      update();
    }
    frame.current = requestAnimationFrame(autoScroll);
  };

  const finish = () => {
    if (!drag.current) return;
    cancelAnimationFrame(frame.current);
    drag.current = null;
    setState({ dragging: false, blocked: false });
    latest.current.onDragEnd?.();
  };

  const handlers = {
    onPointerDown(event) {
      if (event.button !== 0 || event.target.closest('button')) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = {
        mode: event.target.dataset.handle || 'move',
        origin: { start: task.start, duration: task.duration },
        startX: contentX(event.clientX),
        clientX: event.clientX,
        lastDelta: 0,
      };
      setState({ dragging: true, blocked: false });
      frame.current = requestAnimationFrame(autoScroll);
    },
    onPointerMove(event) {
      if (!drag.current) return;
      drag.current.clientX = event.clientX;
      update();
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onLostPointerCapture: finish,
  };

  return { ...state, handlers };
}
