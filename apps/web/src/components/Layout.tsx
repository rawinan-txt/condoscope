import { Info } from 'lucide-react';
import { createContext, useContext, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import type { Source } from '../services/api';
import Footer from './Footer';
import Navbar from './Navbar';

const DataSourceContext = createContext<(s: Source | null) => void>(() => {});
/** Pages call this with the source of the data they show, so the banner never hides fallback data. */
export const useReportSource = () => useContext(DataSourceContext);

export default function Layout() {
  const [source, setSource] = useState<Source | null>(null);
  // the explorer is one screen tall (header + building); the footer sits just below the fold
  const fullBleed = useLocation().pathname.startsWith('/explorer/');
  return (
    <DataSourceContext.Provider value={setSource}>
      <div className="flex min-h-full flex-col">
        <div data-screen className={fullBleed ? 'flex h-dvh flex-col' : 'contents'}>
        <Navbar />
        {source === 'fallback' && (
          <div role="status" className="border-b border-amber-200 bg-amber-50">
            <p className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-sm text-amber-900">
              <Info className="size-4 shrink-0" aria-hidden />
              <span><b>Demo Fallback Mode</b> — กำลังแสดงข้อมูลสำรองที่มากับเว็บ ไม่ใช่ข้อมูลจากฐานข้อมูล</span>
            </p>
          </div>
        )}
        <main className={fullBleed ? 'min-h-0 flex-1 overflow-auto' : 'flex-1'} data-full-bleed={fullBleed ? 'true' : undefined}>
          <Outlet />
        </main>
        </div>
        <Footer />
      </div>
    </DataSourceContext.Provider>
  );
}
