import { Route, Routes } from 'react-router';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import ExplorerPage from './features/explorer/ExplorerPage';
import HomePage from './features/home/HomePage';
import ReservationsPage from './features/reservations/ReservationsPage';
import UnitPage from './features/unit/UnitPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="explorer/:projectId" element={<ExplorerPage />} />
        <Route path="unit/:unitId" element={<UnitPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
