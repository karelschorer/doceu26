import { useEffect, useRef } from 'react';
import { ScreenShareIcon } from '../icons';

interface RemoteVideoTileProps {
  peerId: string;
  stream: MediaStream;
  isScreenShare: boolean;
  displayName: string;
}

export function RemoteVideoTile({ stream, isScreenShare, displayName }: RemoteVideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el && stream) {
      el.srcObject = stream;
    }
    return () => {
      if (el) el.srcObject = null;
    };
  }, [stream]);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
        background: '#1a1d21',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          height: '100%',
          width: '100%',
          objectFit: isScreenShare ? 'contain' : 'cover',
        }}
      />

      {/* Name label */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          borderRadius: 9999,
          padding: '4px 10px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'rgba(0, 0, 0, 0.6)',
        }}
      >
        {isScreenShare && (
          <ScreenShareIcon size={13} style={{ color: '#60a5fa' }} />
        )}
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: '#fff',
          }}
        >
          {displayName}
        </span>
      </div>
    </div>
  );
}
