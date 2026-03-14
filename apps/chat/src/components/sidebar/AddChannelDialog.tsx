import { useState } from 'react';
import { CloseIcon } from '../icons';

interface AddChannelDialogProps {
  open: boolean;
  teamName: string;
  channelName: string;
  onNameChange: (v: string) => void;
  onCancel: () => void;
  onCreate: () => void;
}

export function AddChannelDialog({
  open,
  teamName,
  channelName,
  onNameChange,
  onCancel,
  onCreate,
}: AddChannelDialogProps) {
  const [closeBtnHovered, setCloseBtnHovered] = useState(false);
  const [cancelBtnHovered, setCancelBtnHovered] = useState(false);
  const [createBtnHovered, setCreateBtnHovered] = useState(false);

  if (!open) return null;

  const isValid = channelName.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) onCreate();
  };

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
        onClick={onCancel}
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
          maxWidth: 400,
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
            Add Channel to {teamName}
          </h2>
          <button
            onClick={onCancel}
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
            Channel Name
          </label>
          <input
            type="text"
            value={channelName}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. frontend"
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
          <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 6 }}>
            Lowercase letters, numbers, and hyphens only
          </p>
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
            onClick={onCancel}
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
            onClick={onCreate}
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
            Add Channel
          </button>
        </div>
      </div>
    </div>
  );
}
