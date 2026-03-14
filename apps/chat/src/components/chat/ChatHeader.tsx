import { HashIcon, VideoIcon, UsersIcon } from '../icons';
import { getAvatarColor, getInitials } from '../../utils';

interface ChatHeaderProps {
  activeName: string;
  activeTeamName?: string;
  isChannel: boolean;
  isDM: boolean;
  isGroup: boolean;
  onVideoCall: () => void;
  onToggleSidebar: () => void;
  isMobile: boolean;
}

export function ChatHeader({
  activeName,
  activeTeamName,
  isChannel,
  isDM,
  isGroup,
  onVideoCall,
  onToggleSidebar,
  isMobile,
}: ChatHeaderProps) {
  const avatarColor = isDM ? getAvatarColor(activeName) : undefined;
  const initials = isDM ? getInitials(activeName) : undefined;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        height: 52,
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
      }}
    >
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {isMobile && (
          <button
            onClick={onToggleSidebar}
            style={{
              marginRight: 4,
              padding: 4,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-3)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width={20} height={20}>
              <line x1="3" y1="5" x2="17" y2="5" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="15" x2="17" y2="15" />
            </svg>
          </button>
        )}

        {isChannel && (
          <HashIcon size={20} style={{ color: 'var(--color-text-3)', flexShrink: 0 }} />
        )}

        {isDM && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
              backgroundColor: avatarColor,
            }}
          >
            {initials}
          </div>
        )}

        {isGroup && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-bg-4)',
              flexShrink: 0,
            }}
          >
            <UsersIcon size={16} style={{ color: 'var(--color-text-3)' }} />
          </div>
        )}

        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {isChannel && activeTeamName && (
            <>
              <span style={{ color: 'var(--color-text-3)', fontWeight: 500 }}>
                {activeTeamName}
              </span>
              <span style={{ color: 'var(--color-text-3)', fontWeight: 400, fontSize: 13 }}>›</span>
            </>
          )}
          {isChannel ? `#${activeName}` : activeName}
        </h2>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <HeaderButton onClick={onVideoCall} title="Start video call">
          <VideoIcon size={18} />
        </HeaderButton>

        {isChannel && (
          <HeaderButton title="Members">
            <UsersIcon size={18} />
          </HeaderButton>
        )}
      </div>
    </div>
  );
}

function HeaderButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: 8,
        borderRadius: 'var(--radius-sm)',
        color: 'var(--color-text-3)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 150ms, color 150ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--color-bg-3)';
        e.currentTarget.style.color = 'var(--color-text-2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'none';
        e.currentTarget.style.color = 'var(--color-text-3)';
      }}
    >
      {children}
    </button>
  );
}
