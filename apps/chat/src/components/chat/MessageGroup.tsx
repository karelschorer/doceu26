import type { Message } from '../../types';
import { MessageBubble } from './MessageBubble';

interface MessageGroupProps {
  messages: Message[];
  onReply: (messageId: string) => void;
}

export function MessageGroup({ messages, onReply }: MessageGroupProps) {
  return (
    <div style={{ padding: '4px 0' }}>
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          showHeader={i === 0}
          onReply={onReply}
        />
      ))}
    </div>
  );
}
