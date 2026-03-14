import { useState } from 'react';
import type { DM } from '../../types';
import { VideoIcon } from '../icons';

interface DMItemProps {
  dm: DM;
  isActive: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
  onCallClick: () => void;
}

export const DMItem: React.FC<DMItemProps> = ({
  dm,
  isActive,
  isHovered,
  onSelect,
  onHover,
  onCallClick,
}) => {
  const [callBtnHovered, setCallBtnHovered] = useState(false);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 12px',
        textAlign: 'left',
        fontSize: 13,
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        borderLeft: `2px solid ${isActive ? 'var(--color-nav-active-border)' : 'transparent'}`,
        backgroundColor: isActive
          ? 'var(--color-nav-active-bg)'
          : isHovered
          ? 'var(--color-nav-hover)'
          : 'transparent',
        color: isActive ? 'var(--color-nav-text-active)' : 'var(--color-text-2)',
        cursor: 'pointer',
        transition: 'color 0.15s, background-color 0.15s',
        fontFamily: 'inherit',
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            backgroundColor: dm.color,
          }}
        >
          {dm.initials}
        </div>
        {/* Presence dot */}
        <span
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: '50%',
            border: '2px solid var(--color-bg-2)',
            backgroundColor: dm.online ? 'var(--color-success)' : 'var(--color-text-muted)',
          }}
        />
      </div>

      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {dm.name}
      </span>

      {/* Unread badge or call button */}
      {isHovered ? (
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onCallClick();
          }}
          onMouseEnter={() => setCallBtnHovered(true)}
          onMouseLeave={() => setCallBtnHovered(false)}
          style={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            color: callBtnHovered ? 'var(--color-primary)' : 'var(--color-text-3)',
            backgroundColor: callBtnHovered ? 'var(--color-nav-hover)' : 'transparent',
            cursor: 'pointer',
            transition: 'color 0.15s, background-color 0.15s',
          }}
          title={`Call ${dm.name}`}
        >
          <VideoIcon size={14} />
        </span>
      ) : dm.unread && dm.unread > 0 ? (
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
          {dm.unread}
        </span>
      ) : null}
    </button>
  );
};
