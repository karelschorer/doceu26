import { useState, useEffect, useRef, useCallback } from 'react';
import type { CallState, DM } from '../types';
import { ICE_SERVERS } from '../constants';

/* ── Internal helpers ────────────────────────────────────────────────── */

interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  org_id?: string;
}

interface IncomingCall {
  from: string;
  room: string;
  isGroup: boolean;
}

interface SignalMessage {
  type: string;
  user_id: string;
  to?: string | null;
  room?: string | null;
  is_group?: boolean;
  payload?: unknown;
  id: string;
  timestamp: number;
}

function wsUrl(channel: string, user: string, uuid: string): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws?channel=${encodeURIComponent(channel)}&user=${encodeURIComponent(user)}&uuid=${encodeURIComponent(uuid)}`;
}

/* ── Hook ────────────────────────────────────────────────────────────── */

export function useWebRTC(
  user: AuthUser | null,
  dms: DM[],
  activeChannelId: string,
  activeDMId: string | null,
  setActiveDMId: (id: string | null) => void,
  setActiveChannelId: (id: string) => void,
) {
  const USER_ID = user?.display_name ?? '';
  const USER_UUID = user?.id ?? '';

  /* ── Call state ────────────────────────────────────────────────────── */
  const [callState, setCallState] = useState<CallState>('idle');
  const [callRoom, setCallRoom] = useState<string | null>(null);
  const [callIsGroup, setCallIsGroup] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [callParticipants, setCallParticipants] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenSharers, setRemoteScreenSharers] = useState<Set<string>>(new Set());
  const [callDuration, setCallDuration] = useState(0);

  /* ── Refs ──────────────────────────────────────────────────────────── */
  const signalWsRef = useRef<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const pcMapRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callTargetRef = useRef<string | null>(null);
  const callRoomRef = useRef<string | null>(null);

  // Mirror state into refs so signaling WS closure always sees latest values
  const callStateRef = useRef<CallState>('idle');
  const callIsGroupRef = useRef(false);
  const dmsRef = useRef<DM[]>(dms);

  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { callIsGroupRef.current = callIsGroup; }, [callIsGroup]);
  useEffect(() => { dmsRef.current = dms; }, [dms]);

  /* ── Derived ───────────────────────────────────────────────────────── */
  const callerName = incomingCall
    ? (dms.find((d) => d.id === incomingCall.from)?.name ?? incomingCall.from)
    : '';

  /* ── sendSignal ────────────────────────────────────────────────────── */

  const sendSignal = useCallback(
    (payload: object, to?: string) => {
      const target = to ?? callTargetRef.current;
      if (signalWsRef.current?.readyState === WebSocket.OPEN) {
        signalWsRef.current.send(
          JSON.stringify({
            ...payload,
            user_id: USER_UUID,
            to: target,
            id: `sig-${Date.now()}`,
            timestamp: Date.now(),
          }),
        );
      }
    },
    [USER_UUID],
  );

  /* ── createPCForPeer ───────────────────────────────────────────────── */

  const createPCForPeer = useCallback(
    (peerId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignal({ type: 'ice_candidate', payload: e.candidate, room: callRoomRef.current }, peerId);
        }
      };

      pc.ontrack = (e) => {
        setRemoteStreams((prev) => new Map(prev).set(peerId, e.streams[0]));
        setCallParticipants((prev) => (prev.includes(peerId) ? prev : [...prev, peerId]));
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
          setRemoteStreams((prev) => {
            const m = new Map(prev);
            m.delete(peerId);
            return m;
          });
          setCallParticipants((prev) => prev.filter((p) => p !== peerId));
          if (pcMapRef.current.size === 0 && callStateRef.current !== 'idle') {
            hangUp(false);
          }
        }
      };

      pcMapRef.current.set(peerId, pc);
      return pc;
    },
    // hangUp and sendSignal are stable callbacks defined below/above
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sendSignal],
  );

  /* ── acquireMedia ──────────────────────────────────────────────────── */

  const acquireMedia = useCallback(async (): Promise<MediaStream | null> => {
    // Check if mediaDevices API is available (requires HTTPS or localhost)
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
  }, []);

  /* ── replaceVideoTrackOnAllPeers ───────────────────────────────────── */

  const replaceVideoTrackOnAllPeers = useCallback(
    async (newTrack: MediaStreamTrack, isScreen: boolean) => {
      for (const [peerId, pc] of pcMapRef.current) {
        // Find the existing video sender
        const sender =
          pc.getSenders().find((s) => s.track?.kind === 'video') ??
          pc.getSenders().find((s) => s.track === null);

        if (sender) {
          try {
            await sender.replaceTrack(newTrack);
            // Boost quality for screen content
            if (isScreen) {
              try {
                const params = sender.getParameters();
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
              sendSignal(
                { type: 'call_offer', payload: offer, room: callRoomRef.current, is_group: callIsGroupRef.current },
                peerId,
              );
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
            sendSignal(
              { type: 'call_offer', payload: offer, room: callRoomRef.current, is_group: callIsGroupRef.current },
              peerId,
            );
          } catch (err) {
            console.error(`Renegotiation failed for peer ${peerId}:`, err);
          }
        }
      }
    },
    [sendSignal],
  );

  /* ── hangUp ────────────────────────────────────────────────────────── */

  const hangUp = useCallback(
    (sendSignalToRemote = true) => {
      if (sendSignalToRemote) {
        if (callIsGroupRef.current) {
          sendSignal({ type: 'call_leave', room: callRoomRef.current ?? undefined }); // broadcast
        } else {
          sendSignal({ type: 'call_end' }); // 1-on-1 end
        }
      }
      callTargetRef.current = null;
      callRoomRef.current = null;
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      pcMapRef.current.forEach((pc) => pc.close());
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
    },
    [sendSignal],
  );

  /* ── startCall (DM 1-on-1) ─────────────────────────────────────────── */

  const startCall = useCallback(async () => {
    if (!activeDMId) {
      alert('Please select a user to call.');
      return;
    }
    const targetUUID = activeDMId;
    callTargetRef.current = targetUUID;
    callRoomRef.current = activeDMId;
    setCallRoom(activeDMId);
    setCallIsGroup(false);

    const stream = await acquireMedia();
    if (!stream) {
      alert(
        'Could not access camera or microphone.\n\nPlease check:\n' +
          '\u2022 Camera/mic permissions in your browser\n' +
          '\u2022 That no other app is using the camera\n' +
          '\u2022 That your device has a camera/microphone',
      );
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
      stream.getTracks().forEach((t) => t.stop());
      alert('Failed to set up the call connection. Please try again.');
      setCallState('idle');
    }
  }, [activeDMId, acquireMedia, createPCForPeer, sendSignal]);

  /* ── startGroupCall ────────────────────────────────────────────────── */

  const startGroupCall = useCallback(async () => {
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
    sendSignal({ type: 'call_start', room }); // broadcast — no `to`
    setCallState('outgoing'); // waiting for others to join
  }, [activeChannelId, USER_UUID, acquireMedia, sendSignal]);

  /* ── acceptDMCall ──────────────────────────────────────────────────── */

  const acceptDMCall = useCallback(async () => {
    const ic = incomingCall;
    if (!ic) return;
    callTargetRef.current = ic.from; // ic.from is now UUID
    callRoomRef.current = ic.from;
    setCallRoom(ic.from);
    setCallIsGroup(false);
    // Navigate to the DM with the caller (look up by UUID)
    const callerDM = dmsRef.current.find((d) => d.id === ic.from);
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
  }, [incomingCall, acquireMedia, sendSignal, setActiveDMId]);

  /* ── joinGroupCall ─────────────────────────────────────────────────── */

  const joinGroupCall = useCallback(async () => {
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
    // Announce we joined — existing participants will send us offers
    sendSignal({ type: 'call_join', room: ic.room });
    setCallState('outgoing'); // outgoing = "waiting for participants to connect"
    // Transition to connected once we get our first track (handled in createPCForPeer)
  }, [incomingCall, USER_UUID, acquireMedia, sendSignal, setActiveDMId, setActiveChannelId]);

  /* ── toggleMute ────────────────────────────────────────────────────── */

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      setIsMuted((m) => !m);
      return;
    }
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((m) => !m);
  }, []);

  /* ── toggleCamera ──────────────────────────────────────────────────── */

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      setIsCameraOff((c) => !c);
      return;
    }
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCameraOff((c) => !c);
  }, []);

  /* ── toggleScreenShare ─────────────────────────────────────────────── */

  const toggleScreenShare = useCallback(async () => {
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
        sendSignal(
          { type: 'screen_share_stop', room: callRoomRef.current, is_group: callIsGroupRef.current },
          peerId,
        );
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
          const combined = new MediaStream([
            screenTrack,
            ...(localStreamRef.current?.getAudioTracks() ?? []),
          ]);
          localVideoRef.current.srcObject = combined;
        }

        // Replace video track in all peer connections with proper await
        await replaceVideoTrackOnAllPeers(screenTrack, true);

        // Notify all peers that screen sharing started
        for (const peerId of pcMapRef.current.keys()) {
          sendSignal(
            { type: 'screen_share_start', room: callRoomRef.current, is_group: callIsGroupRef.current },
            peerId,
          );
        }

        // Auto-stop when browser ends share (user hits "Stop sharing")
        screenTrack.onended = async () => {
          setIsScreenSharing(false);
          screenTrackRef.current = null;
          const camTrack2 = localStreamRef.current?.getVideoTracks()[0];
          if (camTrack2) {
            await replaceVideoTrackOnAllPeers(camTrack2, false);
          }
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
          // Notify all peers that screen sharing stopped
          for (const peerId of pcMapRef.current.keys()) {
            sendSignal(
              { type: 'screen_share_stop', room: callRoomRef.current, is_group: callIsGroupRef.current },
              peerId,
            );
          }
        };
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen share failed:', err);
        // Only alert if it's not a user cancellation
        if (
          err instanceof DOMException &&
          err.name !== 'AbortError' &&
          err.name !== 'NotAllowedError'
        ) {
          alert('Screen sharing failed: ' + (err as Error).message);
        }
      }
    }
  }, [isScreenSharing, replaceVideoTrackOnAllPeers, sendSignal]);

  /* ── Persistent signaling WS (always open, handles call signals) ──── */

  useEffect(() => {
    if (!USER_ID || !USER_UUID) return;
    const ws = new WebSocket(wsUrl(`signal_${USER_UUID}`, USER_ID, USER_UUID));
    signalWsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as SignalMessage;
        if (msg.user_id === USER_UUID) return; // ignore own echo
        if (msg.to && msg.to !== USER_UUID) return; // targeted but not for us

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
          if (
            callRoomRef.current === room &&
            localStreamRef.current &&
            !pcMapRef.current.has(from)
          ) {
            (async () => {
              const pc = createPCForPeer(from);
              localStreamRef.current!.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
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
          setRemoteStreams((prev) => {
            const m = new Map(prev);
            m.delete(from);
            return m;
          });
          setCallParticipants((prev) => prev.filter((p) => p !== from));
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
                  sendSignal(
                    { type: 'call_answer', payload: answer, room: msg.room, is_group: true },
                    from,
                  );
                  console.log('Handled group renegotiation offer from', from);
                } catch (err) {
                  console.error('Group renegotiation answer failed:', err);
                }
              })();
            } else if (localStreamRef.current) {
              // New participant joining: auto-accept offer
              (async () => {
                const pc = createPCForPeer(from);
                localStreamRef.current!.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
                await pc.setRemoteDescription(msg.payload as RTCSessionDescriptionInit);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendSignal(
                  { type: 'call_answer', payload: answer, room: msg.room, is_group: true },
                  from,
                );
              })();
            }
            return;
          }
          // DM 1-on-1 call
          // If we already have an active peer connection with this peer,
          // this is a renegotiation (e.g. screen sharing added a track),
          // NOT a new incoming call.
          const existingPC = pcMapRef.current.get(from);
          if (existingPC && callStateRef.current !== 'idle') {
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
          setRemoteScreenSharers((prev) => new Set(prev).add(from));
          return;
        }
        if (msg.type === 'screen_share_stop') {
          setRemoteScreenSharers((prev) => {
            const s = new Set(prev);
            s.delete(from);
            return s;
          });
          return;
        }

        // ── DM 1-on-1 end ──────────────────────────────────────────────
        if (msg.type === 'call_end') {
          hangUp(false);
          return;
        }
      } catch {
        /* ignore */
      }
    };

    return () => {
      ws.close();
      signalWsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [USER_ID, USER_UUID]);

  /* ── Cleanup on unmount ────────────────────────────────────────────── */

  useEffect(() => {
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      pcMapRef.current.forEach((pc) => pc.close());
      pcMapRef.current.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      screenTrackRef.current = null;
    };
  }, []);

  return {
    // State
    callState,
    callRoom,
    callIsGroup,
    incomingCall,
    remoteStreams,
    callParticipants,
    isMuted,
    isCameraOff,
    isScreenSharing,
    remoteScreenSharers,
    callDuration,
    callerName,

    // Refs (needed by UI for video element)
    localVideoRef,

    // Actions
    startCall,
    startGroupCall,
    acceptDMCall,
    joinGroupCall,
    hangUp,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
  };
}
