import { useState, useEffect } from 'react';

export function AcceptInvitePage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token') ?? '';
    setToken(t);
    if (!t) {
      setStatus('error');
      setErrorMsg('No invite token found in the URL. Please use the link from your invite email.');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/v1/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to set password');
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={headingStyle}>Password set!</h1>
          <p style={subStyle}>Your account is ready. You can now log in with your email and new password.</p>
          <a href="/" style={btnStyle}>Go to DocEU26</a>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 12 }}>
          <rect width="32" height="32" rx="8" fill="#2383e2" />
          <text x="7" y="23" fontSize="18" fontWeight="700" fill="white" fontFamily="system-ui">D</text>
        </svg>

        <h1 style={headingStyle}>Set your password</h1>
        <p style={subStyle}>Welcome to DocEU26. Choose a strong password to activate your account.</p>

        {status === 'error' && errorMsg && (
          <div style={errorStyle}>{errorMsg}</div>
        )}

        {token && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
            <div>
              <label style={labelStyle}>New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                placeholder="At least 8 characters"
                style={inputStyle}
                autoFocus
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setErrorMsg(''); }}
                placeholder="Repeat your password"
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{ ...btnStyle, border: 'none', cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}
            >
              {status === 'loading' ? 'Activating\u2026' : 'Activate account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f5f4f2',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
  padding: '40px 36px',
  width: '100%',
  maxWidth: 400,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
};

const headingStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: '#37352f',
  margin: '0 0 6px',
};

const subStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#787774',
  marginBottom: 24,
  lineHeight: 1.5,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#37352f',
  marginBottom: 5,
  textAlign: 'left',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #e0deda',
  borderRadius: 6,
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#37352f',
  outline: 'none',
  boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '10px',
  background: '#2383e2',
  color: '#fff',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  textAlign: 'center',
  marginTop: 8,
};

const errorStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#fde8e8',
  border: '1px solid #f5a0a0',
  borderRadius: 6,
  fontSize: 13,
  color: '#b91c1c',
  marginBottom: 12,
  textAlign: 'left',
};
