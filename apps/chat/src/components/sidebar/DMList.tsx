import { useState } from 'react';
import type { DM } from '../../types';
import { ChevronDownIcon, ChevronRightIcon } from '../icons';
import { DMItem } from './DMItem';

interface DMListProps {
  dms: DM[];
  activeDMId: string | null;
  hoveredDMId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onCallClick: (id: string) => void;
}

export const DMList: React.FC<DMListProps> = ({
  dms,
  activeDMId,
  hoveredDMId,
  onSelect,
  onHover,
  onCallClick,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [headerHovered, setHeaderHovered] = useState(false);

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
          Direct Messages
        </button>
      </div>
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {dms.map((dm) => (
            <DMItem
              key={dm.id}
              dm={dm}
              isActive={dm.id === activeDMId}
              isHovered={dm.id === hoveredDMId}
              onSelect={() => onSelect(dm.id)}
              onHover={(hovered) => onHover(hovered ? dm.id : null)}
              onCallClick={() => onCallClick(dm.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
