import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

/* ── Types ───────────────────────────────────────────────────────────────── */

interface Message {
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

interface Channel { id: string; name: string; unread?: number; }
interface DM { id: string; name: string; initials: string; color: string; online: boolean; unread?: number; }
interface WorkspaceUser { id: string; email: string; display_name: string; role: string; active: boolean; }

type CallState = 'idle' | 'outgoing' | 'incoming' | 'connected';

/* ── Constants ───────────────────────────────────────────────────────────── */

const DEFAULT_CHANNELS: Channel[] = [
  { id: 'general', name: 'general' },
  { id: 'random', name: 'random' },
  { id: 'dev', name: 'dev' },
  { id: 'design', name: 'design' },
  { id: 'announcements', name: 'announcements' },
];

const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#d97706'];
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDayHeader(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function isSameDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/* ── Video call icons ────────────────────────────────────────────────────── */

const VideoIcon = ({ off }: { off?: boolean }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    {off ? (
      <>
        <path d="M2 7h8l2 2v2l2 1.5V8.5l2-1.5v7l-2-1.5V14l-2 2H2V7z" />
        <line x1="2" y1="2" x2="18" y2="18" />
      </>
    ) : (
      <>
        <rect x="2" y="6" width="12" height="8" rx="1.5" />
        <polyline points="14,9 18,7 18,13 14,11" />
      </>
    )}
  </svg>
);

const MicIcon = ({ off }: { off?: boolean }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    {off ? (
      <>
        <rect x="7" y="2" width="6" height="9" rx="3" />
        <path d="M3 10a7 7 0 0014 0" />
        <line x1="10" y1="17" x2="10" y2="19" />
        <line x1="7" y1="19" x2="13" y2="19" />
        <line x1="2" y1="2" x2="18" y2="18" />
      </>
    ) : (
      <>
        <rect x="7" y="2" width="6" height="9" rx="3" />
        <path d="M3 10a7 7 0 0014 0" />
        <line x1="10" y1="17" x2="10" y2="19" />
        <line x1="7" y1="19" x2="13" y2="19" />
      </>
    )}
  </svg>
);

const ScreenShareIcon = ({ active }: { active?: boolean }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect x="2" y="3" width="16" height="11" rx="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={0.15} />
    <line x1="10" y1="14" x2="10" y2="17" />
    <line x1="6" y1="17" x2="14" y2="17" />
    <polyline points="7,8.5 10,5.5 13,8.5" />
    <line x1="10" y1="5.5" x2="10" y2="12" />
  </svg>
);

const PhoneOffIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M16.5 14.5l-2-2a1 1 0 00-1.4 0l-1 1a10 10 0 01-5.6-5.6l1-1a1 1 0 000-1.4l-2-2A1 1 0 004 4L2.5 5.5C2 8 3.5 13 7.5 17s9 5.5 11.5 5l1.5-1.5a1 1 0 00-.5-1.5z" />
    <line x1="2" y1="2" x2="18" y2="18" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M16.5 14.5l-2-2a1 1 0 00-1.4 0l-1 1a10 10 0 01-5.6-5.6l1-1a1 1 0 000-1.4l-2-2A1 1 0 004 4L2.5 5.5C2 8 3.5 13 7.5 17s9 5.5 11.5 5l1.5-1.5a1 1 0 00-.5-1.5z" />
  </svg>
);

/* ── RemoteVideoTile ──────────────────────────────────────────────────────── */

function RemoteVideoTile({ peerId, peerName, stream, isScreenShare }: { peerId: string; peerName: string; stream: MediaStream; isScreenShare?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  // When replaceTrack() is used on the sender side, the remote track fires
  // mute→unmute.  Re-attach srcObject to nudge the video element to render
  // the new content (some browsers need this).
  useEffect(() => {
    const videoTracks = stream.getVideoTracks();
    const handlers: Array<() => void> = [];
    for (const track of videoTracks) {
      const onUnmute = () => {
        if (ref.current) {
          ref.current.srcObject = null;
          ref.current.srcObject = stream;
        }
        forceRender((n) => n + 1);
      };
      track.addEventListener('unmute', onUnmute);
      handlers.push(() => track.removeEventListener('unmute', onUnmute));
    }
    // Also handle tracks added later (renegotiation path)
    const onAddTrack = () => {
      if (ref.current) {
        ref.current.srcObject = null;
        ref.current.srcObject = stream;
      }
      forceRender((n) => n + 1);
    };
    stream.addEventListener('addtrack', onAddTrack);
    return () => {
      handlers.forEach((h) => h());
      stream.removeEventListener('addtrack', onAddTrack);
    };
  }, [stream]);

  return (
    <div style={{ position: 'relative', background: '#1a1d21', overflow: 'hidden' }}>
      <video ref={ref} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: isScreenShare ? 'contain' : 'cover' }} />
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        fontSize: 12, fontWeight: 600, color: '#fff',
        background: 'rgba(0,0,0,0.55)', padding: '2px 8px', borderRadius: 4,
      }}>
        {peerName}{isScreenShare ? ' (screen)' : ''}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

