import type { DM } from '../../types';
import { RemoteVideoTile } from './RemoteVideoTile';

interface VideoGridProps {
  remoteStreams: Map<string, MediaStream>;
  remoteScreenSharers: Set<string>;
  dms: DM[];
}

function getDisplayName(peerId: string, dms: DM[]): string {
  const dm = dms.find((d) => d.id === peerId);
  return dm?.name ?? peerId.slice(0, 8);
}

function getGridStyle(count: number): React.CSSProperties {
  if (count <= 1) {
    return { display: 'grid', gridTemplateColumns: '1fr', gridTemplateRows: '1fr', height: '100%' };
  }
  if (count === 2) {
    return { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr', height: '100%' };
  }
  if (count <= 4) {
    return { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', height: '100%' };
  }
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gridAutoRows: '1fr',
    height: '100%',
  };
}

export function VideoGrid({ remoteStreams, remoteScreenSharers, dms }: VideoGridProps) {
  const entries = Array.from(remoteStreams.entries());

  if (entries.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>
          Waiting for others to join...
        </p>
      </div>
    );
  }

  return (
    <div style={{ ...getGridStyle(entries.length), gap: 4 }}>
      {entries.map(([peerId, stream]) => (
        <RemoteVideoTile
          key={peerId}
          peerId={peerId}
          stream={stream}
          isScreenShare={remoteScreenSharers.has(peerId)}
          displayName={getDisplayName(peerId, dms)}
        />
      ))}
    </div>
  );
}
