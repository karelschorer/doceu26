import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { UnderDevelopment } from './components/UnderDevelopment';
import { ChatPage } from '@doceu26/chat';
import { LoginPage } from './auth/LoginPage';
import { AcceptInvitePage } from './auth/AcceptInvitePage';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { HomePage } from './pages/HomePage';
import { AdminPage } from './pages/AdminPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Standalone pages (no sidebar, no auth required) */}
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Main app with sidebar (auth required) */}
      <Route path="*" element={
        <ProtectedRoute>
          <AppShell>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/admin" element={<AdminPage />} />

              {/* Under development */}
              <Route path="/docs/*" element={<UnderDevelopment name="Folio" icon="\u2726" color="#2383e2" bg="#ebf3fd" />} />
              <Route path="/sheets" element={<UnderDevelopment name="Lattice" icon="\u229e" color="#0f9d58" bg="#e6f4ea" />} />
              <Route path="/slides" element={<UnderDevelopment name="Deck" icon="\u25a3" color="#e8731a" bg="#fdf0e6" />} />
              <Route path="/email" element={<UnderDevelopment name="Hermes" icon="\u2709" color="#d93025" bg="#fce8e6" />} />
              <Route path="/calendar" element={<UnderDevelopment name="Kronos" icon="\u25eb" color="#0891b2" bg="#e0f5f9" />} />
              <Route path="/drive" element={<UnderDevelopment name="Vault" icon="\u25e7" color="#7c3aed" bg="#f0ebfd" />} />
            </Routes>
          </AppShell>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
