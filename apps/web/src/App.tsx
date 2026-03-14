import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { DocsPage, EditorPage } from './features/docs';
import { SheetsPage } from './features/sheets';
import { SlidesPage } from './features/slides';
import { EmailPage } from './features/email';
import { CalendarPage } from './features/calendar';
import { DrivePage } from './features/drive';
import { ChatPage } from './features/chat';
import { HomePage } from './features/home/HomePage';
import { AdminPage } from './features/admin/AdminPage';
import { AcceptInvitePage } from './features/auth/AcceptInvitePage';
import { LoginPage } from './features/auth/LoginPage';
import { AuthProvider, useAuth } from './features/auth/AuthContext';

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
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/docs/:id" element={<EditorPage />} />
              <Route path="/sheets" element={<SheetsPage />} />
              <Route path="/slides" element={<SlidesPage />} />
              <Route path="/email" element={<EmailPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/drive" element={<DrivePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/admin" element={<AdminPage />} />
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
