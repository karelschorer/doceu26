import { useState, useRef, useCallback, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface DriveFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploaded_at: string;
  owner: string;
  isFolder?: boolean;
}

type NavSection = 'my-drive' | 'shared' | 'recent' | 'starred' | 'trash';
type ViewMode = 'grid' | 'list';
type SortKey = 'name' | 'modified' | 'size';

// ── Constants ──────────────────────────────────────────────────────────────────

const USED_GB = 2.3;
const TOTAL_GB = 15;

const NAV_ITEMS: { id: NavSection; icon: string; label: string }[] = [
  { id: 'my-drive', icon: '🗂', label: 'My Drive' },
  { id: 'shared',   icon: '👥', label: 'Shared with me' },
  { id: 'recent',   icon: '🕐', label: 'Recent' },
  { id: 'starred',  icon: '⭐', label: 'Starred' },
  { id: 'trash',    icon: '🗑', label: 'Trash' },
];

const MOCK_FILES: DriveFile[] = [
  { id: 'f1', name: 'Q4 Report.docx',      size: 1_240_000, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uploaded_at: '2026-03-08T10:30:00Z', owner: 'Me' },
  { id: 'f2', name: 'Budget 2026.xlsx',    size: 892_000,   mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       uploaded_at: '2026-03-07T14:15:00Z', owner: 'Me' },
  { id: 'f3', name: 'Product Pitch.pptx',  size: 3_400_000, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', uploaded_at: '2026-03-05T09:00:00Z', owner: 'Karel S.' },
  { id: 'f4', name: 'Team Photo.png',      size: 5_600_000, mimeType: 'image/png',                 uploaded_at: '2026-03-01T16:45:00Z', owner: 'Me' },
  { id: 'f5', name: 'Archive.zip',         size: 12_000_000,mimeType: 'application/zip',           uploaded_at: '2026-02-28T11:20:00Z', owner: 'Me' },
  { id: 'f6', name: 'Notes.txt',           size: 14_000,    mimeType: 'text/plain',               uploaded_at: '2026-02-25T08:00:00Z', owner: 'Me' },
  { id: 'folder1', name: 'Projects',       size: 0,         mimeType: 'folder',                   uploaded_at: '2026-02-20T12:00:00Z', owner: 'Me', isFolder: true },
  { id: 'folder2', name: 'Designs',        size: 0,         mimeType: 'folder',                   uploaded_at: '2026-02-15T12:00:00Z', owner: 'Karel S.', isFolder: true },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getFileIcon(mimeType: string, isFolder?: boolean): string {
  if (isFolder) return '📁';
  if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return '📄';
  if (mimeType.includes('spreadsheetml') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentationml') || mimeType.includes('powerpoint')) return '🖥';
  if (mimeType.startsWith('image/')) return '📷';
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive')) return '📦';
  if (mimeType === 'application/pdf') return '📑';
  return '📎';
}

function getFileIconColor(mimeType: string, isFolder?: boolean): string {
  if (isFolder) return '#f59e0b';
  if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return '#2563eb';
  if (mimeType.includes('spreadsheetml') || mimeType.includes('excel')) return '#16a34a';
  if (mimeType.includes('presentationml') || mimeType.includes('powerpoint')) return '#ea580c';
  if (mimeType.startsWith('image/')) return '#7c3aed';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '#78716c';
  if (mimeType === 'application/pdf') return '#dc2626';
  return '#64748b';
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function NewFolderModal({ onConfirm, onCancel }: { onConfirm: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('Untitled folder');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.select(); }, []);
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">New folder</div>
        <div className="form-group">
          <input
            ref={inputRef}
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(name); if (e.key === 'Escape') onCancel(); }}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onConfirm(name)} disabled={!name.trim()}>Create</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DrivePage() {
  const [files, setFiles] = useState<DriveFile[]>(MOCK_FILES);
  const [navSection, setNavSection] = useState<NavSection>('my-drive');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [hoveredFileId, setHoveredFileId] = useState<string | null>(null);
  const [fileMenuId, setFileMenuId] = useState<string | null>(null);
  const [breadcrumb] = useState(['My Drive']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => { setNewDropdownOpen(false); setSortDropdownOpen(false); setFileMenuId(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Upload ────────────────────────────────────────────────────────────────

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const key = `${Date.now()}-${file.name}`;
      await fetch(`/api/v1/storage/user-files/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      setFiles((prev) => [{
        id: key,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        uploaded_at: new Date().toISOString(),
        owner: 'Me',
      }, ...prev]);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadFile(f);
    e.target.value = '';
  };

  // ── Drag & drop ───────────────────────────────────────────────────────────

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    for (const file of dropped) await uploadFile(file);
  };

  // ── New folder ────────────────────────────────────────────────────────────

  const createFolder = (name: string) => {
    setFiles((prev) => [{
      id: `folder-${Date.now()}`,
      name,
      size: 0,
      mimeType: 'folder',
      uploaded_at: new Date().toISOString(),
      owner: 'Me',
      isFolder: true,
    }, ...prev]);
    setShowNewFolderModal(false);
  };

  // ── Sort & filter ─────────────────────────────────────────────────────────

  const visibleFiles = files
    .filter((f) => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      // Folders always first
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'modified') cmp = a.uploaded_at.localeCompare(b.uploaded_at);
      else if (sortKey === 'size') cmp = a.size - b.size;
      return sortAsc ? cmp : -cmp;
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((prev) => !prev);
    else { setSortKey(key); setSortAsc(true); }
    setSortDropdownOpen(false);
  };

  const usedPercent = Math.round((USED_GB / TOTAL_GB) * 100);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── Left sidebar ─────────────────────────────────────── */}
      <aside className="sidebar" style={{ width: 220, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* + New button */}
          <div style={{ padding: '12px 12px 8px', position: 'relative' }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'space-between', fontSize: 13 }}
              onClick={(e) => { e.stopPropagation(); setNewDropdownOpen((o) => !o); }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New
              </span>
              <span style={{ fontSize: 10 }}>▼</span>
            </button>
            {newDropdownOpen && (
              <div
                className="dropdown"
                style={{ top: 'calc(100% - 4px)', left: 12, right: 12 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button className="dropdown-item" onClick={() => { setNewDropdownOpen(false); fileInputRef.current?.click(); }}>
                  <span>📤</span> Upload file
                </button>
                <button className="dropdown-item" onClick={() => { setNewDropdownOpen(false); setShowNewFolderModal(true); }}>
                  <span>📁</span> New folder
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, overflow: 'auto' }}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`sidebar-item${navSection === item.id ? ' active' : ''}`}
                onClick={() => setNavSection(item.id)}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Storage meter */}
        <div style={{ padding: '12px 14px 16px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginBottom: 6 }}>
            Used {USED_GB} GB of {TOTAL_GB} GB
          </div>
          <div style={{
            height: 4, borderRadius: 2, background: 'var(--color-bg-4)',
            overflow: 'hidden', marginBottom: 6,
          }}>
            <div style={{
              height: '100%', width: `${usedPercent}%`,
              background: usedPercent > 80 ? 'var(--color-danger)' : 'var(--color-primary)',
              borderRadius: 2, transition: 'width 0.4s ease',
            }} />
          </div>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            Get more storage
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-bg)' }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', borderBottom: '1px solid var(--color-border)',
          flexShrink: 0, flexWrap: 'wrap',
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
            {breadcrumb.map((crumb, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {i > 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>›</span>}
                <span style={{
                  fontSize: 15, fontWeight: i === breadcrumb.length - 1 ? 600 : 400,
                  color: i === breadcrumb.length - 1 ? 'var(--color-text)' : 'var(--color-text-3)',
                  cursor: i < breadcrumb.length - 1 ? 'pointer' : 'default',
                }}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Search */}
          <div style={{ position: 'relative', width: 220 }}>
            <span style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)', fontSize: 13, pointerEvents: 'none',
            }}>🔍</span>
            <input
              className="input"
              style={{ paddingLeft: 28, width: '100%' }}
              placeholder="Search in Drive"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View toggles */}
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              className={`btn btn-ghost btn-icon${viewMode === 'grid' ? ' active' : ''}`}
              style={{ color: viewMode === 'grid' ? 'var(--color-primary)' : undefined }}
              title="Grid view"
              onClick={() => setViewMode('grid')}
            >
              ▦
            </button>
            <button
              className={`btn btn-ghost btn-icon${viewMode === 'list' ? ' active' : ''}`}
              style={{ color: viewMode === 'list' ? 'var(--color-primary)' : undefined }}
              title="List view"
              onClick={() => setViewMode('list')}
            >
              ≡
            </button>
          </div>

          {/* Sort dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={(e) => { e.stopPropagation(); setSortDropdownOpen((o) => !o); }}
              style={{ gap: 4 }}
            >
              {sortKey === 'name' ? 'Name' : sortKey === 'modified' ? 'Last modified' : 'File size'}
              <span style={{ fontSize: 10 }}>{sortAsc ? '↑' : '↓'}</span>
            </button>
            {sortDropdownOpen && (
              <div
                className="dropdown"
                style={{ right: 0, top: 'calc(100% + 4px)', minWidth: 160 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button className="dropdown-item" onClick={() => toggleSort('name')}>Name {sortKey === 'name' && (sortAsc ? '↑' : '↓')}</button>
                <button className="dropdown-item" onClick={() => toggleSort('modified')}>Last modified {sortKey === 'modified' && (sortAsc ? '↑' : '↓')}</button>
                <button className="dropdown-item" onClick={() => toggleSort('size')}>File size {sortKey === 'size' && (sortAsc ? '↑' : '↓')}</button>
              </div>
            )}
          </div>

          {uploading && (
            <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500 }}>
              Uploading…
            </span>
          )}
        </div>

        {/* File area */}
        <div style={{ flex: 1, overflow: 'auto', padding: viewMode === 'grid' ? '16px' : '0' }}>
          {visibleFiles.length === 0 ? (
            <div className="empty-state" style={{ height: '100%' }}>
              <div className="empty-state-icon">🗂</div>
              <div className="empty-state-title">Drop files here or click + New to upload</div>
              <div className="empty-state-desc">Your files and folders will appear here</div>
            </div>
          ) : viewMode === 'grid' ? (
            // ── Grid view ─────────────────────────────────────
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 12,
            }}>
              {visibleFiles.map((file) => (
                <div
                  key={file.id}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    padding: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    border: hoveredFileId === file.id
                      ? '1.5px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                    transition: 'border-color var(--transition), box-shadow var(--transition)',
                  }}
                  onMouseEnter={() => setHoveredFileId(file.id)}
                  onMouseLeave={() => { setHoveredFileId(null); }}
                >
                  {/* Icon area */}
                  <div style={{
                    height: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--color-bg-2)',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: 40,
                    color: getFileIconColor(file.mimeType, file.isFolder),
                  }}>
                    {getFileIcon(file.mimeType, file.isFolder)}
                  </div>

                  {/* Info area */}
                  <div style={{ padding: '8px 10px 10px' }}>
                    <div style={{
                      fontSize: 13, fontWeight: 500,
                      color: 'var(--color-text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginBottom: 2,
                    }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {formatDate(file.uploaded_at)}
                    </div>
                  </div>

                  {/* 3-dot menu — visible on hover */}
                  {hoveredFileId === file.id && (
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid var(--color-border)',
                        fontSize: 14, fontWeight: 700,
                      }}
                      onClick={(e) => { e.stopPropagation(); setFileMenuId(fileMenuId === file.id ? null : file.id); }}
                    >
                      ⋯
                    </button>
                  )}

                  {fileMenuId === file.id && (
                    <div
                      className="dropdown"
                      style={{ right: 4, top: 34, minWidth: 140 }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <button className="dropdown-item">✏️ Rename</button>
                      <button className="dropdown-item">⭐ Star</button>
                      <button className="dropdown-item">📤 Share</button>
                      <button className="dropdown-item">⬇️ Download</button>
                      <button
                        className="dropdown-item danger"
                        onClick={() => { setFiles((prev) => prev.filter((f) => f.id !== file.id)); setFileMenuId(null); }}
                      >
                        🗑 Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // ── List view ──────────────────────────────────────
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-2)' }}>
                  <th
                    style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-3)', cursor: 'pointer', userSelect: 'none', fontSize: 12 }}
                    onClick={() => toggleSort('name')}
                  >
                    Name {sortKey === 'name' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-3)', fontSize: 12, width: 140 }}>Owner</th>
                  <th
                    style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-3)', cursor: 'pointer', userSelect: 'none', fontSize: 12, width: 160 }}
                    onClick={() => toggleSort('modified')}
                  >
                    Last modified {sortKey === 'modified' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th
                    style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-3)', cursor: 'pointer', userSelect: 'none', fontSize: 12, width: 100 }}
                    onClick={() => toggleSort('size')}
                  >
                    File size {sortKey === 'size' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {visibleFiles.map((file) => (
                  <tr
                    key={file.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      background: hoveredFileId === file.id ? 'var(--color-bg-2)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background var(--transition)',
                    }}
                    onMouseEnter={() => setHoveredFileId(file.id)}
                    onMouseLeave={() => setHoveredFileId(null)}
                  >
                    <td style={{ padding: '9px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18, color: getFileIconColor(file.mimeType, file.isFolder), flexShrink: 0 }}>
                          {getFileIcon(file.mimeType, file.isFolder)}
                        </span>
                        <span style={{
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          maxWidth: 300, color: 'var(--color-text)', fontWeight: 450,
                        }}>
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '9px 16px', color: 'var(--color-text-3)' }}>{file.owner}</td>
                    <td style={{ padding: '9px 16px', color: 'var(--color-text-3)' }}>{formatDate(file.uploaded_at)}</td>
                    <td style={{ padding: '9px 16px', color: 'var(--color-text-3)', textAlign: 'right' }}>{formatSize(file.size)}</td>
                    <td style={{ padding: '9px 8px', textAlign: 'center', position: 'relative' }}>
                      {hoveredFileId === file.id && (
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          style={{ fontSize: 14, fontWeight: 700 }}
                          onClick={(e) => { e.stopPropagation(); setFileMenuId(fileMenuId === file.id ? null : file.id); }}
                        >
                          ⋯
                        </button>
                      )}
                      {fileMenuId === file.id && (
                        <div
                          className="dropdown"
                          style={{ right: 0, top: 28, minWidth: 140 }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <button className="dropdown-item">✏️ Rename</button>
                          <button className="dropdown-item">⭐ Star</button>
                          <button className="dropdown-item">📤 Share</button>
                          <button className="dropdown-item">⬇️ Download</button>
                          <button
                            className="dropdown-item danger"
                            onClick={() => { setFiles((prev) => prev.filter((f) => f.id !== file.id)); setFileMenuId(null); }}
                          >
                            🗑 Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Drag-and-drop overlay ──────────────────────────── */}
      {isDragging && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 900,
          background: 'rgba(37, 99, 235, 0.08)',
          border: '3px dashed var(--color-primary)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 12, pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 56 }}>📤</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>
            Drop files to upload
          </span>
          <span style={{ fontSize: 14, color: 'var(--color-primary-text)' }}>
            Files will be added to My Drive
          </span>
        </div>
      )}

      {/* ── New folder modal ───────────────────────────────── */}
      {showNewFolderModal && (
        <NewFolderModal
          onConfirm={createFolder}
          onCancel={() => setShowNewFolderModal(false)}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
    </div>
  );
}
