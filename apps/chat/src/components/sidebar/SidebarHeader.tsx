import { useState } from 'react';
import { PlusIcon } from '../icons';

interface SidebarHeaderProps {
  wsConnected: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ wsConnected }) => {
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
          Agora
        </h1>
        {wsConnected && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--color-success)',
              flexShrink: 0,
            }}
          />
        )}
      </div>
      <button
        onMouseEnter={() => setBtnHovered(true)}
        onMouseLeave={() => setBtnHovered(false)}
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-sm)',
          color: btnHovered ? 'var(--color-text-2)' : 'var(--color-text-3)',
          backgroundColor: btnHovered ? 'var(--color-nav-hover)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'color 0.15s, background-color 0.15s',
        }}
        title="New message"
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
};
