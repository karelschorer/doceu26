import { useEffect, useRef } from 'react';
import type { Message } from '../../types';
import { isSameDay, formatDayHeader } from '../../utils';
import { MessageGroup } from './MessageGroup';
import { EmptyState } from './EmptyState';

interface MessageListProps {
  messages: Message[];
  onReply: (messageId: string) => void;
  emptyType?: 'channel' | 'dm' | 'group';
  emptyName?: string;
  emptyColor?: string;
  emptyInitials?: string;
}

/** Group consecutive messages from the same user within a 5-minute window */
function groupMessages(messages: Message[]): { dayTs: number; groups: Message[][] }[] {
  const FIVE_MIN = 5 * 60 * 1000;
  const result: { dayTs: number; groups: Message[][] }[] = [];

  let currentDay: { dayTs: number; groups: Message[][] } | null = null;
  let currentGroup: Message[] = [];

  for (const msg of messages) {
    // Check if we need a new day section
    if (!currentDay || !isSameDay(currentDay.dayTs, msg.timestamp)) {
      // flush current group
      if (currentGroup.length && currentDay) {
        currentDay.groups.push(currentGroup);
        currentGroup = [];
      }
      currentDay = { dayTs: msg.timestamp, groups: [] };
      result.push(currentDay);
    }

    const prev = currentGroup[currentGroup.length - 1];
    const sameUser = prev && prev.user_id === msg.user_id;
    const withinWindow = prev && msg.timestamp - prev.timestamp < FIVE_MIN;

    if (sameUser && withinWindow) {
      currentGroup.push(msg);
    } else {
      if (currentGroup.length) {
        currentDay.groups.push(currentGroup);
      }
      currentGroup = [msg];
    }
  }

  // flush remaining
  if (currentGroup.length && currentDay) {
    currentDay.groups.push(currentGroup);
  }

  return result;
}

export function MessageList({
  messages,
  onReply,
  emptyType = 'channel',
  emptyName = '',
  emptyColor,
  emptyInitials,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <EmptyState
          type={emptyType}
          name={emptyName}
          color={emptyColor}
          initials={emptyInitials}
        />
      </div>
    );
  }

  const sections = groupMessages(messages);

  return (
    <div ref={containerRef} style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '16px 0' }}>
        {sections.map((section, si) => (
          <div key={si}>
            {/* Day separator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--color-text-muted)',
                  flexShrink: 0,
                }}
              >
                {formatDayHeader(section.dayTs)}
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            </div>

            {/* Message groups */}
            {section.groups.map((group, gi) => (
              <MessageGroup key={gi} messages={group} onReply={onReply} />
            ))}
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
