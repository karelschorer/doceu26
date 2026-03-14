import type { CallState, DM } from '../../types';
import { formatDuration } from '../../utils';
import { VideoGrid } from './VideoGrid';
import { LocalVideoPreview } from './LocalVideoPreview';
import { CallControls } from './CallControls';
import { IncomingCallBanner } from './IncomingCallBanner';

interface VideoCallOverlayProps {
  callState: CallState;
  callRoom: string | null;
  callIsGroup: boolean;
  callerName: string;
  remoteStreams: Map<string, MediaStream>;
  callParticipants: string[];
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  remoteScreenSharers: Set<string>;
  callDuration: number;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  dms: DM[];
  onHangUp: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onAcceptDMCall: () => void;
  onJoinGroupCall: () => void;
  onDecline: () => void;
  isMobile: boolean;
}

export function VideoCallOverlay({
  callState,
  callRoom,
  callIsGroup,
  callerName,
  remoteStreams,
  isMuted,
  isCameraOff,
  isScreenSharing,
  remoteScreenSharers,
  callDuration,
  localVideoRef,
  dms,
  onHangUp,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onAcceptDMCall,
  onJoinGroupCall,
  onDecline,
  isMobile,
}: VideoCallOverlayProps) {
  if (callState === 'idle') return null;

  if (callState === 'incoming') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1117',
        }}
      >
        <IncomingCallBanner
          callerName={callerName}
          isGroup={callIsGroup}
          roomName={callRoom ?? ''}
          onAccept={callIsGroup ? onJoinGroupCall : onAcceptDMCall}
          onDecline={onDecline}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        background: '#0d1117',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#fff',
            }}
          >
            {callerName}
          </span>
          {callState === 'connected' && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              {formatDuration(callDuration)}
            </span>
          )}
        </div>
        {callState === 'outgoing' && (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            Calling...
          </span>
        )}
      </div>

      {/* Video grid */}
      <div style={{ flex: 1, minHeight: 0, padding: '0 8px 8px' }}>
        <VideoGrid
          remoteStreams={remoteStreams}
          remoteScreenSharers={remoteScreenSharers}
          dms={dms}
        />
      </div>

      {/* Local PiP */}
      <LocalVideoPreview
        videoRef={localVideoRef}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        isMobile={isMobile}
      />

      {/* Controls */}
      <div style={{ paddingBottom: 24, paddingTop: 8 }}>
        <CallControls
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isScreenSharing={isScreenSharing}
          onToggleMute={onToggleMute}
          onToggleCamera={onToggleCamera}
          onToggleScreenShare={onToggleScreenShare}
          onHangUp={onHangUp}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}
