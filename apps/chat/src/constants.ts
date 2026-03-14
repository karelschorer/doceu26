import type { Channel, Team } from './types';

/* ── Constants ───────────────────────────────────────────────────────────── */

export const DEFAULT_CHANNELS: Channel[] = [
  { id: 'general', name: 'general' },
  { id: 'random', name: 'random' },
  { id: 'dev', name: 'dev' },
  { id: 'design', name: 'design' },
  { id: 'announcements', name: 'announcements' },
];

export const DEFAULT_TEAMS: Team[] = [
  {
    id: 'team-engineering',
    name: 'Engineering',
    channels: [
      { id: 'eng-general', name: 'general' },
      { id: 'eng-frontend', name: 'frontend' },
      { id: 'eng-backend', name: 'backend' },
      { id: 'eng-devops', name: 'devops' },
    ],
    members: [],
    created_by: 'system',
  },
  {
    id: 'team-design',
    name: 'Design',
    channels: [
      { id: 'design-general', name: 'general' },
      { id: 'design-reviews', name: 'reviews' },
      { id: 'design-inspiration', name: 'inspiration' },
    ],
    members: [],
    created_by: 'system',
  },
  {
    id: 'team-company',
    name: 'Company',
    channels: [
      { id: 'company-general', name: 'general' },
      { id: 'company-random', name: 'random' },
      { id: 'company-announcements', name: 'announcements' },
    ],
    members: [],
    created_by: 'system',
  },
];

export const AVATAR_COLORS = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#16a34a',
  '#0891b2',
  '#d97706',
];

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
};
