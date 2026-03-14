import { PhoneIcon, PhoneOffIcon } from '../icons';
import { getAvatarColor, getInitials } from '../../utils';

interface IncomingCallBannerProps {
  callerName: string;
  isGroup: boolean;
  roomName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallBanner({
  callerName,
  isGroup,
  roomName,
  onAccept,
  onDecline,
}: IncomingCallBannerProps) {
  const initials = getInitials(callerName);
  const color = getAvatarColor(callerName);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
      {/* Avatar with pulsing rings */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            height: 128,
            width: 128,
            borderRadius: 9999,
            border: `2px solid ${color}`,
            animation: 'incoming-call-pulse 1.8s ease-out infinite',
            animationDelay: '0s',
          }}
        />
        <div
          style={{
            position: 'absolute',
            height: 128,
            width: 128,
            borderRadius: 9999,
            border: `2px solid ${color}`,
            animation: 'incoming-call-pulse 1.8s ease-out infinite',
            animationDelay: '0.6s',
          }}
        />
        <div
          style={{
            position: 'absolute',
            height: 128,
            width: 128,
            borderRadius: 9999,
            border: `2px solid ${color}`,
            animation: 'incoming-call-pulse 1.8s ease-out infinite',
            animationDelay: '1.2s',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            height: 96,
            width: 96,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 9999,
            fontSize: 24,
            fontWeight: 600,
            color: '#fff',
            background: color,
          }}
        >
          {initials}
        </div>
      </div>

      {/* Caller info */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#fff' }}>
          {callerName}
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
          {isGroup ? `Group call in #${roomName}` : 'Incoming call...'}
        </p>
      </div>

      {/* Accept / Decline buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onDecline}
            style={{
              display: 'flex',
              height: 56,
              width: 56,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 9999,
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              background: '#ef4444',
              transition: 'transform 0.15s',
            }}
            title="Decline"
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <PhoneOffIcon size={24} />
          </button>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Decline</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onAccept}
            style={{
              display: 'flex',
              height: 56,
              width: 56,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 9999,
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              background: '#22c55e',
              transition: 'transform 0.15s',
            }}
            title="Accept"
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <PhoneIcon size={24} />
          </button>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Accept</span>
        </div>
      </div>

      {/* Pulsing ring animation */}
      <style>{`
        @keyframes incoming-call-pulse {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
