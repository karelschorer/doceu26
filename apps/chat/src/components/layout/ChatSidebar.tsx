import type { DM, Group, Team } from '../../types';
import { SidebarHeader } from '../sidebar/SidebarHeader';
import { SidebarSearch } from '../sidebar/SidebarSearch';
import { TeamList } from '../sidebar/TeamList';
import { DMList } from '../sidebar/DMList';
import { GroupList } from '../sidebar/GroupList';
import { SidebarFooter } from '../sidebar/SidebarFooter';
import { CreateTeamDialog } from '../sidebar/CreateTeamDialog';
import { CreateGroupDialog } from '../sidebar/CreateGroupDialog';
import { AddChannelDialog } from '../sidebar/AddChannelDialog';

interface ChatSidebarProps {
  // Teams
  teams: Team[];
  activeTeamId: string | null;
  activeChannelId: string;
  activeDMId: string | null;
  activeGroupId: string | null;
  dms: DM[];
  filteredDMs: DM[];
  groups: Group[];
  dmSearch: string;
  hoveredDMId: string | null;
  sidebarOpen: boolean;
  showCreateTeam: boolean;
  showCreateGroup: boolean;
  showAddChannel: string | null;
  newChannelName: string;
  // Callbacks
  onSelectTeamChannel: (teamId: string, channelId: string) => void;
  onSelectDM: (id: string) => void;
  onSelectGroup: (id: string) => void;
  onDMSearchChange: (v: string) => void;
  onDMHover: (id: string | null) => void;
  onCallDM: (id: string) => void;
  onCloseSidebar: () => void;
  onShowCreateTeam: (show: boolean) => void;
  onShowCreateGroup: (show: boolean) => void;
  onShowAddChannel: (teamId: string | null) => void;
  onChannelNameChange: (v: string) => void;
  onCreateTeam: (name: string, memberIds: string[]) => void;
  onCreateGroup: (memberIds: string[]) => void;
  onAddChannel: (teamId: string, channelName: string) => void;
  // Connection
  wsConnected: boolean;
  // User
  userName: string;
  userEmail: string;
  // Responsive
  isMobile: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  teams,
  activeTeamId,
  activeChannelId,
  activeDMId,
  activeGroupId,
  dms,
  filteredDMs,
  groups,
  dmSearch,
  hoveredDMId,
  sidebarOpen,
  showCreateTeam,
  showCreateGroup,
  showAddChannel,
  newChannelName,
  onSelectTeamChannel,
  onSelectDM,
  onSelectGroup,
  onDMSearchChange,
  onDMHover,
  onCallDM,
  onCloseSidebar,
  onShowCreateTeam,
  onShowCreateGroup,
  onShowAddChannel,
  onChannelNameChange,
  onCreateTeam,
  onCreateGroup,
  onAddChannel,
  wsConnected,
  userName,
  userEmail,
  isMobile,
}) => {
  const sidebarContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: 260,
        backgroundColor: 'var(--color-bg-2)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      <SidebarHeader wsConnected={wsConnected} />
      <SidebarSearch value={dmSearch} onChange={onDMSearchChange} />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <TeamList
          teams={teams}
          activeTeamId={activeTeamId}
          activeChannelId={activeChannelId}
          activeDMId={activeDMId}
          activeGroupId={activeGroupId}
          onSelectChannel={onSelectTeamChannel}
          onCreateTeamClick={() => onShowCreateTeam(true)}
          onAddChannelClick={(teamId) => onShowAddChannel(teamId)}
        />
        <DMList
          dms={filteredDMs}
          activeDMId={activeDMId}
          hoveredDMId={hoveredDMId}
          onSelect={onSelectDM}
          onHover={onDMHover}
          onCallClick={onCallDM}
        />
        <GroupList
          groups={groups}
          activeGroupId={activeGroupId}
          onSelect={onSelectGroup}
          onCreateClick={() => onShowCreateGroup(true)}
        />
      </div>

      <SidebarFooter userName={userName} userEmail={userEmail} />

      {/* Dialogs */}
      <CreateTeamDialog
        open={showCreateTeam}
        dms={dms}
        onCancel={() => onShowCreateTeam(false)}
        onCreate={onCreateTeam}
      />
      <CreateGroupDialog
        open={showCreateGroup}
        dms={dms}
        onCancel={() => onShowCreateGroup(false)}
        onCreate={onCreateGroup}
      />
      <AddChannelDialog
        open={!!showAddChannel}
        teamName={showAddChannel ? teams.find((t) => t.id === showAddChannel)?.name ?? '' : ''}
        channelName={newChannelName}
        onNameChange={onChannelNameChange}
        onCancel={() => onShowAddChannel(null)}
        onCreate={() => {
          if (showAddChannel && newChannelName.trim()) {
            onAddChannel(showAddChannel, newChannelName.trim());
          }
        }}
      />
    </div>
  );

  if (isMobile) {
    return (
      <>
        {sidebarOpen && (
          <div
            onClick={onCloseSidebar}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 30,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            }}
          />
        )}
        <div
          style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            zIndex: 40,
            transition: 'transform 0.2s ease-in-out',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  return sidebarContent;
};
