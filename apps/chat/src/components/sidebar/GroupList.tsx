import { useState } from 'react';
import type { Group } from '../../types';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon, UsersIcon } from '../icons';

interface GroupListProps {
  groups: Group[];
  activeGroupId: string | null;
  onSelect: (id: string) => void;
  onCreateClick: () => void;
}

export const GroupList: React.FC<GroupListProps> = ({
  groups,
  activeGroupId,
  onSelect,
  onCreateClick,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [addHovered, setAddHovered] = useState(false);
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);

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
          Groups
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
          title="Create group"
        >
          <PlusIcon size={12} />
        </button>
      </div>
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {groups.map((group) => {
            const isActive = group.id === activeGroupId;
            const isGroupHovered = group.id === hoveredGroupId;
            const memberSummary =
              group.member_names.slice(0, 3).join(', ') +
              (group.member_names.length > 3 ? ` +${group.member_names.length - 3}` : '');

            return (
              <button
                key={group.id}
                onClick={() => onSelect(group.id)}
                onMouseEnter={() => setHoveredGroupId(group.id)}
                onMouseLeave={() => setHoveredGroupId(null)}
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
                    : isGroupHovered
                    ? 'var(--color-nav-hover)'
                    : 'transparent',
                  color: isActive ? 'var(--color-nav-text-active)' : 'var(--color-text-2)',
                  cursor: 'pointer',
                  transition: 'color 0.15s, background-color 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                <UsersIcon
                  size={14}
                  style={{
                    color: isActive ? 'var(--color-nav-text-active)' : 'var(--color-text-3)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {group.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--color-text-3)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {memberSummary}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
