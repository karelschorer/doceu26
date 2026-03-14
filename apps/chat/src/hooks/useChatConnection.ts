import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message } from '../types';

/* ── Internal helpers ────────────────────────────────────────────────── */

interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  org_id?: string;
}

function wsUrl(channel: string, user: string, uuid: string): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws?channel=${encodeURIComponent(channel)}&user=${encodeURIComponent(user)}&uuid=${encodeURIComponent(uuid)}`;
}

/* ── Hook ────────────────────────────────────────────────────────────── */

export function useChatConnection(
  user: AuthUser | null,
  activeKey: string,
  activeChannelId: string,
  activeDMId: string | null,
  activeGroupId: string | null,
) {
  const USER_ID = user?.display_name ?? '';
  const USER_UUID = user?.id ?? '';

  const wsRef = useRef<WebSocket | null>(null);
  const inboxWsRef = useRef<WebSocket | null>(null);
  const sentMsgIds = useRef<Set<string>>(new Set());

  const [wsConnected, setWsConnected] = useState(false);
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, Message[]>>({});

  /* ── Load message history on channel switch ────────────────────────── */

  useEffect(() => {
    if (!USER_UUID) return;
    const channelId = activeDMId
      ? `dm:${[USER_UUID, activeDMId].sort().join('_')}`
      : activeGroupId
        ? activeGroupId
        : activeChannelId;
    fetch(`/api/v1/chat/channels/${encodeURIComponent(channelId)}/messages?limit=50`)
      .then((r) => (r.ok ? r.json() : []))
      .then((raw: Array<Record<string, unknown>>) => {
        if (!Array.isArray(raw) || raw.length === 0) return;
        // Map API response (created_at, user_display_name) -> frontend Message shape
        const msgs: Message[] = raw.map((m) => ({
          id: (m.id as string) ?? `${Date.now()}-${Math.random()}`,
          user_id: (m.user_display_name as string) || (m.user_id as string) || '',
          user_display_name: (m.user_display_name as string) || '',
          content: (m.content as string) || '',
          timestamp: m.created_at ? new Date(m.created_at as string).getTime() : Date.now(),
          channel_id: (m.channel_id as string) || '',
          type: (m.type as string) || undefined,
        }));
        setMessagesByChannel((prev) => ({
          ...prev,
          [activeKey]: msgs,
        }));
      })
      .catch(() => {});
  }, [activeChannelId, activeDMId, activeGroupId, activeKey, USER_UUID]);

  /* ── Persistent personal inbox WS (always open, receives incoming DMs) */

  useEffect(() => {
    if (!USER_UUID || !USER_ID) return;
    const ws = new WebSocket(wsUrl(`user_${USER_UUID}`, USER_ID, USER_UUID));
    inboxWsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as Message;
        if (sentMsgIds.current.has(msg.id)) {
          sentMsgIds.current.delete(msg.id);
          return;
        }
        if (msg.type !== 'dm' || !msg.sender_uuid) return;
        const storeKey = `dm:${msg.sender_uuid}`;
        setMessagesByChannel((prev) => ({
          ...prev,
          [storeKey]: [...(prev[storeKey] ?? []), msg],
        }));
      } catch {
        /* ignore */
      }
    };

    return () => {
      ws.close();
      if (inboxWsRef.current === ws) inboxWsRef.current = null;
    };
  }, [USER_UUID, USER_ID]);

  /* ── Channel WebSocket (chat messages only) ────────────────────────── */

  useEffect(() => {
    if (!USER_ID) return; // wait until auth is loaded

    // DM mode: connect to RECIPIENT's personal inbox channel so we can deliver to them.
    //          Incoming DMs to us arrive via our own inboxWsRef (user_${USER_UUID}), not here.
    // Channel mode: connect to the shared channel as before.
    const wsChannel = activeDMId ? `user_${activeDMId}` : activeChannelId;

    const ws = new WebSocket(wsUrl(wsChannel, USER_ID, USER_UUID));
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => {
      setWsConnected(false);
      if (wsRef.current === ws) wsRef.current = null;
    };
    ws.onerror = () => setWsConnected(false);

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as Message;
        // In DM mode the only messages on this WS are echoes of what we sent — suppress them.
        // Real incoming DMs arrive via inboxWsRef.
        if (sentMsgIds.current.has(msg.id)) {
          sentMsgIds.current.delete(msg.id);
          return;
        }
        if (activeDMId) return; // DMs handled by inbox WS
        if (msg.type && msg.type !== 'text') return; // signals handled by signalWsRef
        setMessagesByChannel((prev) => ({
          ...prev,
          [activeChannelId]: [...(prev[activeChannelId] ?? []), msg],
        }));
      } catch {
        /* ignore */
      }
    };

    return () => {
      ws.close();
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [activeChannelId, activeDMId, USER_ID, USER_UUID]);

  /* ── Send message ──────────────────────────────────────────────────── */

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const msg: Message = {
        id: `${Date.now()}-${Math.random()}`,
        user_id: USER_ID,
        user_display_name: USER_ID,
        content: trimmed,
        timestamp: Date.now(),
        channel_id: activeDMId
          ? `dm:${[USER_UUID, activeDMId].sort().join('_')}`
          : activeChannelId,
        // DM messages carry type + sender_uuid so the recipient's inbox WS can route them
        ...(activeDMId ? { type: 'dm', sender_uuid: USER_UUID } : {}),
      };

      setMessagesByChannel((prev) => ({
        ...prev,
        [activeKey]: [...(prev[activeKey] ?? []), msg],
      }));

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sentMsgIds.current.add(msg.id);
        wsRef.current.send(JSON.stringify(msg));
      }
    },
    [activeKey, USER_ID, USER_UUID, activeDMId, activeChannelId],
  );

  return {
    wsConnected,
    messagesByChannel,
    setMessagesByChannel,
    sendMessage,
  };
}
