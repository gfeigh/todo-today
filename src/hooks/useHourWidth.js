import { useEffect, useState } from 'react';

// Pixels per hour on the timeline. Wider screens get roomier blocks.
const SIZES = [
  { query: '(min-width: 1024px)', width: 160 },
  { query: '(min-width: 640px)', width: 144 },
];
const PHONE_WIDTH = 136;

function measure() {
  const match = SIZES.find((s) => window.matchMedia(s.query).matches);
  return match ? match.width : PHONE_WIDTH;
}

export function useHourWidth() {
  const [width, setWidth] = useState(measure);

  useEffect(() => {
    const lists = SIZES.map((s) => window.matchMedia(s.query));
    const update = () => setWidth(measure());
    lists.forEach((l) => l.addEventListener('change', update));
    return () => lists.forEach((l) => l.removeEventListener('change', update));
  }, []);

  return width;
}
