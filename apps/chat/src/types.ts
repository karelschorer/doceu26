/* ── Types ───────────────────────────────────────────────────────────────── */

export interface Message {
  id: string;
  user_id: string;
  user_display_name?: string;
  content: string;
  timestamp: number;
  channel_id?: string;
  type?: string; // 'text' | 'dm' | 'call_offer' | 'call_answer' | 'ice_candidate' | 'call_end' | 'call_ringing'
  payload?: unknown;
  sender_uuid?: string; // DM messages: UUID of the sender (for inbox routing)
}

export interface Channel {
  id: string;
  name: string;
  unread?: number;
}

export interface Team {
  id: string;
  name: string;
  channels: Channel[];
  members: string[]; // user UUIDs
  created_by: string;
}

export interface DM {
  id: string;
  name: string;
  initials: string;
  color: string;
  online: boolean;
  unread?: number;
}

export interface WorkspaceUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  active: boolean;
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // user UUIDs
  memberNames: string[]; // display names
  created_by: string;
  created_at: string;
}

export type CallState = 'idle' | 'outgoing' | 'incoming' | 'connected';
