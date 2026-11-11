import { ChevronDown } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

/** Translucent dark panel floating over the 3D scene. Collapsing really removes the content from the accessibility tree. */
/** `bare` keeps the labelled region but drops the glass look (for a panel that already sits on a glass surface). */
export default function OverlayPanel({ title, children, collapsible = false, defaultOpen = true, bare = false, className = '' }: {
  title: string; children: ReactNode; collapsible?: boolean; defaultOpen?: boolean; bare?: boolean; className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  return (
    <section aria-label={title} className={`${bare ? '' : 'glass pointer-events-auto rounded-xl'} ${className}`}>
      {collapsible && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium"
        >
          {title}
          <ChevronDown className={`size-4 motion-safe:transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      )}
      <div id={bodyId} hidden={collapsible && !open}>{children}</div>
    </section>
  );
}
