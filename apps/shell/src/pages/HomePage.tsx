import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Document {
  id: string;
  title: string;
  type: string;
  updated_at: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDocIcon(type: string): string {
  switch (type) {
    case 'sheet': return '📊';
    case 'slide': return '🖥';
    default: return '📄';
  }
}

const APPS = [
  { label: 'Folio',   subtitle: 'Documents',    icon: '✦', path: '/docs',     color: '#2383e2', bg: '#ebf3fd' },
  { label: 'Lattice', subtitle: 'Spreadsheets', icon: '⊞', path: '/sheets',   color: '#0f9d58', bg: '#e6f4ea' },
  { label: 'Deck',    subtitle: 'Presentations', icon: '▣', path: '/slides',   color: '#e8731a', bg: '#fdf0e6' },
  { label: 'Hermes',  subtitle: 'Email',         icon: '✉', path: '/email',    color: '#d93025', bg: '#fce8e6' },
  { label: 'Kronos',  subtitle: 'Calendar',      icon: '◫', path: '/calendar', color: '#0891b2', bg: '#e0f5f9' },
  { label: 'Vault',   subtitle: 'File Storage',  icon: '◧', path: '/drive',    color: '#7c3aed', bg: '#f0ebfd' },
  { label: 'Agora',   subtitle: 'Messaging',     icon: '◉', path: '/chat',     color: '#6366f1', bg: '#eeeffd' },
];

const QUICK_CREATE = [
  { label: 'New Folio',   icon: '✦', path: '/docs',   color: '#2383e2', bg: '#ebf3fd' },
  { label: 'New Lattice', icon: '⊞', path: '/sheets', color: '#0f9d58', bg: '#e6f4ea' },
  { label: 'New Deck',    icon: '▣', path: '/slides', color: '#e8731a', bg: '#fdf0e6' },
];

export function HomePage() {
  const navigate = useNavigate();
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/documents')
      .then((r) => r.json())
      .then((data) => setRecentDocs(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => setRecentDocs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        background: 'var(--color-bg-2)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Hero greeting */}
      <div
        style={{
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          padding: '32px 48px 28px',
        }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: 4,
          }}
        >
          {getGreeting()}, Karel
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-3)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div style={{ padding: '32px 48px', display: 'flex', flexDirection: 'column', gap: 40, maxWidth: 1100 }}>
        {/* Quick create */}
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Quick create
          </h2>
          <div style={{ display: 'flex', gap: 12 }}>
            {QUICK_CREATE.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '24px 32px',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  minWidth: 140,
                  transition: 'all var(--transition)',
                  boxShadow: 'var(--shadow-xs)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = item.color;
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-xs)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    width: 52,
                    height: 52,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: item.bg,
                    borderRadius: 'var(--radius)',
                    color: item.color,
                  }}
                >
                  {item.icon}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Recent documents */}
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Recent
          </h2>
          {loading ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Loading...</div>
          ) : recentDocs.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 24px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
              <div className="empty-state-icon">📄</div>
              <div className="empty-state-title">No recent documents</div>
              <div className="empty-state-desc">Create a new document to get started</div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
              }}
            >
              {recentDocs.map((doc) => (
                <button
                  key={doc.id}
                  className="card"
                  onClick={() => navigate(`/docs/${doc.id}`)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '16px',
                    cursor: 'pointer',
                    border: 'none',
                    textAlign: 'left',
                    background: 'var(--color-bg)',
                    transition: 'box-shadow var(--transition), transform var(--transition)',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  }}
                >
                  <span
                    style={{
                      fontSize: 24,
                      width: 44,
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--color-bg-3)',
                      borderRadius: 'var(--radius-sm)',
                      flexShrink: 0,
                    }}
                  >
                    {getDocIcon(doc.type)}
                  </span>
                  <div style={{ minWidth: 0, width: '100%' }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>
                      {timeAgo(doc.updated_at)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Your apps */}
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Your apps
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
            {APPS.map((app) => (
              <button
                key={app.path}
                onClick={() => navigate(app.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  boxShadow: 'var(--shadow-xs)',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-sm)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = app.color;
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-xs)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: 20, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: app.bg, borderRadius: 'var(--radius-sm)', flexShrink: 0, color: app.color }}>
                  {app.icon}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
