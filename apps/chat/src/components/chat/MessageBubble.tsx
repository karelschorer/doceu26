import { useState } from 'react';
import type { Message } from '../../types';
import { getAvatarColor, getInitials, formatTime } from '../../utils';
import { MessageHoverActions } from './MessageHoverActions';

interface MessageBubbleProps {
  message: Message;
  showHeader: boolean;
  onReply: (messageId: string) => void;
}

export function MessageBubble({ message, showHeader, onReply }: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false);

  const displayName = message.user_display_name || message.user_id;
  const avatarColor = getAvatarColor(displayName);
  const initials = getInitials(displayName);

  return (
    <div
      style={{
        position: 'relative',
        padding: '2px 16px',
        transition: 'background 100ms',
        backgroundColor: hovered ? 'var(--color-bg-2)' : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Avatar column */}
        {showHeader ? (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
              marginTop: 2,
              backgroundColor: avatarColor,
            }}
          >
            {initials}
          </div>
        ) : (
          <div style={{ width: 36, flexShrink: 0 }} />
        )}

        {/* Content column */}
        <div style={{ minWidth: 0, flex: 1 }}>
          {showHeader && (
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--color-text)',
                }}
              >
                {displayName}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                }}
              >
                {formatTime(message.timestamp)}
              </span>
            </div>
          )}

          <p
            style={{
              color: 'var(--color-text-2)',
              fontSize: 14,
              lineHeight: 1.5,
              wordBreak: 'break-word',
              margin: 0,
            }}
          >
            {message.content}
          </p>

          {/* Reactions row (UI shell -- initially empty) */}
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }} />
        </div>
      </div>

      {/* Hover actions */}
      {hovered && (
        <MessageHoverActions
          onReply={() => onReply(message.id)}
          onReact={() => {}}
          onBookmark={() => {}}
          onMore={() => {}}
        />
      )}
    </div>
  );
}
