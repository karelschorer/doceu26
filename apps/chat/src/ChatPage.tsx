import { useState } from 'react';
import { useAuth } from './useAuth';
import { useResponsive } from './hooks/useResponsive';
import { useChatState } from './hooks/useChatState';
import { useChatConnection } from './hooks/useChatConnection';
import { useWebRTC } from './hooks/useWebRTC';
import { ChatLayout } from './components/layout/ChatLayout';
import { ChatSidebar } from './components/layout/ChatSidebar';
import { ThreadPanel } from './components/layout/ThreadPanel';
import { ChatHeader } from './components/chat/ChatHeader';
import { MessageList } from './components/chat/MessageList';
import { TypingIndicator } from './components/chat/TypingIndicator';
import { MessageInput } from './components/input/MessageInput';
import { VideoCallOverlay } from './components/video/VideoCallOverlay';

export function ChatPage() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [input, setInput] = useState('');

  /* ── State hooks ───────────────────────────────────────────────────────── */

  const chatState = useChatState(user);
  const {
    activeTeamId, setActiveTeamId,
    activeChannelId, setActiveChannelId,
    activeDMId, setActiveDMId,
    activeGroupId, setActiveGroupId,
    activeKey, activeDM, activeName, activeTeamName,
    teams, showCreateTeam, setShowCreateTeam, createTeam,
    showAddChannel, setShowAddChannel, addChannelToTeam,
    newChannelName, setNewChannelName,
    dms, dmSearch, setDmSearch, filteredDMs,
    hoveredDMId, setHoveredDMId,
    groups, showCreateGroup, setShowCreateGroup, createGroup,
    sidebarOpen, setSidebarOpen,
    activeThread, setActiveThread,
  } = chatState;

  const { wsConnected, messagesByChannel, sendMessage } = useChatConnection(
    user, activeKey, activeChannelId, activeDMId, activeGroupId,
  );

  const webrtc = useWebRTC(
    user, dms, activeChannelId, activeDMId, setActiveDMId, setActiveChannelId,
  );

  /* ── Derived ───────────────────────────────────────────────────────────── */

  const messages = messagesByChannel[activeKey] ?? [];
  const isTeamChannel = !!activeTeamId && !activeDMId && !activeGroupId;
  const isDM = !!activeDMId;
  const isGroup = !!activeGroupId;
  const placeholder = activeDM
    ? `Message ${activeDM.name}`
    : isGroup
      ? `Message ${activeName}`
      : activeTeamName
        ? `Message #${activeName} in ${activeTeamName}`
        : `Message #${activeName}`;

  /* ── Handlers ──────────────────────────────────────────────────────────── */

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleSelectTeamChannel = (teamId: string, channelId: string) => {
    setActiveTeamId(teamId);
    setActiveChannelId(channelId);
    setActiveDMId(null);
    setActiveGroupId(null);
    if (isMobile) setSidebarOpen(false);
  };

  const handleSelectDM = (id: string) => {
    setActiveDMId(id);
    setActiveGroupId(null);
    setActiveTeamId(null);
    if (isMobile) setSidebarOpen(false);
  };

  const handleSelectGroup = (id: string) => {
    setActiveGroupId(id);
    setActiveDMId(null);
    setActiveTeamId(null);
    if (isMobile) setSidebarOpen(false);
  };

  const handleVideoCall = () => {
    if (isDM) webrtc.startCall();
    else if (isTeamChannel || isGroup) webrtc.startGroupCall();
  };

  const handleReply = (messageId: string) => {
    setActiveThread(messageId);
  };

  const handleDecline = () => {
    webrtc.hangUp(false);
  };

  /* ── Thread panel data ─────────────────────────────────────────────────── */

  const threadParent = activeThread
    ? messages.find((m) => m.id === activeThread) ?? null
    : null;

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <>
      {webrtc.callState !== 'idle' && (
        <VideoCallOverlay
          callState={webrtc.callState}
          callRoom={webrtc.callRoom}
          callIsGroup={webrtc.callIsGroup}
          callerName={webrtc.callerName}
          remoteStreams={webrtc.remoteStreams}
          callParticipants={webrtc.callParticipants}
          isMuted={webrtc.isMuted}
          isCameraOff={webrtc.isCameraOff}
          isScreenSharing={webrtc.isScreenSharing}
          remoteScreenSharers={webrtc.remoteScreenSharers}
          callDuration={webrtc.callDuration}
          localVideoRef={webrtc.localVideoRef}
          dms={dms}
          onHangUp={webrtc.hangUp}
          onToggleMute={webrtc.toggleMute}
          onToggleCamera={webrtc.toggleCamera}
          onToggleScreenShare={webrtc.toggleScreenShare}
          onAcceptDMCall={webrtc.acceptDMCall}
          onJoinGroupCall={webrtc.joinGroupCall}
          onDecline={handleDecline}
          isMobile={isMobile}
        />
      )}

      <ChatLayout
        sidebar={
          <ChatSidebar
            teams={teams}
            activeTeamId={activeTeamId}
            activeChannelId={activeChannelId}
            activeDMId={activeDMId}
            activeGroupId={activeGroupId}
            dms={dms}
            filteredDMs={filteredDMs}
            groups={groups}
            dmSearch={dmSearch}
            hoveredDMId={hoveredDMId}
            sidebarOpen={sidebarOpen}
            showCreateTeam={showCreateTeam}
            showCreateGroup={showCreateGroup}
            showAddChannel={showAddChannel}
            newChannelName={newChannelName}
            onSelectTeamChannel={handleSelectTeamChannel}
            onSelectDM={handleSelectDM}
            onSelectGroup={handleSelectGroup}
            onDMSearchChange={setDmSearch}
            onDMHover={setHoveredDMId}
            onCallDM={(id) => {
              setActiveDMId(id);
              setActiveGroupId(null);
              setActiveTeamId(null);
              setTimeout(() => webrtc.startCall(), 100);
            }}
            onCloseSidebar={() => setSidebarOpen(false)}
            onShowCreateTeam={setShowCreateTeam}
            onShowCreateGroup={setShowCreateGroup}
            onShowAddChannel={setShowAddChannel}
            onChannelNameChange={setNewChannelName}
            onCreateTeam={createTeam}
            onCreateGroup={createGroup}
            onAddChannel={addChannelToTeam}
            wsConnected={wsConnected}
            userName={user?.display_name ?? ''}
            userEmail={user?.email ?? ''}
            isMobile={isMobile}
          />
        }
        main={
          <>
            <ChatHeader
              activeName={activeName}
              activeTeamName={activeTeamName}
              isChannel={isTeamChannel}
              isDM={isDM}
              isGroup={isGroup}
              onVideoCall={handleVideoCall}
              onToggleSidebar={() => setSidebarOpen(true)}
              isMobile={isMobile}
            />
            <MessageList
              messages={messages}
              onReply={handleReply}
              emptyType={isTeamChannel ? 'channel' : isDM ? 'dm' : 'group'}
              emptyName={activeName}
              emptyColor={activeDM?.color}
              emptyInitials={activeDM?.initials}
            />
            <TypingIndicator names={[]} />
            <MessageInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              placeholder={placeholder}
              showVideoButton={isDM}
              onVideoCall={handleVideoCall}
            />
          </>
        }
        threadPanel={
          activeThread ? (
            <ThreadPanel
              parentMessage={threadParent}
              messages={[]}
              onClose={() => setActiveThread(null)}
              onSendReply={() => {}}
            />
          ) : undefined
        }
      />
    </>
  );
}
