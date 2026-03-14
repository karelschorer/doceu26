import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'member' | 'guest';
  active: boolean;
  created_at: string;
}

interface NewUserForm {
  email: string;
  display_name: string;
  role: 'admin' | 'member' | 'guest';
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin:  { bg: '#fde8e8', color: '#b91c1c' },
  member: { bg: '#e8f0fd', color: '#1d4ed8' },
  guest:  { bg: '#f3f4f6', color: '#6b7280' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState<NewUserForm>({ email: '', display_name: '', role: 'member' });
  const [submitting, setSubmitting] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ display_name: string; email: string; temp_password: string; signup_url?: string } | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  async function loadUsers() {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/users');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      // Fallback to seed data when service isn't running
      setUsers([
        { id: '1', email: 'karel@doceu26.eu', display_name: 'Karel Schorer', role: 'admin', active: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() },
      ]);
      setError('Auth service offline — showing local data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create user');
      setUsers((prev) => [...prev, data.user as User]);
      setCreatedCreds({ display_name: form.display_name, email: form.email, temp_password: data.temp_password, signup_url: data.signup_url });
      setForm({ email: '', display_name: '', role: 'member' });
      setShowInvite(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  async function updateUser(id: string, patch: { role?: string; active?: boolean }) {
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update user');
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...data } : u));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
      // Optimistic update fallback
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...patch } as User : u));
    }
  }

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.display_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.active).length,
    admins: users.filter((u) => u.role === 'admin').length,
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg-2)' }}>
      {/* Header */}
      <div style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', padding: '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Tenant Admin</h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Manage users, roles, and access for your DocEU26 workspace</p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            Invite user
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef9e7', border: '1px solid #f59e0b', borderRadius: 6, fontSize: 12, color: '#92400e' }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Total users', value: stats.total, color: 'var(--color-primary)' },
            { label: 'Active', value: stats.active, color: '#16a34a' },
            { label: 'Admins', value: stats.admins, color: '#b91c1c' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* User table */}
        <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {/* Table toolbar */}
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--color-border)' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              style={{ flex: 1, padding: '7px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: 'var(--font)', color: 'var(--color-text)', background: 'var(--color-bg-2)', outline: 'none', maxWidth: 260 }}
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: 'var(--font)', color: 'var(--color-text)', background: 'var(--color-bg-2)', cursor: 'pointer', outline: 'none' }}
            >
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="guest">Guest</option>
            </select>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>No users found</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-2)' }}>
                  {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((col) => (
                    <th key={col} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, idx) => (
                  <tr key={user.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--color-bg-2)'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = ''}
                  >
                    {/* Avatar + name */}
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {getInitials(user.display_name)}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{user.display_name}</span>
                      </div>
                    </td>
                    {/* Email */}
                    <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--color-text-3)' }}>{user.email}</td>
                    {/* Role */}
                    <td style={{ padding: '12px 20px' }}>
                      <select
                        value={user.role}
                        onChange={(e) => updateUser(user.id, { role: e.target.value })}
                        style={{ padding: '3px 8px', border: '1px solid transparent', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none', ...ROLE_COLORS[user.role] }}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="guest">Guest</option>
                      </select>
                    </td>
                    {/* Status */}
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: user.active ? '#16a34a' : '#9ca3af' }} />
                        <span style={{ fontSize: 12, color: user.active ? '#16a34a' : '#9ca3af', fontWeight: 500 }}>{user.active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </td>
                    {/* Joined */}
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDate(user.created_at)}</td>
                    {/* Actions */}
                    <td style={{ padding: '12px 20px' }}>
                      <button
                        onClick={() => updateUser(user.id, { active: !user.active })}
                        style={{ fontSize: 12, padding: '4px 10px', border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-bg)', cursor: 'pointer', color: 'var(--color-text-3)', fontFamily: 'var(--font)' }}
                      >
                        {user.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Invite user modal */}
      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowInvite(false); }}>
          <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: 420, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Invite user</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>A temporary password will be generated</div>
              </div>
              <button onClick={() => setShowInvite(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleInvite} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full name</label>
                <input
                  required
                  value={form.display_name}
                  onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                  placeholder="Alice Martin"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'var(--font)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="alice@yourcompany.eu"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'var(--font)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as NewUserForm['role'] }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'var(--font)', color: 'var(--color-text)', outline: 'none', background: 'var(--color-bg)', cursor: 'pointer' }}
                >
                  <option value="member">Member — can use all apps</option>
                  <option value="admin">Admin — can manage users</option>
                  <option value="guest">Guest — read-only access</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                <button type="button" onClick={() => setShowInvite(false)} style={{ flex: 1, padding: '9px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font)', color: 'var(--color-text-2)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '9px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Creating…' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Temp credentials modal */}
      {createdCreds && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: 480, padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>User invited</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 16 }}>
              {createdCreds.signup_url
                ? <>An invite email has been sent (or logged to server) to <strong>{createdCreds.email}</strong>. You can also share the link below directly.</>
                : <>Share these credentials with <strong>{createdCreds.display_name}</strong>. They must set a new password using the invite link.</>}
            </div>

            {/* Signup link (most prominent) */}
            {createdCreds.signup_url && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Invite link</div>
                <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
                  <code style={{ flex: 1, padding: '8px 12px', background: '#f0f7ff', border: '1px solid var(--color-primary)', borderRadius: 6, fontSize: 12, color: 'var(--color-primary)', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>
                    {createdCreds.signup_url}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(createdCreds.signup_url!)}
                    style={{ padding: '8px 12px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    Copy link
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 5 }}>Link expires in 72 hours</div>
              </div>
            )}

            {[
              { label: 'Email', value: createdCreds.email },
              { label: 'Temporary password', value: createdCreds.temp_password },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{ flex: 1, padding: '8px 12px', background: 'var(--color-bg-3)', borderRadius: 6, fontSize: 13, color: 'var(--color-text)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{value}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(value)}
                    style={{ padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-3)' }}
                    title="Copy"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}

            <button onClick={() => setCreatedCreds(null)} style={{ width: '100%', marginTop: 8, padding: '9px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)' }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
