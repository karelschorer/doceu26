import { getAvatarColor, getInitials } from '../../utils';

interface SidebarFooterProps {
  userName: string;
  userEmail: string;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ userName, userEmail }) => {
  const initials = getInitials(userName || userEmail);
  const color = getAvatarColor(userName || userEmail);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-2)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
          flexShrink: 0,
          backgroundColor: color,
        }}
      >
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {userName || userEmail}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-success)' }}>Active</div>
      </div>
    </div>
  );
};
