import { HashIcon, UsersIcon } from '../icons';

interface EmptyStateProps {
  type: 'channel' | 'dm' | 'group';
  name: string;
  color?: string;
  initials?: string;
}

export function EmptyState({ type, name, color, initials }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        maxWidth: 384,
      }}
    >
      {/* Icon / Avatar */}
      {type === 'channel' && (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--color-bg-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <HashIcon size={32} style={{ color: 'var(--color-text-3)' }} />
        </div>
      )}

      {type === 'dm' && (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 16,
            backgroundColor: color || 'var(--color-bg-4)',
          }}
        >
          {initials || name.slice(0, 2).toUpperCase()}
        </div>
      )}

      {type === 'group' && (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--color-bg-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <UsersIcon size={32} style={{ color: 'var(--color-text-3)' }} />
        </div>
      )}

      {/* Heading */}
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: 8,
          marginTop: 0,
        }}
      >
        {type === 'channel' && `Welcome to #${name}`}
        {type === 'dm' && `Start a conversation with ${name}`}
        {type === 'group' && `Group conversation with ${name}`}
      </h3>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 14,
          color: 'var(--color-text-3)',
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {type === 'channel' &&
          `This is the very beginning of the #${name} channel. Start the conversation by sending a message below.`}
        {type === 'dm' &&
          `Send a message to start chatting. Messages are private between you and ${name}.`}
        {type === 'group' &&
          'Send a message to get the conversation going. All group members will be notified.'}
      </p>
    </div>
  );
}
