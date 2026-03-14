import { BoldIcon, ItalicIcon, AttachmentIcon, EmojiIcon, SendIcon, VideoIcon } from '../icons';

interface MessageToolbarProps {
  onSend: () => void;
  canSend: boolean;
  showVideoButton?: boolean;
  onVideoCall?: () => void;
}

export function MessageToolbar({
  onSend,
  canSend,
  showVideoButton,
  onVideoCall,
}: MessageToolbarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px 6px',
      }}
    >
      {/* Left side: formatting + attachments */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ToolbarButton onClick={() => {}} title="Bold">
          <BoldIcon size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => {}} title="Italic">
          <ItalicIcon size={16} />
        </ToolbarButton>

        <div
          style={{
            margin: '0 4px',
            height: 16,
            width: 1,
            background: 'var(--color-border-strong)',
          }}
        />

        <ToolbarButton onClick={() => {}} title="Attach file">
          <AttachmentIcon size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => {}} title="Emoji">
          <EmojiIcon size={16} />
        </ToolbarButton>
      </div>

      {/* Right side: video call + send */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {showVideoButton && (
          <ToolbarButton onClick={onVideoCall} title="Start video call">
            <VideoIcon size={16} />
          </ToolbarButton>
        )}
        <button
          onClick={onSend}
          disabled={!canSend}
          title="Send message"
          style={{
            display: 'flex',
            height: 28,
            width: 28,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            background: 'none',
            border: 'none',
            transition: 'color 150ms',
            color: canSend ? 'var(--color-primary)' : 'var(--color-text-muted)',
            cursor: canSend ? 'pointer' : 'default',
          }}
        >
          <SendIcon size={16} />
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({
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
      {children}
    </button>
  );
}
