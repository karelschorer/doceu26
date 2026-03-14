import { useState, useEffect, useCallback } from 'react';
import type { Channel, DM, Group, Team } from '../types';
import { DEFAULT_CHANNELS, DEFAULT_TEAMS } from '../constants';
import { getAvatarColor, getInitials } from '../utils';

/* ── Internal types ──────────────────────────────────────────────────── */

interface WorkspaceUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  active: boolean;
}

interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  org_id?: string;
}

/* ── Hook ────────────────────────────────────────────────────────────── */

export function useChatState(user: AuthUser | null) {
  const USER_UUID = user?.id ?? '';

  /* ── Navigation state ──────────────────────────────────────────────── */
  const [activeTeamId, setActiveTeamId] = useState<string | null>('team-company');
  const [activeChannelId, setActiveChannelId] = useState<string>('company-general');
  const [activeDMId, setActiveDMId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  /* ── Sidebar / UI state ────────────────────────────────────────────── */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [hoveredDMId, setHoveredDMId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<string | null>(null);

  /* ── Teams state ─────────────────────────────────────────────────── */
  const [teams, setTeams] = useState<Team[]>(DEFAULT_TEAMS);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState<string | null>(null);

  /* ── Channel state (kept for API compat) ─────────────────────────── */
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);

  /* ── DM / people state ─────────────────────────────────────────────── */
  const [dms, setDms] = useState<DM[]>([]);

  /* ── Group conversations ─────────────────────────────────────────── */
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  /* ── Derived values ────────────────────────────────────────────────── */
  const activeKey = activeGroupId
    ? `group:${activeGroupId}`
    : activeDMId
      ? `dm:${activeDMId}`
      : activeChannelId;

  const activeDM = dms.find((d) => d.id === activeDMId);
  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const activeTeam = teams.find((t) => t.id === activeTeamId);
  const activeChannel = activeTeam?.channels.find((c) => c.id === activeChannelId);

  const activeName = activeDM
    ? activeDM.name
    : activeGroup
      ? activeGroup.name
      : activeChannel
        ? activeChannel.name
        : activeChannelId;

  const activeTeamName = activeTeam?.name;

  const filteredDMs = dmSearch.trim()
    ? dms.filter((d) => d.name.toLowerCase().includes(dmSearch.toLowerCase()))
    : dms;

  /* ── Load workspace members ────────────────────────────────────────── */

  useEffect(() => {
    fetch('/api/v1/admin/users')
      .then((r) => r.json())
      .then((users: WorkspaceUser[]) => {
        if (!Array.isArray(users)) return;
        setDms(
          users
            .filter((u) => u.id !== user?.id)
            .map((u) => ({
              id: u.id,
              name: u.display_name,
              initials: getInitials(u.display_name),
              color: getAvatarColor(u.display_name),
              online: false,
            })),
        );
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Load channels from API ────────────────────────────────────────── */

  const loadChannels = useCallback(() => {
    fetch('/api/v1/chat/channels')
      .then((r) => r.json())
      .then((chs: Channel[]) => {
        if (Array.isArray(chs)) setChannels(chs);
      })
      .catch(() => {
        setChannels(DEFAULT_CHANNELS);
      });
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  /* ── Load groups from API ──────────────────────────────────────────── */

  const loadGroups = useCallback(() => {
    if (!USER_UUID) return;
    fetch(`/api/v1/chat/groups?user=${encodeURIComponent(USER_UUID)}`)
      .then((r) => r.json())
      .then((gs: Group[]) => {
        if (Array.isArray(gs)) setGroups(gs);
      })
      .catch(() => {});
  }, [USER_UUID]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  /* ── Team creation ───────────────────────────────────────────────── */

  const createTeam = useCallback(
    (name: string, memberIds: string[]) => {
      const teamId = `team-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const newTeam: Team = {
        id: teamId,
        name,
        channels: [{ id: `${teamId}-general`, name: 'general' }],
        members: Array.from(new Set([USER_UUID, ...memberIds])),
        created_by: USER_UUID,
      };
      setTeams((prev) => [...prev, newTeam]);
      setShowCreateTeam(false);
      setActiveTeamId(teamId);
      setActiveChannelId(`${teamId}-general`);
      setActiveDMId(null);
      setActiveGroupId(null);
    },
    [USER_UUID],
  );

  /* ── Add channel to team ─────────────────────────────────────────── */

  const addChannelToTeam = useCallback(
    (teamId: string, channelName: string) => {
      const channelId = `${teamId}-${channelName.toLowerCase().replace(/\s+/g, '-')}`;
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId
            ? { ...t, channels: [...t.channels, { id: channelId, name: channelName }] }
            : t,
        ),
      );
      setShowAddChannel(null);
      setNewChannelName('');
      setActiveTeamId(teamId);
      setActiveChannelId(channelId);
      setActiveDMId(null);
      setActiveGroupId(null);
    },
    [],
  );

  /* ── Channel creation (legacy API) ──────────────────────────────── */

  const createChannel = useCallback(() => {
    if (!newChannelName.trim()) return;
    fetch('/api/v1/chat/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newChannelName.trim(),
        is_private: newChannelPrivate,
        created_by: USER_UUID,
      }),
    })
      .then(() => {
        loadChannels();
        setShowCreateChannel(false);
        setActiveChannelId(newChannelName.trim());
        setActiveDMId(null);
        setActiveGroupId(null);
        setNewChannelName('');
        setNewChannelPrivate(false);
      })
      .catch(() => alert('Failed to create channel'));
  }, [newChannelName, newChannelPrivate, USER_UUID, loadChannels]);

  /* ── Group creation ──────────────────────────────────────────────── */

  const createGroup = useCallback(
    (memberIds: string[]) => {
      const allIds = Array.from(new Set([USER_UUID, ...memberIds])).sort();
      const groupKey = allIds.join('_');

      const existing = groups.find((g) => g.id === groupKey);
      if (existing) {
        setActiveGroupId(groupKey);
        setActiveDMId(null);
        setActiveTeamId(null);
        setShowCreateGroup(false);
        return;
      }

      const resolveName = (id: string) =>
        id === USER_UUID
          ? (user?.display_name ?? id)
          : (dms.find((d) => d.id === id)?.name ?? id);

      const groupName = memberIds.map(resolveName).join(', ');

      fetch('/api/v1/chat/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: groupKey,
          name: groupName,
          members: allIds,
          member_names: allIds.map(resolveName),
          created_by: USER_UUID,
        }),
      })
        .then((r) => {
          if (!r.ok) throw new Error('create group failed');
          return r.json();
        })
        .then((newGroup: Group) => {
          setGroups((prev) => {
            if (prev.find((g) => g.id === newGroup.id)) return prev;
            return [...prev, newGroup];
          });
          setActiveGroupId(newGroup.id);
          setActiveDMId(null);
          setActiveTeamId(null);
          setShowCreateGroup(false);
        })
        .catch(() => alert('Failed to create group'));
    },
    [USER_UUID, user?.display_name, dms, groups],
  );

  return {
    // Navigation
    activeTeamId,
    setActiveTeamId,
    activeChannelId,
    setActiveChannelId,
    activeDMId,
    setActiveDMId,
    activeGroupId,
    setActiveGroupId,
    activeKey,
    activeDM,
    activeGroup,
    activeTeam,
    activeChannel,
    activeName,
    activeTeamName,

    // Teams
    teams,
    setTeams,
    showCreateTeam,
    setShowCreateTeam,
    createTeam,
    showAddChannel,
    setShowAddChannel,
    addChannelToTeam,

    // Channels (legacy)
    channels,
    setChannels,
    loadChannels,
    showCreateChannel,
    setShowCreateChannel,
    newChannelName,
    setNewChannelName,
    newChannelPrivate,
    setNewChannelPrivate,
    createChannel,

    // DMs / people
    dms,
    setDms,
    dmSearch,
    setDmSearch,
    filteredDMs,
    hoveredDMId,
    setHoveredDMId,

    // Groups
    groups,
    setGroups,
    showCreateGroup,
    setShowCreateGroup,
    createGroup,
    loadGroups,

    // Sidebar UI
    sidebarOpen,
    setSidebarOpen,

    // Thread
    activeThread,
    setActiveThread,
  };
}
