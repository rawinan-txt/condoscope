import { Building2, Info } from 'lucide-react';
import { createContext, useContext, useState } from 'react';
import { Link, Outlet } from 'react-router';
import type { Source } from '../services/api';

const DataSourceContext = createContext<(s: Source | null) => void>(() => {});
/** Pages call this with the source of the data they show, so the banner never hides fallback data. */
export const useReportSource = () => useContext(DataSourceContext);

export default function Layout() {
  const [source, setSource] = useState<Source | null>(null);
  return (
    <DataSourceContext.Provider value={setSource}>
      <div className="flex min-h-full flex-col">
        <header className="border-b border-slate-200">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <Building2 className="size-5 text-accent" aria-hidden />
              CondoScope
            </Link>
            <span className="rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-900">ข้อมูลจำลอง</span>
          </div>
        </header>
        {source === 'fallback' && (
          <div role="status" className="border-b border-amber-200 bg-amber-50">
            <p className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-sm text-amber-900">
              <Info className="size-4 shrink-0" aria-hidden />
              <span><b>Demo Fallback Mode</b> — กำลังแสดงข้อมูลสำรองที่มากับเว็บ ไม่ใช่ข้อมูลจากฐานข้อมูล</span>
            </p>
          </div>
        )}
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-500">
          ข้อมูลจำลองเพื่อการสาธิต ไม่มีการขายจริง · ชื่อโครงการทั้งหมดเป็นชื่อสมมติ
        </footer>
      </div>
    </DataSourceContext.Provider>
  );
}
