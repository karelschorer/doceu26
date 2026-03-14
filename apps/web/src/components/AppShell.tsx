import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

// Product icons — custom SVG line-art (Lucide-style, 20×20 viewBox)
const FolioIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M4 2h8l4 4v12H4V2z" />
    <path d="M12 2v4h4" />
    <line x1="7" y1="9" x2="13" y2="9" />
    <line x1="7" y1="12" x2="13" y2="12" />
    <line x1="7" y1="15" x2="10" y2="15" />
  </svg>
);

const LatticeIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect x="2" y="2" width="16" height="16" rx="1.5" />
    <line x1="2" y1="7.5" x2="18" y2="7.5" />
    <line x1="2" y1="13" x2="18" y2="13" />
    <line x1="7.5" y1="2" x2="7.5" y2="18" />
    <line x1="13" y1="2" x2="13" y2="18" />
  </svg>
);

const DeckIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect x="1.5" y="2.5" width="17" height="11" rx="1.5" />
    <line x1="10" y1="13.5" x2="10" y2="17" />
    <line x1="6.5" y1="17" x2="13.5" y2="17" />
  </svg>
);

const HermesIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect x="2" y="4.5" width="16" height="11" rx="1.5" />
    <polyline points="2,4.5 10,11.5 18,4.5" />
  </svg>
);

const KronosIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect x="2" y="3.5" width="16" height="14" rx="1.5" />
    <line x1="2" y1="8.5" x2="18" y2="8.5" />
    <line x1="6" y1="1.5" x2="6" y2="5.5" />
    <line x1="14" y1="1.5" x2="14" y2="5.5" />
    <rect x="6.5" y="11" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const VaultIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M2 7a2 2 0 012-2h3.5l2 2H16a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V7z" />
  </svg>
);

const AgoraIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M2 4.5a2 2 0 012-2h7a2 2 0 012 2v4.5a2 2 0 01-2 2H8.5L6 13.5V11H4a2 2 0 01-2-2V4.5z" />
    <path d="M13 8h1.5a2 2 0 012 2v3.5a2 2 0 01-2 2h-1.5v2l-2.5-2H8a2 2 0 01-1.8-1.1" />
  </svg>
);

const HomeIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M3 9.5L10 3l7 6.5" />
    <path d="M5 8v8.5h4v-4h2v4h4V8" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <circle cx="10" cy="10" r="2.5" />
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" />
  </svg>
);

// Product definitions — memorable European-flavored names
const NAV_ITEMS = [
  { path: '/docs',     Icon: FolioIcon,   label: 'Folio',   color: '#2383e2' },
  { path: '/sheets',  Icon: LatticeIcon,  label: 'Lattice', color: '#0f9d58' },
  { path: '/slides',  Icon: DeckIcon,     label: 'Deck',    color: '#e8731a' },
  { path: '/email',   Icon: HermesIcon,   label: 'Hermes',  color: '#d93025' },
  { path: '/calendar',Icon: KronosIcon,   label: 'Kronos',  color: '#0891b2' },
  { path: '/drive',   Icon: VaultIcon,    label: 'Vault',   color: '#7c3aed' },
  { path: '/chat',    Icon: AgoraIcon,    label: 'Agora',   color: '#6366f1' },
];

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-root">
      <nav className="nav-rail">
        {/* Header: logo + workspace name */}
        <div className="nav-rail-header">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flex: 1, minWidth: 0 }}>
            <div className="nav-rail-logo">
              <svg viewBox="0 0 28 28" fill="none" width="16" height="16">
                <path d="M6 4h10l6 6v14H6V4z" fill="white" fillOpacity="0.9"/>
                <path d="M16 4v6h6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="9" y1="13" x2="19" y2="13" stroke="#2383e2" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="9" y1="17" x2="19" y2="17" stroke="#2383e2" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="9" y1="21" x2="15" y2="21" stroke="#2383e2" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="nav-rail-workspace">DocEU26</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1 }}>Workspace</div>
            </div>
          </Link>
        </div>

        {/* Home shortcut */}
        <div className="nav-rail-body">
          <Link
            to="/"
            className={`nav-rail-item ${location.pathname === '/' ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <span className="nav-rail-item-icon">
              <HomeIcon />
            </span>
            <span>Home</span>
          </Link>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--color-nav-border)', margin: '6px 0' }} />

          {/* App nav items */}
          {NAV_ITEMS.map(({ path, Icon, label, color }) => {
            const active = location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={`nav-rail-item ${active ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                <span
                  className="nav-rail-item-icon"
                  style={{ color: active ? color : undefined }}
                >
                  <Icon />
                </span>
                <span style={{ color: active ? color : undefined }}>{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer: admin + settings + user */}
        <div className="nav-rail-footer">
          <Link
            to="/admin"
            className={`nav-rail-item ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
            style={{ textDecoration: 'none', color: location.pathname.startsWith('/admin') ? 'var(--color-primary)' : 'var(--color-text-3)' }}
          >
            <span className="nav-rail-item-icon">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <circle cx="10" cy="7" r="3" />
                <path d="M3 18c0-3.3 3.1-6 7-6s7 2.7 7 6" />
                <circle cx="16" cy="5" r="1.5" fill="currentColor" stroke="none" />
                <path d="M16 3.5v-1M16 8v1M14 5h-1M18.5 5h1M14.9 3.9l-.7-.7M17.8 6.8l.7.7M17.8 3.2l.7-.7M14.2 6.8l-.7.7" strokeWidth="1" />
              </svg>
            </span>
            <span>Admin</span>
          </Link>
          <div className="nav-rail-item" style={{ cursor: 'pointer', color: 'var(--color-text-3)' }}>
            <span className="nav-rail-item-icon"><SettingsIcon /></span>
            <span>Settings</span>
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px', marginTop: 2, cursor: 'pointer' }}
            title="Click to sign out"
            onClick={handleLogout}
          >
            <div className="nav-rail-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {user ? getInitials(user.display_name) : '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.display_name ?? ''}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1 }}>{user?.role ?? ''}</div>
            </div>
          </div>
        </div>
      </nav>

      <main className="app-content">
        {children}
      </main>
    </div>
  );
}
