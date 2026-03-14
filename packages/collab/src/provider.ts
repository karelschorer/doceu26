import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import type { CollabUser } from './types';

export interface CollabProviderOptions {
  documentId: string;
  wsUrl?: string;
  user: CollabUser;
  offline?: boolean;
}

export class CollabProvider {
  readonly doc: Y.Doc;
  readonly wsProvider: WebsocketProvider;
  readonly indexeddbProvider?: IndexeddbPersistence;

  constructor(options: CollabProviderOptions) {
    this.doc = new Y.Doc();

    const wsUrl = options.wsUrl ?? 'ws://localhost:8083';

    this.wsProvider = new WebsocketProvider(
      wsUrl,
      options.documentId,
      this.doc,
      { connect: true }
    );

    if (options.offline) {
      this.indexeddbProvider = new IndexeddbPersistence(
        `doceu26-${options.documentId}`,
        this.doc
      );
    }

    // Set user awareness
    this.wsProvider.awareness.setLocalStateField('user', options.user);
  }

  get connected(): boolean {
    return this.wsProvider.wsconnected;
  }

  destroy(): void {
    this.wsProvider.destroy();
    this.indexeddbProvider?.destroy();
    this.doc.destroy();
  }
}

export function createCollabProvider(options: CollabProviderOptions): CollabProvider {
  return new CollabProvider(options);
}
