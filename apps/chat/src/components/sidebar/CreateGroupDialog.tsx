import { useState } from 'react';
import type { DM } from '../../types';
import { CloseIcon } from '../icons';

interface CreateGroupDialogProps {
  open: boolean;
  dms: DM[];
  onCancel: () => void;
  onCreate: (memberIds: string[]) => void;
}

export const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({
  open,
  dms,
  onCancel,
  onCreate,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [closeBtnHovered, setCloseBtnHovered] = useState(false);
  const [cancelBtnHovered, setCancelBtnHovered] = useState(false);
  const [createBtnHovered, setCreateBtnHovered] = useState(false);
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [hoveredTagId, setHoveredTagId] = useState<string | null>(null);

  if (!open) return null;

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    onCreate(selectedIds);
    setSelectedIds([]);
  };

  const handleCancel = () => {
    setSelectedIds([]);
    onCancel();
  };

  const isValid = selectedIds.length >= 2;

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
      {/* Backdrop */}
      <div
        onClick={handleCancel}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Dialog card */}
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
            Create Group
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
              transition: 'color 0.15s, background-color 0.15s',
            }}
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Selected tags */}
        {selectedIds.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              padding: '12px 20px 0',
            }}
          >
            {selectedIds.map((id) => {
              const dm = dms.find((d) => d.id === id);
              if (!dm) return null;
              return (
                <span
                  key={id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 12,
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary-text)',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {dm.name}
                  <button
                    onClick={() => toggle(id)}
                    onMouseEnter={() => setHoveredTagId(id)}
                    onMouseLeave={() => setHoveredTagId(null)}
                    style={{
                      width: 14,
                      height: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      backgroundColor:
                        hoveredTagId === id ? 'rgba(35, 131, 226, 0.2)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      color: 'inherit',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <CloseIcon size={10} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Member list */}
        <div style={{ padding: '12px 20px', maxHeight: 256, overflowY: 'auto' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}
          >
            Select Members ({selectedIds.length} selected)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {dms.map((dm) => {
              const checked = selectedIds.includes(dm.id);
              const isMemberHovered = dm.id === hoveredMemberId;
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
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    backgroundColor: checked
                      ? 'var(--color-primary-light)'
                      : isMemberHovered
                      ? 'var(--color-nav-hover)'
                      : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                    fontFamily: 'inherit',
                  }}
                >
                  {/* Checkbox */}
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
                      transition: 'background-color 0.15s, border-color 0.15s',
                    }}
                  >
                    {checked && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="2,5 4.5,7.5 8,3" />
                      </svg>
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    style={{
                      width: 24,
                      height: 24,
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

                  <span
                    style={{
                      fontSize: 13,
                      color: 'var(--color-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {dm.name}
                  </span>

                  {/* Online indicator */}
                  {dm.online && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-success)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
            {isValid ? `${selectedIds.length} members selected` : 'Select at least 2 members'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                transition: 'background-color 0.15s',
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
                transition: 'background-color 0.15s',
              }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
