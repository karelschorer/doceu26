import { useState } from 'react';
import type { Channel } from '../../types';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from '../icons';
import { ChannelItem } from './ChannelItem';

interface ChannelListProps {
  channels: Channel[];
  activeChannelId: string;
  onSelect: (id: string) => void;
  onCreateClick: () => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  activeChannelId,
  onSelect,
  onCreateClick,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [addHovered, setAddHovered] = useState(false);

  return (
    <div style={{ padding: '4px 8px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 4px',
        }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          onMouseEnter={() => setHeaderHovered(true)}
          onMouseLeave={() => setHeaderHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: headerHovered ? 'var(--color-text-2)' : 'var(--color-text-3)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            transition: 'color 0.15s',
          }}
        >
          {collapsed ? <ChevronRightIcon size={12} /> : <ChevronDownIcon size={12} />}
          Channels
        </button>
        <button
          onClick={onCreateClick}
          onMouseEnter={() => setAddHovered(true)}
          onMouseLeave={() => setAddHovered(false)}
          style={{
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            color: addHovered ? 'var(--color-text-2)' : 'var(--color-text-3)',
            backgroundColor: addHovered ? 'var(--color-nav-hover)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.15s, background-color 0.15s',
          }}
          title="Create channel"
        >
          <PlusIcon size={12} />
        </button>
      </div>
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {channels.map((ch) => (
            <ChannelItem
              key={ch.id}
              channel={ch}
              isActive={ch.id === activeChannelId}
              onClick={() => onSelect(ch.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
