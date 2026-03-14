import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';
import type { CollabUser, CollabCursor, CollabPresence } from './types';

export function getPresence(awareness: Awareness): CollabPresence {
  const users: CollabUser[] = [];
  const cursors = new Map<string, CollabCursor>();

  awareness.getStates().forEach((state, clientId) => {
    if (state.user) {
      users.push(state.user as CollabUser);
    }
    if (state.cursor) {
      const cursor = state.cursor as { anchor: number; head: number };
      const user = state.user as CollabUser;
      if (user) {
        cursors.set(String(clientId), {
          user,
          anchor: cursor.anchor,
          head: cursor.head,
        });
      }
    }
  });

  return { users, cursors };
}

export function setCursor(awareness: Awareness, anchor: number, head: number): void {
  awareness.setLocalStateField('cursor', { anchor, head });
}

export function clearCursor(awareness: Awareness): void {
  awareness.setLocalStateField('cursor', null);
}

export function subscribeToPresence(
  awareness: Awareness,
  callback: (presence: CollabPresence) => void
): () => void {
  const handler = () => callback(getPresence(awareness));
  awareness.on('change', handler);
  return () => awareness.off('change', handler);
}
