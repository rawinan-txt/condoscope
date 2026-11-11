import { formatMillion } from '@condoscope/shared';
import { useEffect, useRef, useState } from 'react';
import { effectiveStatus } from './reservations';
import { STATUS_STYLE } from './status';
import type { ExplorerApi } from './useExplorer';

/** Invisible live region: tells screen reader users what a click, key press or filter did on the building. */
export default function LiveAnnouncer({ x }: { x: ExplorerApi }) {
  const [message, setMessage] = useState('');
  const first = useRef(true);
  const { selectedId, filters, units, matches, mine } = x;

  useEffect(() => {
    if (first.current) return;
    const u = x.unit(selectedId);
    setMessage(u ? `เลือกห้อง ${u.unit_number} ชั้น ${u.floor_number} ${STATUS_STYLE[effectiveStatus(u, mine)].label} ${formatMillion(u.price)}` : 'ล้างการเลือกห้อง');
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps -- only a new selection is announced, not every re-render

  useEffect(() => {
    if (first.current) return;
    setMessage(`ตรงเงื่อนไข ${units.filter(matches).length} ห้อง`);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps -- only a changed filter is announced

  useEffect(() => { first.current = false; }, []);

  return <div role="status" aria-live="polite" aria-label="ประกาศการเลือกห้อง" className="sr-only">{message}</div>;
}
