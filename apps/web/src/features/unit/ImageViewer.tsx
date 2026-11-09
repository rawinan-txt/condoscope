import type { RoomKey } from '@condoscope/shared';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { useState } from 'react';
import AiBadge from '../../components/AiBadge';

export interface ViewerItem { key: RoomKey; label: string; src: string | null }

/** Interior image for the active room; a labelled placeholder until real images exist. */
export default function ImageViewer({ items, active, onPick }: { items: ViewerItem[]; active: RoomKey; onPick(k: RoomKey): void }) {
  const i = Math.max(0, items.findIndex((it) => it.key === active));
  const item = items[i];
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const step = (d: number) => onPick(items[(i + d + items.length) % items.length].key);

  return (
    <figure className="overflow-hidden rounded-lg border border-slate-200">
      <div className="relative aspect-[4/3] bg-slate-100">
        {item.src && !broken[item.src] ? (
          <>
            <img key={item.src} src={item.src} alt={item.label} className="fade-in h-full w-full object-cover" onError={() => setBroken((b) => ({ ...b, [item.src!]: true }))} />
            <AiBadge />
          </>
        ) : (
          <div key={item.key} className="fade-in flex h-full w-full flex-col items-center justify-center gap-2 text-slate-500">
            <ImageOff className="size-8" aria-hidden />
            <p className="text-sm">ภาพตัวอย่าง: {item.label} (รอภาพจริง)</p>
          </div>
        )}
        <button type="button" onClick={() => step(-1)} aria-label="ภาพก่อนหน้า" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white"><ChevronLeft className="size-5" aria-hidden /></button>
        <button type="button" onClick={() => step(1)} aria-label="ภาพถัดไป" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white"><ChevronRight className="size-5" aria-hidden /></button>
      </div>
      <figcaption className="flex items-center justify-between px-3 py-2 text-sm">
        <span className="font-medium">{item.label}</span>
        <span className="text-slate-500">{i + 1} / {items.length}</span>
      </figcaption>
    </figure>
  );
}
