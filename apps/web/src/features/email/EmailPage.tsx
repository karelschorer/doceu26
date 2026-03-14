import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

interface Email {
  id: string;
  from: string;
  to?: string;
  subject: string;
  text_body: string;
  is_read: boolean;
  received_at: string;
  snippet?: string;
  starred?: boolean;
}

interface ComposeState {
  to: string;
  subject: string;
  body: string;
}

interface WorkspaceUser { id: string; email: string; display_name: string; role: string; active: boolean; }

function generateSampleEmails(contacts: WorkspaceUser[]): Email[] {
  const subjects = [
    'Welcome to DocEU26 — get started',
    'Project update — please review',
    'Can you take a look at this?',
  ];
  const bodies = [
    (name: string) => `Hi,\n\nWelcome aboard! Excited to have you on the team.\n\nLet me know if you need anything.\n\nBest,\n${name}`,
    (name: string) => `Hi,\n\nJust wanted to share the latest project status. Everything is on track. Please let me know if you have any questions.\n\nBest,\n${name}`,
    (name: string) => `Hello,\n\nI've uploaded some files to Vault. Looking forward to your feedback!\n\nCheers,\n${name}`,
  ];
  return contacts.slice(0, 3).map((c, i) => ({
    id: `sample-${c.id}`,
    from: `${c.display_name} <${c.email}>`,
    to: 'me@doceu26.eu',
    subject: subjects[i] ?? 'Hello',
    text_body: bodies[i]?.(c.display_name) ?? `Message from ${c.display_name}`,
    is_read: i > 0,
    received_at: new Date(Date.now() - 1000 * 60 * 60 * (i + 1) * 3).toISOString(),
    snippet: bodies[i]?.(c.display_name).split('\n')[2]?.trim() ?? '',
    starred: false,
  }));
}

const FOLDERS = [
  { id: 'INBOX', label: 'Inbox', icon: '📥', count: 4 },
  { id: 'STARRED', label: 'Starred', icon: '⭐', count: 0 },
  { id: 'SENT', label: 'Sent', icon: '📤', count: 0 },
  { id: 'DRAFTS', label: 'Drafts', icon: '📝', count: 2 },
  { id: 'TRASH', label: 'Trash', icon: '🗑', count: 0 },
];

const LABELS = [
  { id: 'work', name: 'Work', color: '#2563eb' },
  { id: 'personal', name: 'Personal', color: '#16a34a' },
  { id: 'finance', name: 'Finance', color: '#d97706' },
];

const TABS = ['Primary', 'Social', 'Promotions'] as const;
type Tab = typeof TABS[number];

