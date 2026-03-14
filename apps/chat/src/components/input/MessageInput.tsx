import { useRef, useCallback, useEffect } from 'react';
import { MessageToolbar } from './MessageToolbar';

interface MessageInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled?: boolean;
  showVideoButton?: boolean;
  onVideoCall?: () => void;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  placeholder,
  disabled = false,
  showVideoButton,
  onVideoCall,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div style={{ padding: '0 16px 12px' }}>
      <div
        style={{
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border-strong)',
          boxShadow: 'var(--shadow-xs)',
          opacity: disabled ? 0.5 : 1,
          background: 'var(--color-bg)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          style={{
            width: '100%',
            resize: 'none',
            background: 'transparent',
            padding: '12px 12px 4px',
            fontSize: 14,
            color: 'var(--color-text)',
            outline: 'none',
            border: 'none',
            maxHeight: 160,
            fontFamily: 'var(--font)',
            lineHeight: 1.5,
            boxSizing: 'border-box',
          }}
        />
        <MessageToolbar
          onSend={onSend}
          canSend={value.trim().length > 0 && !disabled}
          showVideoButton={showVideoButton}
          onVideoCall={onVideoCall}
        />
      </div>
      <p
        style={{
          marginTop: 6,
          fontSize: 11,
          color: 'var(--color-text-muted)',
          userSelect: 'none',
          marginBottom: 0,
        }}
      >
        Enter to send &middot; Shift+Enter for new line
      </p>
    </div>
  );
}
