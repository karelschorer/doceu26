import { ReplyIcon, EmojiIcon, BookmarkIcon, MoreHorizontalIcon } from '../icons';

interface MessageHoverActionsProps {
  onReply: () => void;
  onReact: () => void;
  onBookmark: () => void;
  onMore: () => void;
}

export function MessageHoverActions({
  onReply,
  onReact,
  onBookmark,
  onMore,
}: MessageHoverActionsProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: -8,
        right: 8,
        display: 'flex',
        alignItems: 'center',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border-strong)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-sm)',
        zIndex: 10,
      }}
    >
      <HoverActionButton onClick={onReply} title="Reply in thread" position="left">
        <ReplyIcon size={16} />
      </HoverActionButton>
      <HoverActionButton onClick={onReact} title="Add reaction">
        <EmojiIcon size={16} />
      </HoverActionButton>
      <HoverActionButton onClick={onBookmark} title="Bookmark">
        <BookmarkIcon size={16} />
      </HoverActionButton>
      <HoverActionButton onClick={onMore} title="More actions" position="right">
        <MoreHorizontalIcon size={16} />
      </HoverActionButton>
    </div>
  );
}

function HoverActionButton({
  children,
  onClick,
  title,
  position,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  position?: 'left' | 'right';
}) {
  const borderRadius =
    position === 'left'
      ? 'var(--radius-sm) 0 0 var(--radius-sm)'
      : position === 'right'
        ? '0 var(--radius-sm) var(--radius-sm) 0'
        : '0';

  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: 6,
        color: 'var(--color-text-3)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius,
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
