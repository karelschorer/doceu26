import { useState, useRef, useEffect } from 'react';
import type { Message } from '../../types';
import { formatTime, getAvatarColor, getInitials } from '../../utils';
import { CloseIcon, SendIcon } from '../icons';

interface ThreadPanelProps {
  parentMessage: Message | null;
  messages: Message[];
  onClose: () => void;
  onSendReply: (text: string) => void;
}

export function ThreadPanel({
  parentMessage,
  messages,
  onClose,
  onSendReply,
}: ThreadPanelProps) {
  const [replyText, setReplyText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    onSendReply(trimmed);
    setReplyText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  if (!parentMessage) return null;

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        flexDirection: 'column',
        borderLeft: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
        width: 360,
        minWidth: 360,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border)',
          padding: '12px 16px',
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
          Thread
        </h3>
        <button
          onClick={onClose}
          title="Close thread"
          style={{
            display: 'flex',
            height: 28,
            width: 28,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-3)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 150ms, color 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-bg-3)';
            e.currentTarget.style.color = 'var(--color-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--color-text-3)';
          }}
        >
          <CloseIcon size={16} />
        </button>
      </div>

      {/* Parent message */}
      <div style={{ borderBottom: '1px solid var(--color-border)', padding: '12px 16px' }}>
        <ThreadMessage message={parentMessage} isParent />
      </div>

      {/* Replies */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {messages.length === 0 ? (
          <p
            style={{
              padding: '32px 0',
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--color-text-muted)',
              margin: 0,
            }}
          >
            No replies yet. Start the conversation!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {messages.map((msg) => (
              <ThreadMessage key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </div>

      {/* Reply input */}
      <div style={{ borderTop: '1px solid var(--color-border)', padding: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border-strong)',
            padding: '8px 12px',
          }}
        >
          <textarea
            ref={textareaRef}
            value={replyText}
            onChange={(e) => {
              setReplyText(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Reply..."
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              background: 'transparent',
              fontSize: 14,
              color: 'var(--color-text)',
              outline: 'none',
              border: 'none',
              maxHeight: 120,
              fontFamily: 'var(--font)',
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim()}
            title="Send reply"
            style={{
              display: 'flex',
              height: 28,
              width: 28,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              background: 'none',
              border: 'none',
              transition: 'color 150ms',
              color: replyText.trim() ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: replyText.trim() ? 'pointer' : 'default',
            }}
          >
            <SendIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ThreadMessage({ message, isParent }: { message: Message; isParent?: boolean }) {
  const name = message.user_display_name ?? message.user_id.slice(0, 8);
  const initials = getInitials(name);
  const color = getAvatarColor(name);

  return (
    <div style={{ display: 'flex', gap: 10, padding: isParent ? 0 : '6px 0' }}>
      <div
        style={{
          display: 'flex',
          height: 28,
          width: 28,
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          fontSize: 10,
          fontWeight: 600,
          color: '#fff',
          background: color,
        }}
      >
        {initials}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
            {name}
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            {formatTime(message.timestamp)}
          </span>
        </div>
        <p
          style={{
            marginTop: 2,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: 14,
            color: 'var(--color-text-2)',
            margin: '2px 0 0',
            lineHeight: 1.5,
          }}
        >
          {message.content}
        </p>
      </div>
    </div>
  );
}
