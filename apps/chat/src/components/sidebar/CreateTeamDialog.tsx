import { useState } from 'react';
import type { DM } from '../../types';
import { CloseIcon } from '../icons';

interface CreateTeamDialogProps {
  open: boolean;
  dms: DM[];
  onCancel: () => void;
  onCreate: (name: string, memberIds: string[]) => void;
}

export function CreateTeamDialog({ open, dms, onCancel, onCreate }: CreateTeamDialogProps) {
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [closeBtnHovered, setCloseBtnHovered] = useState(false);
  const [cancelBtnHovered, setCancelBtnHovered] = useState(false);
  const [createBtnHovered, setCreateBtnHovered] = useState(false);
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);

  if (!open) return null;

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCreate = () => {
    onCreate(name.trim(), selectedIds);
    setName('');
    setSelectedIds([]);
  };

  const handleCancel = () => {
    setName('');
    setSelectedIds([]);
    onCancel();
  };

  const isValid = name.trim().length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={handleCancel}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(4px)',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 448,
          margin: '0 16px',
          backgroundColor: 'var(--color-bg)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            Create Team
          </h2>
          <button
            onClick={handleCancel}
            onMouseEnter={() => setCloseBtnHovered(true)}
            onMouseLeave={() => setCloseBtnHovered(false)}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              color: closeBtnHovered ? 'var(--color-text)' : 'var(--color-text-3)',
              backgroundColor: closeBtnHovered ? 'var(--color-nav-hover)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>
          {/* Team name */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 6,
              }}
            >
              Team Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-strong)',
                backgroundColor: 'var(--color-bg)',
                fontSize: 14,
                color: 'var(--color-text)',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(35, 131, 226, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              autoFocus
            />
          </div>

          {/* Members */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              Add Members (optional)
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {dms.map((dm) => {
                const checked = selectedIds.includes(dm.id);
                const isHovered = dm.id === hoveredMemberId;
                return (
                  <button
                    key={dm.id}
                    onClick={() => toggle(dm.id)}
                    onMouseEnter={() => setHoveredMemberId(dm.id)}
                    onMouseLeave={() => setHoveredMemberId(null)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                      backgroundColor: checked
                        ? 'var(--color-primary-light)'
                        : isHovered
                          ? 'var(--color-nav-hover)'
                          : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        flexShrink: 0,
                        border: `1.5px solid ${checked ? 'var(--color-primary)' : 'var(--color-border-strong)'}`,
                        backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {checked && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2,5 4.5,7.5 8,3" />
                        </svg>
                      )}
                    </div>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 600,
                        flexShrink: 0,
                        backgroundColor: dm.color,
                      }}
                    >
                      {dm.initials}
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{dm.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '12px 20px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={handleCancel}
            onMouseEnter={() => setCancelBtnHovered(true)}
            onMouseLeave={() => setCancelBtnHovered(false)}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--color-text-2)',
              backgroundColor: cancelBtnHovered ? 'var(--color-nav-hover)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!isValid}
            onMouseEnter={() => setCreateBtnHovered(true)}
            onMouseLeave={() => setCreateBtnHovered(false)}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 500,
              color: '#fff',
              backgroundColor: !isValid
                ? 'var(--color-bg-4)'
                : createBtnHovered
                  ? 'var(--color-primary-hover)'
                  : 'var(--color-primary)',
              border: 'none',
              cursor: isValid ? 'pointer' : 'not-allowed',
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
