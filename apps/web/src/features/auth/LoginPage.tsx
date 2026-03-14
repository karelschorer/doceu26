import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2383e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 28 28" fill="none" width="18" height="18">
              <path d="M6 4h10l6 6v14H6V4z" fill="white" fillOpacity="0.9"/>
              <path d="M16 4v6h6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="9" y1="13" x2="19" y2="13" stroke="#2383e2" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="9" y1="17" x2="19" y2="17" stroke="#2383e2" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="9" y1="21" x2="15" y2="21" stroke="#2383e2" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#37352f', lineHeight: 1.2 }}>DocEU26</div>
            <div style={{ fontSize: 11, color: '#787774', lineHeight: 1 }}>Workspace</div>
          </div>
        </div>

        <h1 style={headingStyle}>Sign in to your workspace</h1>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
              autoFocus
              autoComplete="email"
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              style={inputStyle}
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ ...btnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
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
  alignItems: 'flex-start',
};

const headingStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#37352f',
  margin: '0 0 20px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#37352f',
  marginBottom: 5,
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
  width: '100%',
  padding: '10px',
  background: '#2383e2',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
  marginTop: 4,
};

const errorStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#fde8e8',
  border: '1px solid #f5a0a0',
  borderRadius: 6,
  fontSize: 13,
  color: '#b91c1c',
  marginBottom: 4,
};
