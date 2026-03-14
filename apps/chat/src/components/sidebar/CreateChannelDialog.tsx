import { useState } from 'react';
import { CloseIcon } from '../icons';

interface CreateChannelDialogProps {
  open: boolean;
  channelName: string;
  isPrivate: boolean;
  onNameChange: (v: string) => void;
  onPrivateChange: (v: boolean) => void;
  onCancel: () => void;
  onCreate: () => void;
}

export const CreateChannelDialog: React.FC<CreateChannelDialogProps> = ({
  open,
  channelName,
  isPrivate,
  onNameChange,
  onPrivateChange,
  onCancel,
  onCreate,
}) => {
  const [closeBtnHovered, setCloseBtnHovered] = useState(false);
  const [cancelBtnHovered, setCancelBtnHovered] = useState(false);
  const [createBtnHovered, setCreateBtnHovered] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  if (!open) return null;

  const handleNameChange = (v: string) => {
    onNameChange(v.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const isValid = channelName.length >= 2;

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
        onClick={onCancel}
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
            Create Channel
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
              transition: 'color 0.15s, background-color 0.15s',
            }}
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Channel name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--color-text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Channel Name
            </label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. design-team"
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${inputFocused ? 'var(--color-primary)' : 'var(--color-border)'}`,
                backgroundColor: 'var(--color-bg)',
                fontSize: 14,
                color: 'var(--color-text)',
                outline: 'none',
                transition: 'border-color 0.15s',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
              Lowercase letters, numbers, and hyphens only
            </span>
          </div>

          {/* Private toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>
                Private Channel
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
                Only invited members can access
              </div>
            </div>
            <button
              onClick={() => onPrivateChange(!isPrivate)}
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                position: 'relative',
                backgroundColor: isPrivate ? 'var(--color-primary)' : 'var(--color-bg-4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: isPrivate ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  transition: 'left 0.2s',
                }}
              />
            </button>
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
              transition: 'background-color 0.15s',
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
              transition: 'background-color 0.15s',
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};
