import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AdminLayout } from './layouts/AdminLayout';
import { SignInPage } from './pages/SignInPage';
import { OverviewPage } from './pages/OverviewPage';
import { WithdrawalsPage } from './pages/WithdrawalsPage';
import { UsersPage } from './pages/UsersPage';
import { UserDetailPage } from './pages/UserDetailPage';
import { KycPage } from './pages/KycPage';
import { LedgerPage } from './pages/LedgerPage';
import { DisputesPage } from './pages/DisputesPage';
import { SettingsPage } from './pages/SettingsPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const { admin } = useAuth();
  if (!admin) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
}

export default function App() {
  const { admin } = useAuth();

  return (
    <Routes>
      <Route
        path="/sign-in"
        element={admin ? <Navigate to="/" replace /> : <SignInPage />}
      />
      <Route
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<OverviewPage />} />
        <Route path="/withdrawals" element={<WithdrawalsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:userId" element={<UserDetailPage />} />
        <Route path="/kyc" element={<KycPage />} />
        <Route path="/ledger" element={<LedgerPage />} />
        <Route path="/disputes" element={<DisputesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
