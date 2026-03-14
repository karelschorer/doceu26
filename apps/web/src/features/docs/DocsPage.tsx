import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface Document {
  id: string;
  title: string;
  type: string;
  updated_at: string;
  owner?: string;
}

type Tab = 'recent' | 'mine' | 'shared';

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'Edited just now';
  if (diffMinutes < 60) return `Edited ${diffMinutes}m ago`;
  if (diffHours < 24) return `Edited ${diffHours}h ago`;
  if (diffDays === 1) return 'Edited yesterday';
  if (diffDays < 7) return `Edited ${diffDays} days ago`;
  return `Edited ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function DocCard({ doc, onClick }: { doc: Document; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const owner = doc.owner || 'Karel Schorer';
  const initials = getInitials(owner);

  return (
    <div
      className="card"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'box-shadow var(--transition), transform var(--transition)',
        boxShadow: hovered ? 'var(--shadow)' : 'var(--shadow-xs)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      {/* Document preview thumbnail */}
      <div
        style={{
          height: 120,
          background: 'var(--color-bg-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid var(--color-border)',
          fontSize: 40,
        }}
      >
        📄
      </div>

      {/* Options button */}
      {hovered && (
        <button
          className="btn btn-ghost btn-icon"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: 16,
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
          }}
          title="More options"
        >
          ⋯
        </button>
      )}

      {/* Card footer */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: 3,
            }}
          >
            {doc.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{timeAgo(doc.updated_at)}</div>
        </div>
        {/* Owner avatar */}
        <div
          title={owner}
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: 'white',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
      </div>
    </div>
  );
}

export function DocsPage() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const modalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/v1/documents')
      .then((r) => r.json())
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => modalInputRef.current?.focus(), 50);
    }
  }, [showModal]);

  const openModal = () => {
    setNewTitle('Untitled Document');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setNewTitle('');
  };

  const createDoc = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), type: 'doc' }),
      });
      if (res.ok) {
        const doc = await res.json();
        setDocs((prev) => [doc, ...prev]);
        closeModal();
        navigate(`/docs/${doc.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'shared') return false; // placeholder — no shared docs in API yet
    return matchesSearch;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'recent', label: 'Recent' },
    { key: 'mine', label: 'My documents' },
    { key: 'shared', label: 'Shared with me' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page header */}
      <div className="page-header">
        <span className="page-header-title">Documents</span>
        <div className="page-header-spacer" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            className="input"
            type="search"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 240 }}
          />
          <button className="btn btn-primary" onClick={openModal}>
            + New document
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          padding: '0 20px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          flexShrink: 0,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-3)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'all var(--transition)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', background: 'var(--color-bg-2)' }}>
        {loading ? (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: '32px 0', textAlign: 'center' }}>
            Loading documents...
          </div>
        ) : activeTab === 'shared' ? (
          <div className="empty-state">
            <div className="empty-state-icon">🤝</div>
            <div className="empty-state-title">No shared documents</div>
            <div className="empty-state-desc">Documents shared with you will appear here</div>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-title">
              {searchQuery ? 'No documents match your search' : 'No documents yet'}
            </div>
            <div className="empty-state-desc">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first document to get started'}
            </div>
            {!searchQuery && (
              <button className="btn btn-primary" onClick={openModal} style={{ marginTop: 8 }}>
                + New document
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
              gap: 14,
            }}
          >
            {filteredDocs.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                onClick={() => navigate(`/docs/${doc.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Document Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">New document</div>
            <div className="form-group">
              <label className="form-label" htmlFor="doc-title">Document title</label>
              <input
                id="doc-title"
                ref={modalInputRef}
                className="input"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createDoc();
                  if (e.key === 'Escape') closeModal();
                }}
                placeholder="Enter document title"
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={createDoc}
                disabled={creating || !newTitle.trim()}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
