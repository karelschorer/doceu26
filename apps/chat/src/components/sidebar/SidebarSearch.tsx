import { useState } from 'react';
import { SearchIcon } from '../icons';

interface SidebarSearchProps {
  value: string;
  onChange: (v: string) => void;
}

export const SidebarSearch: React.FC<SidebarSearchProps> = ({ value, onChange }) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ padding: '8px 12px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderRadius: 'var(--radius)',
          border: `1px solid ${focused ? 'var(--color-border-strong)' : 'var(--color-border)'}`,
          backgroundColor: 'var(--color-bg)',
          transition: 'border-color 0.15s',
        }}
      >
        <SearchIcon size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search conversations..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            fontSize: 13,
            color: 'var(--color-text)',
            outline: 'none',
            border: 'none',
            padding: 0,
            fontFamily: 'inherit',
          }}
        />
      </div>
    </div>
  );
};
