import type { ReactNode } from 'react';

interface ChatLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  threadPanel?: ReactNode;
}

export function ChatLayout({ sidebar, main, threadPanel }: ChatLayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        fontFamily: 'var(--font)',
      }}
    >
      {sidebar}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {main}
      </main>
      {threadPanel}
    </div>
  );
}
