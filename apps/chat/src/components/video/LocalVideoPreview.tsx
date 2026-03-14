interface LocalVideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isMobile: boolean;
}

export function LocalVideoPreview({
  videoRef,
  isCameraOff,
  isScreenSharing,
  isMobile,
}: LocalVideoPreviewProps) {
  const w = isMobile ? 120 : 180;
  const h = isMobile ? 90 : 135;

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 10,
        overflow: 'hidden',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        width: w,
        height: h,
        bottom: isMobile ? 100 : 120,
        right: isMobile ? 12 : 20,
        background: '#1a1d21',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          height: '100%',
          width: '100%',
          objectFit: 'cover',
          transform: isScreenSharing ? 'none' : 'scaleX(-1)',
          display: isCameraOff ? 'none' : 'block',
        }}
      />

      {isCameraOff && (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            Camera off
          </span>
        </div>
      )}

      {isScreenSharing && !isCameraOff && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            borderRadius: 9999,
            padding: '2px 6px',
            fontSize: 10,
            fontWeight: 500,
            color: '#fff',
            background: '#6366f1',
          }}
        >
          Sharing
        </div>
      )}
    </div>
  );
}
