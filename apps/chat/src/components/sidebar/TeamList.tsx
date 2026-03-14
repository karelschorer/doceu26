import { useState } from 'react';
import type { Team } from '../../types';
import { HashIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon, UsersIcon } from '../icons';

interface TeamListProps {
  teams: Team[];
  activeTeamId: string | null;
  activeChannelId: string;
  activeDMId: string | null;
  activeGroupId: string | null;
  onSelectChannel: (teamId: string, channelId: string) => void;
  onCreateTeamClick: () => void;
  onAddChannelClick: (teamId: string) => void;
}

export function TeamList({
  teams,
  activeTeamId,
  activeChannelId,
  activeDMId,
  activeGroupId,
  onSelectChannel,
  onCreateTeamClick,
  onAddChannelClick,
}: TeamListProps) {
  const [headerHovered, setHeaderHovered] = useState(false);
  const [addHovered, setAddHovered] = useState(false);

  const isNonTeamActive = !!activeDMId || !!activeGroupId;

  return (
    <div style={{ padding: '4px 8px' }}>
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 4px',
        }}
      >
        <span
          onMouseEnter={() => setHeaderHovered(true)}
          onMouseLeave={() => setHeaderHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: headerHovered ? 'var(--color-text-2)' : 'var(--color-text-3)',
            cursor: 'default',
          }}
        >
          Teams
        </span>
        <button
          onClick={onCreateTeamClick}
          onMouseEnter={() => setAddHovered(true)}
          onMouseLeave={() => setAddHovered(false)}
          style={{
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            color: addHovered ? 'var(--color-text-2)' : 'var(--color-text-3)',
            backgroundColor: addHovered ? 'var(--color-nav-hover)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.15s, background-color 0.15s',
          }}
          title="Create team"
        >
          <PlusIcon size={12} />
        </button>
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {teams.map((team) => (
          <TeamItem
            key={team.id}
            team={team}
            isActiveTeam={team.id === activeTeamId && !isNonTeamActive}
            activeChannelId={isNonTeamActive ? '' : activeChannelId}
            onSelectChannel={(channelId) => onSelectChannel(team.id, channelId)}
            onAddChannel={() => onAddChannelClick(team.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Single Team Item (collapsible) ────────────────────────────────── */

function TeamItem({
  team,
  isActiveTeam,
  activeChannelId,
  onSelectChannel,
  onAddChannel,
}: {
  team: Team;
  isActiveTeam: boolean;
  activeChannelId: string;
  onSelectChannel: (channelId: string) => void;
  onAddChannel: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [addHovered, setAddHovered] = useState(false);

  return (
    <div>
      {/* Team header row */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '5px 8px',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          backgroundColor: hovered ? 'var(--color-nav-hover)' : 'transparent',
          transition: 'background-color 0.15s',
        }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 16,
            height: 16,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-3)',
            padding: 0,
            flexShrink: 0,
          }}
        >
          {collapsed ? <ChevronRightIcon size={12} /> : <ChevronDownIcon size={12} />}
        </button>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 'var(--radius-sm)',
            background: isActiveTeam ? 'var(--color-primary)' : 'var(--color-bg-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <UsersIcon
            size={12}
            style={{ color: isActiveTeam ? '#fff' : 'var(--color-text-3)' }}
          />
        </div>
        <span
          onClick={() => {
            if (team.channels.length > 0) {
              onSelectChannel(team.channels[0].id);
            }
          }}
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            color: isActiveTeam ? 'var(--color-text)' : 'var(--color-text-2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {team.name}
        </span>
        {hovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChannel();
            }}
            onMouseEnter={() => setAddHovered(true)}
            onMouseLeave={() => setAddHovered(false)}
            style={{
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              color: addHovered ? 'var(--color-text-2)' : 'var(--color-text-3)',
              backgroundColor: addHovered ? 'var(--color-bg-3)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
            title="Add channel"
          >
            <PlusIcon size={10} />
          </button>
        )}
      </div>

      {/* Channel list (indented) */}
      {!collapsed && (
        <div style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {team.channels.map((ch) => (
            <TeamChannelItem
              key={ch.id}
              name={ch.name}
              isActive={ch.id === activeChannelId && isActiveTeam}
              onClick={() => onSelectChannel(ch.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Channel item within a team ────────────────────────────────────── */

function TeamChannelItem({
  name,
  isActive,
  onClick,
}: {
  name: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        textAlign: 'left',
        fontSize: 13,
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        borderLeft: `2px solid ${isActive ? 'var(--color-nav-active-border)' : 'transparent'}`,
        backgroundColor: isActive
          ? 'var(--color-nav-active-bg)'
          : hovered
            ? 'var(--color-nav-hover)'
            : 'transparent',
        color: isActive ? 'var(--color-nav-text-active)' : 'var(--color-text-2)',
        cursor: 'pointer',
        transition: 'color 0.15s, background-color 0.15s',
        fontFamily: 'inherit',
      }}
    >
      <HashIcon
        size={12}
        style={{ color: isActive ? 'var(--color-nav-text-active)' : 'var(--color-text-3)' }}
      />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
    </button>
  );
}
