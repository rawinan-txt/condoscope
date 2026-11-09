import { useState } from 'react';
import AiBadge from '../../components/AiBadge';

export interface GalleryItem { src: string; alt: string; ai: boolean }

/** One large picture and a row of thumbnail buttons (keyboard friendly). A picture that fails to load is dropped, not shown broken. */
export default function Gallery({ items }: { items: GalleryItem[] }) {
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const [active, setActive] = useState(0);
  const shown = items.filter((i) => !broken.has(i.src));
  const current = shown[Math.min(active, shown.length - 1)];
  const drop = (src: string) => setBroken((b) => new Set(b).add(src));

  if (!current) {
    return <div className="flex aspect-[16/9] items-center justify-center rounded-lg bg-slate-100 text-slate-500">ยังไม่มีภาพโครงการ</div>;
  }
  return (
    <section aria-label="แกลเลอรีภาพโครงการ">
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-slate-100">
        <img key={current.src} src={current.src} alt={current.alt} className="fade-in h-full w-full object-cover" onError={() => drop(current.src)} />
        {current.ai && <AiBadge />}
      </div>
      {shown.length > 1 && (
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {shown.map((it, i) => (
            <li key={it.src}>
              <button
                type="button"
                aria-label={`ดูภาพ: ${it.alt}`}
                aria-pressed={it === current}
                onClick={() => setActive(i)}
                className={`block overflow-hidden rounded-md border-2 ${it === current ? 'border-accent' : 'border-transparent'}`}
              >
                <img src={it.src} alt="" className="h-16 w-24 object-cover" onError={() => drop(it.src)} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
