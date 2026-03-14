import { useState } from 'react';
import type { Channel } from '../../types';
import { HashIcon } from '../icons';

interface ChannelItemProps {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}

export const ChannelItem: React.FC<ChannelItemProps> = ({ channel, isActive, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        textAlign: 'left',
        fontSize: 13,
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        borderLeft: `2px solid ${isActive ? 'var(--color-nav-active-border)' : 'transparent'}`,
        backgroundColor: isActive
          ? 'var(--color-nav-active-bg)'
          : hovered
          ? 'var(--color-nav-hover)'
          : 'transparent',
        color: isActive ? 'var(--color-nav-text-active)' : 'var(--color-text-2)',
        cursor: 'pointer',
        transition: 'color 0.15s, background-color 0.15s',
        fontFamily: 'inherit',
      }}
    >
      <HashIcon
        size={14}
        style={{ color: isActive ? 'var(--color-nav-text-active)' : 'var(--color-text-3)' }}
      />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {channel.name}
      </span>
      {channel.unread && channel.unread > 0 ? (
        <span
          style={{
            minWidth: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            borderRadius: 9,
            backgroundColor: 'var(--color-danger)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {channel.unread}
        </span>
      ) : null}
    </button>
  );
};
