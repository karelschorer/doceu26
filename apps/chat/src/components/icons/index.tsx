/* ── Icon Components ─────────────────────────────────────────────────────── */
import type { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/* ── Existing icons (extracted from ChatPage.tsx) ────────────────────────── */

export const VideoIcon = ({ off, size = 18, className, style }: IconProps & { off?: boolean }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    {off ? (
      <>
        <path d="M2 7h8l2 2v2l2 1.5V8.5l2-1.5v7l-2-1.5V14l-2 2H2V7z" />
        <line x1="2" y1="2" x2="18" y2="18" />
      </>
    ) : (
      <>
        <rect x="2" y="6" width="12" height="8" rx="1.5" />
        <polyline points="14,9 18,7 18,13 14,11" />
      </>
    )}
  </svg>
);

export const MicIcon = ({ off, size = 18, className, style }: IconProps & { off?: boolean }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    {off ? (
      <>
        <rect x="7" y="2" width="6" height="9" rx="3" />
        <path d="M3 10a7 7 0 0014 0" />
        <line x1="10" y1="17" x2="10" y2="19" />
        <line x1="7" y1="19" x2="13" y2="19" />
        <line x1="2" y1="2" x2="18" y2="18" />
      </>
    ) : (
      <>
        <rect x="7" y="2" width="6" height="9" rx="3" />
        <path d="M3 10a7 7 0 0014 0" />
        <line x1="10" y1="17" x2="10" y2="19" />
        <line x1="7" y1="19" x2="13" y2="19" />
      </>
    )}
  </svg>
);

export const MicOffIcon = ({ size = 18, className, style }: IconProps) => (
  <MicIcon off size={size} className={className} style={style} />
);

export const ScreenShareIcon = ({ active, size = 18, className, style }: IconProps & { active?: boolean }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <rect x="2" y="3" width="16" height="11" rx="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={0.15} />
    <line x1="10" y1="14" x2="10" y2="17" />
    <line x1="6" y1="17" x2="14" y2="17" />
    <polyline points="7,8.5 10,5.5 13,8.5" />
    <line x1="10" y1="5.5" x2="10" y2="12" />
  </svg>
);

export const PhoneOffIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <path d="M16.5 14.5l-2-2a1 1 0 00-1.4 0l-1 1a10 10 0 01-5.6-5.6l1-1a1 1 0 000-1.4l-2-2A1 1 0 004 4L2.5 5.5C2 8 3.5 13 7.5 17s9 5.5 11.5 5l1.5-1.5a1 1 0 00-.5-1.5z" />
    <line x1="2" y1="2" x2="18" y2="18" />
  </svg>
);

export const PhoneIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <path d="M16.5 14.5l-2-2a1 1 0 00-1.4 0l-1 1a10 10 0 01-5.6-5.6l1-1a1 1 0 000-1.4l-2-2A1 1 0 004 4L2.5 5.5C2 8 3.5 13 7.5 17s9 5.5 11.5 5l1.5-1.5a1 1 0 00-.5-1.5z" />
  </svg>
);

/* ── New icons for the redesign ──────────────────────────────────────────── */

export const HashIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <line x1="4" y1="8" x2="16" y2="8" />
    <line x1="4" y1="12" x2="16" y2="12" />
    <line x1="7" y1="4" x2="6" y2="16" />
    <line x1="13" y1="4" x2="12" y2="16" />
  </svg>
);

export const ChevronDownIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <polyline points="5,8 10,13 15,8" />
  </svg>
);

export const ChevronRightIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <polyline points="8,5 13,10 8,15" />
  </svg>
);

export const PlusIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <line x1="10" y1="4" x2="10" y2="16" />
    <line x1="4" y1="10" x2="16" y2="10" />
  </svg>
);

export const SearchIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <circle cx="8.5" cy="8.5" r="5.5" />
    <line x1="13" y1="13" x2="17" y2="17" />
  </svg>
);

export const SendIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <path d="M3 3l14 7-14 7V11l8-1-8-1V3z" />
  </svg>
);

export const ReplyIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <polyline points="8,5 3,10 8,15" />
    <path d="M3 10h10a4 4 0 014 4v2" />
  </svg>
);

export const EmojiIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <circle cx="10" cy="10" r="8" />
    <path d="M6.5 12a4 4 0 007 0" />
    <circle cx="7" cy="8" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="13" cy="8" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

export const AttachmentIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <path d="M14.5 10.5l-5 5a3.5 3.5 0 01-5-5l6-6a2.5 2.5 0 013.5 3.5l-6 6a1.5 1.5 0 01-2-2l5-5" />
  </svg>
);

export const BoldIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <path d="M6 4h5.5a3 3 0 010 6H6V4z" />
    <path d="M6 10h6.5a3 3 0 010 6H6v-6z" />
  </svg>
);

export const ItalicIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <line x1="8" y1="4" x2="14" y2="4" />
    <line x1="6" y1="16" x2="12" y2="16" />
    <line x1="12" y1="4" x2="8" y2="16" />
  </svg>
);

export const CloseIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <line x1="5" y1="5" x2="15" y2="15" />
    <line x1="15" y1="5" x2="5" y2="15" />
  </svg>
);

export const XIcon = CloseIcon;

export const UsersIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <circle cx="7" cy="7" r="3" />
    <path d="M1 17v-1a4 4 0 014-4h4a4 4 0 014 4v1" />
    <circle cx="14" cy="6" r="2.5" />
    <path d="M15 12h1.5a3.5 3.5 0 013.5 3.5V17" />
  </svg>
);

export const MoreHorizontalIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="currentColor" stroke="none" width={size} height={size} className={className} style={style}>
    <circle cx="4" cy="10" r="1.5" />
    <circle cx="10" cy="10" r="1.5" />
    <circle cx="16" cy="10" r="1.5" />
  </svg>
);

export const BookmarkIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <path d="M5 3h10a1 1 0 011 1v14l-6-4-6 4V4a1 1 0 011-1z" />
  </svg>
);

export const AtSignIcon = ({ size = 18, className, style }: IconProps) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} className={className} style={style}>
    <circle cx="10" cy="10" r="3" />
    <path d="M13 10v1.5a2 2 0 004 0V10a7 7 0 10-3 5.75" />
  </svg>
);
