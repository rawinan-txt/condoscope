import type { Project } from '@condoscope/shared';
import { formatMillion } from '@condoscope/shared';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listProjects } from '../services/api';
import { useReportSource } from './Layout';

// shortcut: temporary project list, replaced by the real Home/Search page in Plan 3
export default function TempHome() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const report = useReportSource();
  useEffect(() => {
    listProjects().then((r) => { setProjects(r.data); report(r.source); });
  }, [report]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">เลือกโครงการเพื่อสำรวจตึก</h1>
      {!projects ? (
        <p className="mt-6 text-slate-500">กำลังโหลด…</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id} className="rounded-lg border border-slate-200 p-4">
              <h2 className="font-semibold">{p.name}</h2>
              <p className="text-sm text-slate-600">{p.neighborhood} · {p.province}</p>
              <p className="mt-2 text-sm">เริ่มต้น {formatMillion(p.starting_price)} · {p.total_units} ห้อง</p>
              <Link to={`/explorer/${p.id}`} className="mt-3 inline-block text-sm font-medium text-accent hover:underline">สำรวจตึก →</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