export function ChatPage() {
  const { user } = useAuth();
  const USER_ID = user?.display_name ?? '';
  const USER_UUID = user?.id ?? '';
  const USER_INITIALS = user ? getInitials(user.display_name) : '';

  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [activeDMId, setActiveDMId] = useState<string | null>(null);
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [dms, setDms] = useState<DM[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);

  // Video call state
  const [callState, setCallState] = useState<CallState>('idle');
  const [callRoom, setCallRoom] = useState<string | null>(null);   // channel id or dm id
  const [callIsGroup, setCallIsGroup] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ from: string; room: string; isGroup: boolean } | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [callParticipants, setCallParticipants] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenSharers, setRemoteScreenSharers] = useState<Set<string>>(new Set());
  const [callDuration, setCallDuration] = useState(0);

  const [dmSearch, setDmSearch] = useState('');
  const [hoveredDMId, setHoveredDMId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const wsRef = useRef<WebSocket | null>(null);
  const inboxWsRef = useRef<WebSocket | null>(null); // persistent personal inbox WS
  const signalWsRef = useRef<WebSocket | null>(null); // persistent signaling WS
  const callTargetRef = useRef<string | null>(null);  // UUID of call partner (DM)
  const callRoomRef = useRef<string | null>(null);    // mirrors callRoom state for use inside closures
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // WebRTC refs — pcMapRef keys are peer UUIDs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const pcMapRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeKey = activeDMId ? `dm:${activeDMId}` : activeChannelId;
  const messages = messagesByChannel[activeKey] ?? [];
  const activeDM = dms.find((d) => d.id === activeDMId);
  const activeName = activeDM ? activeDM.name : `#${activeChannelId}`;
  // Resolve caller display name from UUID (incomingCall.from is now a UUID)
  const callerName = incomingCall ? (dms.find((d) => d.id === incomingCall.from)?.name ?? incomingCall.from) : '';

  const filteredDMs = dmSearch.trim()
    ? dms.filter((d) => d.name.toLowerCase().includes(dmSearch.toLowerCase()))
    : dms;

  /* ── Load workspace members ─────────────────────────────────────── */

  useEffect(() => {
    fetch('/api/v1/admin/users')
      .then((r) => r.json())
      .then((users: WorkspaceUser[]) => {
        if (!Array.isArray(users)) return;
        setDms(
          users
            .filter((u) => u.id !== user?.id)
            .map((u) => ({
              id: u.id,
              name: u.display_name,
              initials: getInitials(u.display_name),
              color: getAvatarColor(u.display_name),
              online: false,
            }))
        );
      })
      .catch(() => {});
  }, []);

  /* ── Load channels from API ────────────────────────────────────── */

  const loadChannels = useCallback(() => {
    fetch('/api/v1/chat/channels')
      .then((r) => r.json())
      .then((chs: Channel[]) => {
        if (Array.isArray(chs)) setChannels(chs);
      })
      .catch(() => {
        setChannels(DEFAULT_CHANNELS);
      });
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  /* ── Load message history on channel switch ────────────────────── */

  useEffect(() => {
    if (!USER_UUID) return;
    const channelId = activeDMId ? `dm:${[USER_UUID, activeDMId].sort().join('_')}` : activeChannelId;
    fetch(`/api/v1/chat/channels/${encodeURIComponent(channelId)}/messages?limit=50`)
      .then((r) => r.ok ? r.json() : [])
      .then((raw: Array<Record<string, unknown>>) => {
        if (!Array.isArray(raw) || raw.length === 0) return;
        // Map API response (created_at, user_display_name) → frontend Message shape
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
          [activeDMId ? `dm:${activeDMId}` : activeChannelId]: msgs,
        }));
      })
      .catch(() => {});
  }, [activeChannelId, activeDMId, USER_UUID]);

  /* ── Persistent personal inbox WS (always open, receives incoming DMs) */

  useEffect(() => {
    if (!USER_UUID || !USER_ID) return;
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?channel=${encodeURIComponent(`user_${USER_UUID}`)}&user=${encodeURIComponent(USER_ID)}&uuid=${encodeURIComponent(USER_UUID)}`);
    inboxWsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as Message;
        if (sentMsgIds.current.has(msg.id)) { sentMsgIds.current.delete(msg.id); return; }
        if (msg.type !== 'dm' || !msg.sender_uuid) return;
        const storeKey = `dm:${msg.sender_uuid}`;
        setMessagesByChannel((prev) => ({
          ...prev,
          [storeKey]: [...(prev[storeKey] ?? []), msg],
        }));
      } catch { /* ignore */ }
    };
    return () => { ws.close(); if (inboxWsRef.current === ws) inboxWsRef.current = null; };
  }, [USER_UUID, USER_ID]);

  /* ── Persistent signaling WS (always open, handles call signals) ──── */

  useEffect(() => {
    if (!USER_ID || !USER_UUID) return;
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?channel=${encodeURIComponent(`signal_${USER_UUID}`)}&user=${encodeURIComponent(USER_ID)}&uuid=${encodeURIComponent(USER_UUID)}`);
    signalWsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as Message & { to?: string; room?: string; is_group?: boolean };
        if (msg.user_id === USER_UUID) return;           // ignore own echo
        if (msg.to && msg.to !== USER_UUID) return;      // targeted but not for us

        const from = msg.user_id;

        // ── Group: someone started a call in a channel ─────────────────
        if (msg.type === 'call_start') {
          setIncomingCall({ from, room: msg.room ?? '', isGroup: true });
          setCallState('incoming');
          return;
        }

        // ── Group: someone joined our active room call ──────────────────
        if (msg.type === 'call_join') {
          const room = msg.room ?? '';
          if (callRoomRef.current === room && localStreamRef.current && !pcMapRef.current.has(from)) {
            (async () => {
              const pc = createPCForPeer(from);
              localStreamRef.current!.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sendSignal({ type: 'call_offer', payload: offer, room, is_group: true }, from);
            })();
          }
          return;
        }

        // ── Group: someone left our active room call ────────────────────
        if (msg.type === 'call_leave') {
          pcMapRef.current.get(from)?.close();
          pcMapRef.current.delete(from);
          setRemoteStreams(prev => { const m = new Map(prev); m.delete(from); return m; });
          setCallParticipants(prev => prev.filter(p => p !== from));
          if (pcMapRef.current.size === 0) hangUp(false);
          return;
        }

        // ── Offer: could be DM or group ────────────────────────────────
        if (msg.type === 'call_offer') {
          if (msg.is_group && callRoomRef.current === msg.room) {
            const existingGroupPC = pcMapRef.current.get(from);
            if (existingGroupPC) {
              // Renegotiation from an existing group participant (e.g. screen share)
              (async () => {
                try {
                  await existingGroupPC.setRemoteDescription(msg.payload as RTCSessionDescriptionInit);
                  const answer = await existingGroupPC.createAnswer();
                  await existingGroupPC.setLocalDescription(answer);
                  sendSignal({ type: 'call_answer', payload: answer, room: msg.room, is_group: true }, from);
                  console.log('Handled group renegotiation offer from', from);
                } catch (err) {
                  console.error('Group renegotiation answer failed:', err);
                }
              })();
            } else if (localStreamRef.current) {
              // New participant joining: auto-accept offer
              (async () => {
                const pc = createPCForPeer(from);
                localStreamRef.current!.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
                await pc.setRemoteDescription(msg.payload as RTCSessionDescriptionInit);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendSignal({ type: 'call_answer', payload: answer, room: msg.room, is_group: true }, from);
              })();
            }
            return;
          }
          // DM 1-on-1 call
          // If we already have an active peer connection with this peer,
          // this is a renegotiation (e.g. screen sharing added a track),
          // NOT a new incoming call.
          const existingPC = pcMapRef.current.get(from);
          if (existingPC && callState !== 'idle') {
            (async () => {
              try {
                await existingPC.setRemoteDescription(msg.payload as RTCSessionDescriptionInit);
                const answer = await existingPC.createAnswer();
                await existingPC.setLocalDescription(answer);
                sendSignal({ type: 'call_answer', payload: answer }, from);
                console.log('Handled renegotiation offer from', from);
              } catch (err) {
                console.error('Renegotiation answer failed:', err);
              }
            })();
            return;
          }
          // Truly new incoming call
          callTargetRef.current = from;
          setIncomingCall({ from, room: from, isGroup: false });
          setCallState('incoming');
          const pc = createPCForPeer(from);
          pc.setRemoteDescription(msg.payload as RTCSessionDescriptionInit);
          return;
        }

        // ── Answer ─────────────────────────────────────────────────────
        if (msg.type === 'call_answer') {
          pcMapRef.current.get(from)?.setRemoteDescription(msg.payload as RTCSessionDescriptionInit);
          return;
        }

        // ── ICE ────────────────────────────────────────────────────────
        if (msg.type === 'ice_candidate') {
          pcMapRef.current.get(from)?.addIceCandidate(msg.payload as RTCIceCandidateInit);
          return;
        }

        // ── Screen share state ────────────────────────────────────────
        if (msg.type === 'screen_share_start') {
          setRemoteScreenSharers(prev => new Set(prev).add(from));
          return;
        }
        if (msg.type === 'screen_share_stop') {
          setRemoteScreenSharers(prev => { const s = new Set(prev); s.delete(from); return s; });
          return;
        }

        // ── DM 1-on-1 end ──────────────────────────────────────────────
        if (msg.type === 'call_end') {
          hangUp(false);
          return;
        }
      } catch { /* ignore */ }
    };

    return () => { ws.close(); signalWsRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [USER_ID, USER_UUID]);

  /* ── Sent message ID set — used to suppress echo from server ──────── */
  const sentMsgIds = useRef<Set<string>>(new Set());

  /* ── Channel WebSocket (chat messages only) ────────────────────────── */

  useEffect(() => {
    if (!USER_ID) return; // wait until auth is loaded

    // DM mode: connect to RECIPIENT's personal inbox channel so we can deliver to them.
    //          Incoming DMs to us arrive via our own inboxWsRef (user_${USER_UUID}), not here.
    // Channel mode: connect to the shared channel as before.
    const wsChannel = activeDMId ? `user_${activeDMId}` : activeChannelId;

    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?channel=${encodeURIComponent(wsChannel)}&user=${encodeURIComponent(USER_ID)}&uuid=${encodeURIComponent(USER_UUID)}`);
    wsRef.current = ws;
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => { setWsConnected(false); if (wsRef.current === ws) wsRef.current = null; };
    ws.onerror = () => setWsConnected(false);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as Message;
        // In DM mode the only messages on this WS are echoes of what we sent — suppress them.
        // Real incoming DMs arrive via inboxWsRef.
        if (sentMsgIds.current.has(msg.id)) { sentMsgIds.current.delete(msg.id); return; }
        if (activeDMId) return; // DMs handled by inbox WS
        if (msg.type && msg.type !== 'text') return; // signals handled by signalWsRef
        setMessagesByChannel((prev) => ({
          ...prev,
          [activeChannelId]: [...(prev[activeChannelId] ?? []), msg],
        }));
      } catch { /* ignore */ }
    };
    return () => { ws.close(); if (wsRef.current === ws) wsRef.current = null; };
  }, [activeChannelId, activeDMId, USER_ID, USER_UUID]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Messaging ─────────────────────────────────────────────────────── */

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const msg: Message = {
      id: `${Date.now()}-${Math.random()}`,
      user_id: USER_ID,
      user_display_name: USER_ID,
      content: text,
      timestamp: Date.now(),
      channel_id: activeDMId ? `dm:${[USER_UUID, activeDMId].sort().join('_')}` : activeChannelId,
      // DM messages carry type + sender_uuid so the recipient's inbox WS can route them
      ...(activeDMId ? { type: 'dm', sender_uuid: USER_UUID } : {}),
    };
    setMessagesByChannel((prev) => ({ ...prev, [activeKey]: [...(prev[activeKey] ?? []), msg] }));
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sentMsgIds.current.add(msg.id);
      wsRef.current.send(JSON.stringify(msg));
    }
  }, [input, activeKey, USER_ID, USER_UUID, activeDMId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  function sendSignal(payload: object, to?: string) {
    const target = to ?? callTargetRef.current;
    if (signalWsRef.current?.readyState === WebSocket.OPEN) {
      signalWsRef.current.send(JSON.stringify({ ...payload, user_id: USER_UUID, to: target, id: `sig-${Date.now()}`, timestamp: Date.now() }));
    }
  }

  /* ── WebRTC ────────────────────────────────────────────────────────── */

  /** Try to get user media with graceful fallback:
   *  1) video + audio   2) audio-only   3) video-only   4) give up
   *  Returns the stream, or null if nothing is available.
   */
  async function acquireMedia(): Promise<MediaStream | null> {
    // First check if mediaDevices API is available (requires HTTPS or localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support camera/microphone access. Make sure you are using HTTPS.');
      return null;
    }

    // Try video + audio
    try {
      return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      console.warn('getUserMedia(video+audio) failed:', (err as DOMException).name, (err as DOMException).message);
    }

    // Try audio-only
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      console.info('Falling back to audio-only (no camera available)');
      return stream;
    } catch (err) {
      console.warn('getUserMedia(audio-only) failed:', (err as DOMException).name, (err as DOMException).message);
    }

    // Try video-only
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      console.info('Falling back to video-only (no microphone available)');
      return stream;
    } catch (err) {
      console.warn('getUserMedia(video-only) failed:', (err as DOMException).name, (err as DOMException).message);
    }

    return null;
  }

  /** Build a user-friendly error message from a DOMException */
  function mediaErrorMessage(err: unknown): string {
    if (err instanceof DOMException) {
      switch (err.name) {
        case 'NotAllowedError':
          return 'Camera/microphone permission was denied. Please allow access in your browser settings and try again.';
        case 'NotFoundError':
          return 'No camera or microphone found. Please connect a device and try again.';
        case 'NotReadableError':
          return 'Camera or microphone is already in use by another application. Close other apps using the camera and try again.';
        case 'OverconstrainedError':
          return 'Camera does not support the requested settings.';
        case 'AbortError':
          return 'Camera/microphone access was aborted.';
        case 'SecurityError':
          return 'Camera/microphone access is blocked by your browser security policy. Make sure you are using HTTPS.';
        default:
          return `Could not access camera/microphone: ${err.name} - ${err.message}`;
      }
    }
    return `Could not access camera/microphone: ${String(err)}`;
  }

  function createPCForPeer(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal({ type: 'ice_candidate', payload: e.candidate, room: callRoomRef.current }, peerId);
    };
    pc.ontrack = (e) => {
      setRemoteStreams(prev => new Map(prev).set(peerId, e.streams[0]));
      setCallParticipants(prev => prev.includes(peerId) ? prev : [...prev, peerId]);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('connected');
        if (!callTimerRef.current) {
          callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
        }
      }
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        pcMapRef.current.delete(peerId);
        setRemoteStreams(prev => { const m = new Map(prev); m.delete(peerId); return m; });
        setCallParticipants(prev => prev.filter(p => p !== peerId));
        if (pcMapRef.current.size === 0 && callState !== 'idle') hangUp(false);
      }
    };
    pcMapRef.current.set(peerId, pc);
    return pc;
  }

  // Start a DM 1-on-1 video call
  async function startCall() {
    if (!activeDMId) { alert('Please select a user to call.'); return; }
    const targetUUID = activeDMId;
    callTargetRef.current = targetUUID;
    callRoomRef.current = activeDMId;
    setCallRoom(activeDMId);
    setCallIsGroup(false);

    const stream = await acquireMedia();
    if (!stream) {
      alert('Could not access camera or microphone.\n\nPlease check:\n• Camera/mic permissions in your browser\n• That no other app is using the camera\n• That your device has a camera/microphone');
      setCallState('idle');
      return;
    }

    try {
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPCForPeer(targetUUID);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({ type: 'call_offer', payload: offer }, targetUUID);
      setCallState('outgoing');
    } catch (err) {
      console.error('Failed to start call (WebRTC):', err);
      stream.getTracks().forEach(t => t.stop());
      alert('Failed to set up the call connection. Please try again.');
      setCallState('idle');
    }
  }

  // Start a group call in the current channel
  async function startGroupCall() {
    const room = activeChannelId;
    callRoomRef.current = room;
    setCallRoom(room);
    setCallIsGroup(true);
    setCallParticipants([USER_UUID]);
    const stream = await acquireMedia();
    if (stream) {
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    }
    // Even without camera/mic, announce the call so others can join
    sendSignal({ type: 'call_start', room }); // broadcast – no `to`
    setCallState('outgoing'); // waiting for others to join
  }

  // Accept an incoming DM 1-on-1 call
  async function acceptDMCall() {
    const ic = incomingCall;
    if (!ic) return;
    callTargetRef.current = ic.from;  // ic.from is now UUID
    callRoomRef.current = ic.from;
    setCallRoom(ic.from);
    setCallIsGroup(false);
    // Navigate to the DM with the caller (look up by UUID)
    const callerDM = dms.find((d) => d.id === ic.from);
    if (callerDM) setActiveDMId(callerDM.id);
    setIncomingCall(null);
    const stream = await acquireMedia();
    if (stream) {
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const pc = pcMapRef.current.get(ic.from);
      if (pc) {
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal({ type: 'call_answer', payload: answer }, ic.from);
      }
    }
    setCallState('connected');
    if (!callTimerRef.current) {
      callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }
  }

  // Join a group call in a channel
  async function joinGroupCall() {
    const ic = incomingCall;
    if (!ic) return;
    callRoomRef.current = ic.room;
    setCallRoom(ic.room);
    setCallIsGroup(true);
    setCallParticipants([USER_UUID]);
    setIncomingCall(null);
    // Switch to the channel where the call is happening
    setActiveDMId(null);
    setActiveChannelId(ic.room);
    const stream = await acquireMedia();
    if (stream) {
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    }
    // Announce we joined – existing participants will send us offers
    sendSignal({ type: 'call_join', room: ic.room });
    setCallState('outgoing'); // outgoing = "waiting for participants to connect"
    // Transition to connected once we get our first track (handled in createPCForPeer)
  }

  function hangUp(sendSignalToRemote = true) {
    if (sendSignalToRemote) {
      if (callIsGroup) {
        sendSignal({ type: 'call_leave', room: callRoomRef.current ?? undefined }); // broadcast
      } else {
        sendSignal({ type: 'call_end' }); // 1-on-1 end
      }
    }
    callTargetRef.current = null;
    callRoomRef.current = null;
    if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
    pcMapRef.current.forEach(pc => pc.close());
    pcMapRef.current.clear();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenTrackRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setCallState('idle');
    setCallRoom(null);
    setCallIsGroup(false);
    setIncomingCall(null);
    setRemoteStreams(new Map());
    setCallParticipants([]);
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setRemoteScreenSharers(new Set());
  }

  function toggleMute() {
    const stream = localStreamRef.current;
    if (!stream) { setIsMuted((m) => !m); return; }
    stream.getAudioTracks().forEach((t) => { t.enabled = isMuted; });
    setIsMuted((m) => !m);
  }

  function toggleCamera() {
    const stream = localStreamRef.current;
    if (!stream) { setIsCameraOff((c) => !c); return; }
    stream.getVideoTracks().forEach((t) => { t.enabled = isCameraOff; });
    setIsCameraOff((c) => !c);
  }

  /** Replace the video track on every peer connection sender.
   *  If there is no existing video sender (audio-only call), add the track and renegotiate. */
  async function replaceVideoTrackOnAllPeers(newTrack: MediaStreamTrack, isScreen: boolean) {
    for (const [peerId, pc] of pcMapRef.current) {
      // Find the existing video sender (simple: first sender whose track is video, or first with null track)
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
        ?? pc.getSenders().find((s) => s.track === null);

      if (sender) {
        try {
          await sender.replaceTrack(newTrack);
          // Boost quality for screen content
          if (isScreen) {
            try {
              const params = sender.getParameters();
              // setParameters is strict: only modify existing fields, never add new ones
              if (params.encodings && params.encodings.length > 0) {
                params.encodings[0].maxBitrate = 8_000_000; // 8 Mbps for crisp screen
              }
              await sender.setParameters(params);
            } catch (paramErr) {
              console.warn('Could not set encoding params:', paramErr);
            }
          }
          console.log(`Track replaced for peer ${peerId} (screen=${isScreen})`);
        } catch (err) {
          console.error(`replaceTrack failed for peer ${peerId}:`, err);
          // Fallback: remove old sender, add new track, renegotiate
          try {
            pc.removeTrack(sender);
            pc.addTrack(newTrack, new MediaStream([newTrack]));
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal({ type: 'call_offer', payload: offer, room: callRoomRef.current, is_group: callIsGroup }, peerId);
            console.log(`Renegotiated for peer ${peerId} after replaceTrack failure`);
          } catch (reErr) {
            console.error(`Renegotiation also failed for peer ${peerId}:`, reErr);
          }
        }
      } else {
        // No video sender exists (audio-only call) — add track and renegotiate
        console.log(`No video sender for peer ${peerId}, adding track + renegotiating`);
        pc.addTrack(newTrack, new MediaStream([newTrack]));
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal({ type: 'call_offer', payload: offer, room: callRoomRef.current, is_group: callIsGroup }, peerId);
        } catch (err) {
          console.error(`Renegotiation failed for peer ${peerId}:`, err);
        }
      }
    }
  }

  async function toggleScreenShare() {
    if (isScreenSharing) {
      // Stop screen sharing, restore camera
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        await replaceVideoTrackOnAllPeers(camTrack, false);
      }
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      // Notify all peers that screen sharing stopped
      for (const peerId of pcMapRef.current.keys()) {
        sendSignal({ type: 'screen_share_stop', room: callRoomRef.current, is_group: callIsGroup }, peerId);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920, max: 3840 },
            height: { ideal: 1080, max: 2160 },
            frameRate: { ideal: 30, max: 60 },
          },
          audio: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        if (!screenTrack || screenTrack.readyState === 'ended') {
          console.error('Screen capture track is ended or missing');
          return;
        }
        screenTrackRef.current = screenTrack;
        // Tell the encoder to prioritize resolution over framerate (sharp text)
        screenTrack.contentHint = 'detail';

        // Show screen in local video
        if (localVideoRef.current) {
          const combined = new MediaStream([screenTrack, ...(localStreamRef.current?.getAudioTracks() ?? [])]);
          localVideoRef.current.srcObject = combined;
        }

        // Replace video track in all peer connections with proper await
        await replaceVideoTrackOnAllPeers(screenTrack, true);

        // Notify all peers that screen sharing started
        for (const peerId of pcMapRef.current.keys()) {
          sendSignal({ type: 'screen_share_start', room: callRoomRef.current, is_group: callIsGroup }, peerId);
        }

        // Auto-stop when browser ends share (user hits "Stop sharing")
        screenTrack.onended = async () => {
          setIsScreenSharing(false);
          screenTrackRef.current = null;
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (camTrack) {
            await replaceVideoTrackOnAllPeers(camTrack, false);
          }
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
          // Notify all peers that screen sharing stopped
          for (const peerId of pcMapRef.current.keys()) {
            sendSignal({ type: 'screen_share_stop', room: callRoomRef.current, is_group: callIsGroup }, peerId);
          }
        };
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen share failed:', err);
        // Only alert if it's not a user cancellation
        if (err instanceof DOMException && err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          alert('Screen sharing failed: ' + (err as Error).message);
        }
      }
    }
  }

  function formatDuration(secs: number): string {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /* ── Render ────────────────────────────────────────────────────────── */

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>

      {/* ── Video call overlay ──────────────────────────────────────── */}
      {callState !== 'idle' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          background: '#0d1117', display: 'flex', flexDirection: 'column',
        }}>
          {/* Remote video / placeholder */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0d1117' }}>
            {/* Connected: show grid of remote streams */}
            {callState === 'connected' && remoteStreams.size > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: remoteStreams.size === 1 ? '1fr' : isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: isMobile ? 2 : 4, height: '100%',
              }}>
                {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
                  <RemoteVideoTile key={peerId} peerId={peerId} peerName={dms.find(d => d.id === peerId)?.name ?? peerId} stream={stream} isScreenShare={remoteScreenSharers.has(peerId)} />
                ))}
              </div>
            ) : (
              /* Placeholder: incoming / outgoing / waiting to connect */
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: (callIsGroup || incomingCall?.isGroup)
                    ? '#6366f1'
                    : (incomingCall ? getAvatarColor(callerName) : activeDM?.color ?? 'var(--color-primary)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700, color: '#fff',
                }}>
                  {(callIsGroup || incomingCall?.isGroup)
                    ? '#'
                    : (incomingCall ? getInitials(callerName) : activeDM?.initials ?? '?')}
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>
                  {incomingCall
                    ? (incomingCall.isGroup ? `#${incomingCall.room}` : callerName)
                    : (callIsGroup ? `#${callRoom ?? activeChannelId}` : activeDM?.name ?? activeName)}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                  {callState === 'incoming'
                    ? (incomingCall?.isGroup ? `${callerName} started a group call` : 'Incoming call…')
                    : callState === 'outgoing'
                    ? (callIsGroup ? 'Waiting for others to join…' : 'Calling…')
                    : 'Connecting…'}
                </div>
                {/* Pulsing ring(s) */}
                <div style={{ position: 'relative', width: 80, height: 80, marginTop: -96 }}>
                  <div style={{
                    position: 'absolute', inset: -16, borderRadius: '50%',
                    border: `2px solid ${callState === 'incoming' ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.15)'}`,
                    animation: 'pulse-ring 2s ease-out infinite',
                  }} />
                  {callState === 'incoming' && (
                    <>
                      <div style={{
                        position: 'absolute', inset: -16, borderRadius: '50%',
                        border: '2px solid rgba(34,197,94,0.4)',
                        animation: 'pulse-ring 2s ease-out infinite 0.6s',
                      }} />
                      <div style={{
                        position: 'absolute', inset: -16, borderRadius: '50%',
                        border: '2px solid rgba(34,197,94,0.3)',
                        animation: 'pulse-ring 2s ease-out infinite 1.2s',
                      }} />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Local video (picture-in-picture, bottom-right) */}
            <div style={{
              position: 'absolute', bottom: isMobile ? 12 : 20, right: isMobile ? 12 : 20,
              width: isMobile ? 100 : 160, height: isMobile ? 75 : 120, borderRadius: isMobile ? 8 : 10, overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              background: '#1a1d21',
            }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: isScreenSharing ? 'contain' : 'cover', transform: isScreenSharing ? 'none' : 'scaleX(-1)' }}
              />
              {isCameraOff && !isScreenSharing && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1d21', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  Camera off
                </div>
              )}
              {isScreenSharing && (
                <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(35,131,226,0.8)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>
                  Sharing
                </div>
              )}
            </div>

            {/* Top bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: isMobile ? '12px 14px' : '16px 20px', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
                {incomingCall
                  ? (incomingCall.isGroup ? `#${incomingCall.room}` : callerName)
                  : (callIsGroup ? `#${callRoom ?? activeChannelId}` : activeDM?.name ?? activeName)}
              </div>
                {callState === 'connected' && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{formatDuration(callDuration)}</div>
                )}
              </div>
              {isScreenSharing && (
                <div style={{ background: 'rgba(35,131,226,0.85)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ScreenShareIcon active />
                  Sharing screen
                </div>
              )}
            </div>
          </div>

          {/* Call controls */}
          {callState === 'incoming' ? (
            /* Incoming call accept/decline */
            <div style={{ padding: isMobile ? '20px 16px' : '24px', display: 'flex', justifyContent: 'center', gap: isMobile ? 48 : 32, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
              <button
                onClick={() => hangUp(true)}
                title="Decline"
                style={{ width: 56, height: 56, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
              >
                <PhoneOffIcon />
              </button>
              <button
                onClick={() => incomingCall?.isGroup ? joinGroupCall() : acceptDMCall()}
                title={incomingCall?.isGroup ? 'Join group call' : 'Accept call'}
                style={{ width: 56, height: 56, borderRadius: '50%', background: '#22c55e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
              >
                <PhoneIcon />
              </button>
            </div>
          ) : (
            /* In-call controls */
            <div style={{ padding: isMobile ? '16px 12px env(safe-area-inset-bottom, 8px)' : '20px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: isMobile ? 8 : 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
              {[
                { label: isMuted ? 'Unmute' : 'Mute', icon: <MicIcon off={isMuted} />, active: isMuted, onClick: toggleMute, danger: false },
                { label: isCameraOff ? 'Start video' : 'Stop video', icon: <VideoIcon off={isCameraOff} />, active: isCameraOff, onClick: toggleCamera, danger: false },
                { label: isScreenSharing ? 'Stop sharing' : 'Share screen', icon: <ScreenShareIcon active={isScreenSharing} />, active: isScreenSharing, onClick: toggleScreenShare, danger: false },
              ].map(({ label, icon, active, onClick }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={onClick}
                    title={label}
                    style={{
                      width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                      color: active ? '#0d1117' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}
                  >
                    {icon}
                  </button>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
              ))}

              <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => hangUp(true)}
                  title="End call"
                  style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <PhoneOffIcon />
                </button>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>End call</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Mobile sidebar backdrop ──────────────────────────────── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'absolute', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.5)' }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside style={{
        width: isMobile ? '80vw' : 240,
        maxWidth: 300,
        display: 'flex', flexDirection: 'column',
        background: '#1a1d21', borderRight: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0, overflow: 'hidden',
        ...(isMobile ? {
          position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.4)' : 'none',
        } : {}),
      }}>
        <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Agora</span>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: wsConnected ? '#2bac76' : 'rgba(255,255,255,0.25)' }} title={wsConnected ? 'Live' : 'Offline'} />
        </div>

        {/* Search bar */}
        <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"
              style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="6.5" cy="6.5" r="4.5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" />
            </svg>
            <input
              ref={searchRef}
              value={dmSearch}
              onChange={(e) => setDmSearch(e.target.value)}
              placeholder="Search people…"
              style={{
                width: '100%', padding: '6px 28px 6px 26px', background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
              onBlur={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
            {dmSearch && (
              <button
                onClick={() => setDmSearch('')}
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 2, display: 'flex', lineHeight: 1 }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {/* When searching, show only filtered people */}
          {dmSearch.trim() ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 16px 4px' }}>
                People {filteredDMs.length > 0 ? `· ${filteredDMs.length}` : ''}
              </div>
              {filteredDMs.length === 0 ? (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', padding: '6px 16px', fontStyle: 'italic' }}>No match found</div>
              ) : (
                filteredDMs.map((dm) => {
                  const isHovered = hoveredDMId === dm.id;
                  return (
                    <div
                      key={dm.id}
                      onMouseEnter={() => setHoveredDMId(dm.id)}
                      onMouseLeave={() => setHoveredDMId(null)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '5px 8px 5px 16px', background: isHovered ? 'rgba(255,255,255,0.08)' : 'transparent', borderRadius: 4, marginBottom: 1 }}
                    >
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 4, background: dm.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{dm.initials}</div>
                        <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: dm.online ? '#2bac76' : 'rgba(255,255,255,0.15)', border: '1.5px solid #1a1d21' }} />
                      </div>
                      <span
                        onClick={() => { setActiveDMId(dm.id); setDmSearch(''); if (isMobile) setSidebarOpen(false); }}
                        style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, color: 'rgba(255,255,255,0.75)', cursor: 'pointer' }}
                      >
                        {dm.name}
                      </span>
                      {/* Quick action buttons shown on hover */}
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0, opacity: isHovered ? 1 : 0, transition: 'opacity 0.1s' }}>
                        <button
                          onClick={() => { setActiveDMId(dm.id); setDmSearch(''); }}
                          title="Open chat"
                          style={{ padding: '3px 5px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}
                        >
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                            <path d="M2 3a1.5 1.5 0 011.5-1.5h6A1.5 1.5 0 0111 3v4a1.5 1.5 0 01-1.5 1.5H7L4.5 11V8.5H3.5A1.5 1.5 0 012 7V3z" />
                            <path d="M8 8.5h1.5A1.5 1.5 0 0111 10v2.5a1.5 1.5 0 01-1.5 1.5h-1L6 15.5V14H5A1.5 1.5 0 013.5 12.5" />
                          </svg>
                        </button>
                        <button
                          onClick={() => { setActiveDMId(dm.id); setDmSearch(''); setTimeout(startCall, 100); }}
                          title="Start video call"
                          style={{ padding: '3px 5px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}
                        >
                          <VideoIcon />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Channels</span>
                <button
                  onClick={() => setShowCreateChannel(true)}
                  title="Create channel"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
                    fontSize: 16, lineHeight: 1, padding: '0 4px', borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                >
                  +
                </button>
              </div>
              {channels.map((ch) => {
                const isActive = !activeDMId && activeChannelId === ch.id;
                return (
                  <button key={ch.id} onClick={() => { setActiveChannelId(ch.id); setActiveDMId(null); if (isMobile) setSidebarOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 12px 5px 16px', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: isActive ? '#fff' : ch.unread ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: ch.unread ? 700 : isActive ? 600 : 400, fontSize: 14, cursor: 'pointer', textAlign: 'left', borderRadius: 4, marginBottom: 1 }}>
                    <span style={{ opacity: 0.45 }}>#</span>
                    <span style={{ flex: 1 }}>{ch.name}</span>
                    {ch.unread ? <span style={{ background: '#e01e5a', color: '#fff', fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{ch.unread}</span> : null}
                  </button>
                );
              })}

              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '16px 16px 4px' }}>Direct Messages</div>
              {dms.length === 0 && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', padding: '6px 16px 4px', fontStyle: 'italic' }}>No other members yet</div>
              )}
              {dms.map((dm) => {
                const isActive = activeDMId === dm.id;
                const isHovered = hoveredDMId === dm.id;
                return (
                  <div
                    key={dm.id}
                    onMouseEnter={() => setHoveredDMId(dm.id)}
                    onMouseLeave={() => setHoveredDMId(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '5px 8px 5px 16px', background: isActive ? 'rgba(255,255,255,0.1)' : isHovered ? 'rgba(255,255,255,0.05)' : 'transparent', borderRadius: 4, marginBottom: 1 }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 4, background: dm.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{dm.initials}</div>
                      <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: dm.online ? '#2bac76' : 'rgba(255,255,255,0.15)', border: '1.5px solid #1a1d21' }} />
                    </div>
                    <span
                      onClick={() => { setActiveDMId(dm.id); if (isMobile) setSidebarOpen(false); }}
                      style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, color: isActive ? '#fff' : dm.unread ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: dm.unread ? 700 : isActive ? 600 : 400, cursor: 'pointer' }}
                    >
                      {dm.name}
                    </span>
                    {dm.unread && !isHovered ? (
                      <span style={{ background: '#e01e5a', color: '#fff', fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>{dm.unread}</span>
                    ) : (
                      <button
                        onClick={() => { setActiveDMId(dm.id); setTimeout(startCall, 100); }}
                        title="Start video call"
                        style={{ padding: '3px 5px', background: 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', flexShrink: 0, opacity: isHovered ? 1 : 0, transition: 'opacity 0.1s' }}
                      >
                        <VideoIcon />
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{USER_INITIALS}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{USER_ID}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Active</div>
          </div>
        </div>
      </aside>

      {/* ── Main chat area ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
        {/* Channel header */}
        <div style={{ padding: isMobile ? '0 12px' : '0 20px', height: 49, display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10, borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="20" height="20">
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </svg>
            </button>
          )}
          <span style={{ fontWeight: 700, fontSize: isMobile ? 15 : 16, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeDMId
              ? activeDM?.name
              : <><span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}># </span>{activeChannelId}</>}
          </span>
          <div style={{ flex: 1 }} />

          {/* Video call button — DM 1-on-1 */}
          {activeDMId && callState === 'idle' && (
            <button
              onClick={startCall}
              title={`Video call with ${activeDM?.name}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 6, border: '1px solid var(--color-border)',
                background: 'var(--color-bg)', cursor: 'pointer', fontSize: 13,
                fontWeight: 500, color: 'var(--color-text-2)', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-2)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'; }}
            >
              <VideoIcon />
              {!isMobile && <span>Video call</span>}
            </button>
          )}

          {/* Group call button — shown when in a channel */}
          {!activeDMId && callState === 'idle' && (
            <button
              onClick={startGroupCall}
              title={`Start group call in #${activeChannelId}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: isMobile ? '5px 8px' : '5px 12px', borderRadius: 6, border: '1px solid var(--color-border)',
                background: 'var(--color-bg)', cursor: 'pointer', fontSize: 13,
                fontWeight: 500, color: 'var(--color-text-2)', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6366f1'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-2)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'; }}
            >
              <VideoIcon />
              {!isMobile && <span>Start call</span>}
            </button>
          )}

          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </span>
        </div>

        {/* Messages list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px 10px' : '16px 20px', WebkitOverflowScrolling: 'touch' as never }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: 48 }}>{activeDMId ? '💬' : '#️⃣'}</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-text)' }}>
                {activeDMId ? `Start a conversation with ${activeName}` : `Welcome to #${activeChannelId}`}
              </div>
              <div style={{ fontSize: 14 }}>Send a message to get started.</div>
              {activeDMId && (
                <button
                  onClick={startCall}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500, marginTop: 8 }}
                >
                  <VideoIcon />
                  Start a video call
                </button>
              )}
            </div>
          ) : (
            messages.map((msg, idx) => {
              const prev = messages[idx - 1];
              const showDay = idx === 0 || !isSameDay(msg.timestamp, prev.timestamp);
              const isGrouped = !showDay && prev && prev.user_id === msg.user_id && msg.timestamp - prev.timestamp < 5 * 60 * 1000;
              const color = msg.user_id === USER_ID ? 'var(--color-primary)' : getAvatarColor(msg.user_id);
              const initials = msg.user_id === USER_ID ? USER_INITIALS : getInitials(msg.user_id);

              return (
                <div key={msg.id}>
                  {showDay && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 8px' }}>
                      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{formatDayHeader(msg.timestamp)}</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, paddingTop: isGrouped ? 2 : 10, alignItems: 'flex-start' }}>
                    {isGrouped ? (
                      <div style={{ width: 36, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: 4, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {!isGrouped && (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>{msg.user_id}</span>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatTime(msg.timestamp)}</span>
                        </div>
                      )}
                      <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.content}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="chat-input-area" style={{ padding: isMobile ? '6px 10px 10px' : '8px 20px 14px', flexShrink: 0 }}>
          <div style={{ border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeName}`}
              rows={1}
              style={{ display: 'block', width: '100%', padding: isMobile ? '10px 12px' : '10px 14px', border: 'none', resize: 'none', fontFamily: 'var(--font)', fontSize: isMobile ? 16 : 14, color: 'var(--color-text)', outline: 'none', background: 'var(--color-bg)', maxHeight: 160, overflowY: 'auto', lineHeight: 1.5, boxSizing: 'border-box' }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 6px', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[{ label: 'B', style: { fontWeight: 700 } }, { label: 'I', style: { fontStyle: 'italic' as const } }, { label: '📎', style: {} }, { label: '😊', style: {} }].map(({ label, style }) => (
                  <button key={label} style={{ padding: '4px 7px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--color-text-3)', borderRadius: 4, ...style }}>{label}</button>
                ))}
                {activeDMId && (
                  <button
                    onClick={startCall}
                    title="Video call"
                    style={{ padding: '4px 7px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--color-text-3)', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                  >
                    <VideoIcon />
                  </button>
                )}
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                style={{ padding: '5px 14px', background: input.trim() ? 'var(--color-primary)' : 'var(--color-bg-3)', color: input.trim() ? '#fff' : 'var(--color-text-muted)', border: 'none', borderRadius: 4, cursor: input.trim() ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 600, transition: 'background 0.15s' }}
              >
                Send
              </button>
            </div>
          </div>
          <div className="chat-input-hint" style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, paddingLeft: 2 }}>
            Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>

      {/* ── Create Channel Modal ──────────────────────────────────── */}
      {showCreateChannel && (
        <div
          onClick={() => setShowCreateChannel(false)}
          style={{
            position: 'absolute', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e1e2e', borderRadius: 12, padding: 28,
              width: 420, maxWidth: '90vw',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#fff' }}>Create a channel</h3>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
              Channel name
            </label>
            <input
              autoFocus
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
              placeholder="e.g. project-alpha"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newChannelName.trim()) {
                  fetch('/api/v1/chat/channels', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newChannelName.trim(), is_private: newChannelPrivate, created_by: USER_UUID }),
                  })
                    .then(() => { loadChannels(); setShowCreateChannel(false); setNewChannelName(''); setNewChannelPrivate(false); setActiveChannelId(newChannelName.trim()); setActiveDMId(null); })
                    .catch(() => alert('Failed to create channel'));
                }
              }}
              style={{
                width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
              <input
                type="checkbox"
                checked={newChannelPrivate}
                onChange={(e) => setNewChannelPrivate(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#6366f1', cursor: 'pointer' }}
              />
              Make private
            </label>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowCreateChannel(false); setNewChannelName(''); setNewChannelPrivate(false); }}
                style={{
                  padding: '8px 18px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
                  border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newChannelName.trim()) return;
                  fetch('/api/v1/chat/channels', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newChannelName.trim(), is_private: newChannelPrivate, created_by: USER_UUID }),
                  })
                    .then(() => { loadChannels(); setShowCreateChannel(false); setNewChannelName(''); setNewChannelPrivate(false); setActiveChannelId(newChannelName.trim()); setActiveDMId(null); })
                    .catch(() => alert('Failed to create channel'));
                }}
                disabled={!newChannelName.trim()}
                style={{
                  padding: '8px 18px',
                  background: newChannelName.trim() ? '#6366f1' : 'rgba(255,255,255,0.1)',
                  color: newChannelName.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                  border: 'none', borderRadius: 6,
                  cursor: newChannelName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pulse animation keyframe + mobile styles */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .chat-input-area { padding-bottom: max(10px, env(safe-area-inset-bottom)) !important; }
        }
        @media (max-width: 767px) {
          .chat-input-hint { display: none !important; }
        }
      `}</style>
    </div>
  );
}