const AVATAR_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitial(from: string): string {
  const name = from.split('<')[0].trim();
  return (name[0] || '?').toUpperCase();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getSenderName(from: string): string {
  const match = from.match(/^(.+?)\s*</);
  if (match) return match[1].trim();
  return from.split('@')[0];
}


export function EmailPage() {
  const { user } = useAuth();
  const [activeFolder, setActiveFolder] = useState('INBOX');
  const [emails, setEmails] = useState<Email[]>([]);
  const [contacts, setContacts] = useState<WorkspaceUser[]>([]);
  const [selected, setSelected] = useState<Email | null>(null);
  const [composing, setComposing] = useState(false);
  const [compose, setCompose] = useState<ComposeState>({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Primary');
  const [search, setSearch] = useState('');
  const [hoveredEmail, setHoveredEmail] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [starred, setStarred] = useState<Set<string>>(new Set());

  // Fetch workspace members for contact autocomplete and sample emails
  useEffect(() => {
    fetch('/api/v1/admin/users')
      .then((r) => r.json())
      .then((users: WorkspaceUser[]) => {
        if (!Array.isArray(users)) return;
        const others = users.filter((u) => u.id !== user?.id);
        setContacts(others);
        // Only populate sample emails if the email API hasn't returned real data
        setEmails((prev) => (prev.length === 0 ? generateSampleEmails(others) : prev));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/v1/email?folder=${activeFolder}`)
      .then((r) => r.json())
      .then((data: Email[]) => {
        if (Array.isArray(data) && data.length > 0) setEmails(data);
      })
      .catch(() => {});
  }, [activeFolder]);

  const sendEmail = async () => {
    if (!compose.to || !compose.subject) return;
    setSending(true);
    try {
      await fetch('/api/v1/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: [compose.to],
          subject: compose.subject,
          body: compose.body,
        }),
      });
    } finally {
      setSending(false);
      setComposing(false);
      setCompose({ to: '', subject: '', body: '' });
    }
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredEmails = emails.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.from.toLowerCase().includes(q) ||
      e.subject.toLowerCase().includes(q) ||
      (e.snippet || e.text_body).toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left sidebar */}
      <div className="sidebar" style={{ width: 220, overflowY: 'auto' }}>
        <div style={{ padding: '12px 10px 8px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', borderRadius: 'var(--radius-lg)', justifyContent: 'center', gap: 8 }}
            onClick={() => setComposing(true)}
          >
            <span>✏️</span>
            Compose
          </button>
        </div>

        <div style={{ paddingTop: 4 }}>
          {FOLDERS.map((folder) => (
            <button
              key={folder.id}
              className={`sidebar-item${activeFolder === folder.id ? ' active' : ''}`}
              onClick={() => { setActiveFolder(folder.id); setSelected(null); }}
            >
              <span className="sidebar-item-icon">{folder.icon}</span>
              <span style={{ flex: 1 }}>{folder.label}</span>
              {folder.count > 0 && (
                <span
                  className="sidebar-item-count"
                  style={
                    !folder.id.includes('DRAFT')
                      ? { background: 'var(--color-primary)', color: 'white', fontWeight: 600 }
                      : {}
                  }
                >
                  {folder.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="sidebar-header" style={{ marginTop: 12 }}>Labels</div>
        {LABELS.map((label) => (
          <button key={label.id} className="sidebar-item">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: label.color,
                flexShrink: 0,
                marginLeft: 2,
              }}
            />
            <span>{label.name}</span>
          </button>
        ))}
      </div>

      {/* Email list panel */}
      <div
        style={{
          width: 360,
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
          background: 'var(--color-bg)',
        }}
      >
        {/* Search bar */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 9,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 14,
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            <input
              className="input"
              placeholder="Search emails…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32 }}
            />
          </div>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
            background: 'var(--color-bg)',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px 4px',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                background: 'transparent',
                color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-3)',
                fontWeight: activeTab === tab ? 600 : 400,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'color var(--transition)',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Email rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredEmails.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-title">No emails</div>
              <div className="empty-state-desc">
                {search ? 'No emails match your search.' : 'Your inbox is empty.'}
              </div>
            </div>
          ) : (
            filteredEmails.map((email) => {
              const isSelected = selected?.id === email.id;
              const isHovered = hoveredEmail === email.id;
              const isStarred = starred.has(email.id);

              return (
                <div
                  key={email.id}
                  onClick={() => setSelected(email)}
                  onMouseEnter={() => setHoveredEmail(email.id)}
                  onMouseLeave={() => setHoveredEmail(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'var(--color-primary-light)'
                      : isHovered
                      ? 'var(--color-bg-3)'
                      : email.is_read
                      ? 'var(--color-bg)'
                      : 'var(--color-bg-2)',
                    borderLeft: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
                    transition: 'background var(--transition)',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: getAvatarColor(email.from),
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {getInitial(email.from)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      <span
                        style={{
                          flex: 1,
                          fontWeight: email.is_read ? 400 : 700,
                          fontSize: 13,
                          color: 'var(--color-text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {getSenderName(email.from)}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                        {formatDate(email.received_at)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontWeight: email.is_read ? 400 : 600,
                        fontSize: 13,
                        color: email.is_read ? 'var(--color-text-2)' : 'var(--color-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: 2,
                      }}
                    >
                      {email.subject}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {email.snippet || email.text_body.slice(0, 80)}
                    </div>
                  </div>

                  {/* Actions on hover / star */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={(e) => toggleStar(email.id, e)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 14,
                        opacity: isStarred ? 1 : isHovered ? 0.4 : 0.15,
                        color: isStarred ? '#f59e0b' : 'var(--color-text-3)',
                        padding: 2,
                        lineHeight: 1,
                      }}
                      title={isStarred ? 'Unstar' : 'Star'}
                    >
                      ⭐
                    </button>
                    {isHovered && (
                      <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Archive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          📁
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Delete"
                          onClick={(e) => e.stopPropagation()}
                        >
                          🗑
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Snooze"
                          onClick={(e) => e.stopPropagation()}
                        >
                          🔔
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Email reading pane */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--color-bg)',
        }}
      >
        {selected ? (
          <>
            {/* Email header */}
            <div
              style={{
                padding: '20px 28px 16px',
                borderBottom: '1px solid var(--color-border)',
                flexShrink: 0,
              }}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  marginBottom: 12,
                  lineHeight: 1.3,
                }}
              >
                {selected.subject}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: getAvatarColor(selected.from),
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {getInitial(selected.from)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>
                    {getSenderName(selected.from)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {selected.from} &rarr; {selected.to || 'me'}
                  </div>
                </div>
                <div
                  style={{
                    marginLeft: 'auto',
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {new Date(selected.received_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            {/* Email body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 28px',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: 'var(--color-text-2)',
                  whiteSpace: 'pre-wrap',
                  maxWidth: 680,
                }}
              >
                {selected.text_body}
              </div>
            </div>

            {/* Reply bar */}
            <div
              style={{
                padding: '12px 28px 16px',
                borderTop: '1px solid var(--color-border)',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <div
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    background: 'var(--color-bg-2)',
                  }}
                >
                  Reply to {getSenderName(selected.from)}
                </div>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply…"
                  style={{
                    width: '100%',
                    minHeight: 80,
                    padding: '10px 12px',
                    border: 'none',
                    resize: 'none',
                    fontFamily: 'var(--font)',
                    fontSize: 14,
                    color: 'var(--color-text)',
                    outline: 'none',
                    background: 'var(--color-bg)',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--color-bg-2)',
                    borderTop: '1px solid var(--color-border)',
                    gap: 8,
                  }}
                >
                  <button className="btn btn-primary btn-sm">Reply</button>
                  <button className="btn btn-ghost btn-sm">Forward</button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ height: '100%' }}>
            <div className="empty-state-icon">✉️</div>
            <div className="empty-state-title">Select an email to read</div>
            <div className="empty-state-desc">
              Choose an email from the list to view its contents here.
            </div>
          </div>
        )}
      </div>

      {/* Compose modal */}
      {composing && (
        <div className="modal-overlay" onClick={() => setComposing(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 540 }}>
            <div className="modal-title">New Message</div>

            <div className="form-group">
              <label className="form-label">To</label>
              <input
                className="input"
                placeholder="recipient@example.com"
                value={compose.to}
                onChange={(e) => setCompose((p) => ({ ...p, to: e.target.value }))}
                list="hermes-contacts"
                autoFocus
              />
              <datalist id="hermes-contacts">
                {contacts.map((c) => (
                  <option key={c.id} value={c.email}>{c.display_name}</option>
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <input
                className="input"
                placeholder="Subject"
                value={compose.subject}
                onChange={(e) => setCompose((p) => ({ ...p, subject: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <textarea
                className="input"
                placeholder="Write your message…"
                value={compose.body}
                onChange={(e) => setCompose((p) => ({ ...p, body: e.target.value }))}
                style={{ height: 300, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn btn-ghost btn-icon"
                title="Attach file"
                style={{ fontSize: 16 }}
              >
                📎
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => { setComposing(false); setCompose({ to: '', subject: '', body: '' }); }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={sendEmail}
                  disabled={sending || !compose.to}
                >
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
