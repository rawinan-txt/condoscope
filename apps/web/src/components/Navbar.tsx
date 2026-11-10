import { Building2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { useReservationIds } from '../features/reservations/useReservationIds';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-2 text-sm ${isActive ? 'font-semibold text-accent' : 'text-slate-700 hover:text-accent'}`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const reserved = useReservationIds().length;
  const close = () => setOpen(false);

  const links = (
    <>
      <NavLink to="/search" className={linkClass} onClick={close}>ค้นหาคอนโด</NavLink>
      <NavLink to="/map" className={linkClass} onClick={close}>แผนที่</NavLink>
      {reserved > 0 && (
        <NavLink to="/reservations" className={linkClass} onClick={close}>
          รายการที่จองไว้ (Demo) <span className="ml-1 rounded-full bg-accent px-1.5 text-xs text-white">{reserved}</span>
        </NavLink>
      )}
    </>
  );

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Building2 className="size-5 text-accent" aria-hidden />
          CondoScope
        </Link>
        <nav aria-label="เมนูหลัก" className="hidden items-center gap-1 md:flex">{links}</nav>
        <div className="flex items-center gap-2">
          <span className="rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-900">ข้อมูลจำลอง</span>
          <button type="button" aria-label="เมนู" aria-expanded={open} aria-controls="mobile-nav" className="rounded p-2 md:hidden" onClick={() => setOpen((o) => !o)}>
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>
      {open && <nav id="mobile-nav" aria-label="เมนูมือถือ" className="flex flex-col border-t border-slate-200 px-4 py-2 md:hidden">{links}</nav>}
    </header>
  );
}
