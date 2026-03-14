import { MicIcon, VideoIcon, ScreenShareIcon, PhoneOffIcon } from '../icons';

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onHangUp: () => void;
  isMobile: boolean;
}

export function CallControls({
  isMuted,
  isCameraOff,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onHangUp,
  isMobile,
}: CallControlsProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderRadius: 9999,
          padding: '10px 20px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <ControlButton
          active={!isMuted}
          onClick={onToggleMute}
          label={isMuted ? 'Unmute' : 'Mute'}
          isMobile={isMobile}
        >
          <MicIcon off={isMuted} size={20} />
        </ControlButton>

        <ControlButton
          active={!isCameraOff}
          onClick={onToggleCamera}
          label={isCameraOff ? 'Start video' : 'Stop video'}
          isMobile={isMobile}
        >
          <VideoIcon off={isCameraOff} size={20} />
        </ControlButton>

        <ControlButton
          active={isScreenSharing}
          onClick={onToggleScreenShare}
          label={isScreenSharing ? 'Stop share' : 'Share screen'}
          isMobile={isMobile}
        >
          <ScreenShareIcon active={isScreenSharing} size={20} />
        </ControlButton>

        {/* Separator */}
        <div
          style={{
            margin: '0 4px',
            height: 32,
            width: 1,
            background: 'rgba(255, 255, 255, 0.15)',
          }}
        />

        {/* End call */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button
            onClick={onHangUp}
            style={{
              display: 'flex',
              height: 48,
              width: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 9999,
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              background: '#ef4444',
            }}
            title="End call"
          >
            <PhoneOffIcon size={20} />
          </button>
          {!isMobile && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>End</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  label,
  isMobile,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  isMobile: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button
        onClick={onClick}
        title={label}
        style={{
          display: 'flex',
          height: 48,
          width: 48,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 9999,
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.15s, color 0.15s',
          background: active ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.15)',
          color: active ? '#1a1d21' : '#fff',
        }}
      >
        {children}
      </button>
      {!isMobile && (
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      )}
    </div>
  );
}
