import { Route, Routes } from 'react-router';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import TempHome from './components/TempHome';
import ExplorerPage from './features/explorer/ExplorerPage';
import ReservationsPage from './features/reservations/ReservationsPage';
import UnitPage from './features/unit/UnitPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TempHome />} />
        <Route path="explorer/:projectId" element={<ExplorerPage />} />
        <Route path="unit/:unitId" element={<UnitPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
