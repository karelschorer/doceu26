export interface CollabUser {
  id: string;
  name: string;
  color: string;
}

export interface CollabCursor {
  user: CollabUser;
  anchor: number;
  head: number;
}

export interface CollabPresence {
  users: CollabUser[];
  cursors: Map<string, CollabCursor>;
}
