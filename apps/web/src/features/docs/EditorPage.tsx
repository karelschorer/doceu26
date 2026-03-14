import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface DocData {
  id: string;
  title: string;
  content?: string;
  updated_at: string;
}

type SaveStatus = 'saved' | 'saving' | 'unsaved';

interface ToolbarAction {
  label: string;
  command: string;
  value?: string;
  title: string;
  style?: React.CSSProperties;
}

const TOOLBAR_GROUPS: (ToolbarAction | 'sep')[][] = [
  [
    { label: 'B', command: 'bold', title: 'Bold', style: { fontWeight: 700 } },
    { label: 'I', command: 'italic', title: 'Italic', style: { fontStyle: 'italic' } },
    { label: 'U', command: 'underline', title: 'Underline', style: { textDecoration: 'underline' } },
    { label: 'S', command: 'strikeThrough', title: 'Strikethrough', style: { textDecoration: 'line-through' } },
  ],
  [
    { label: 'H1', command: 'formatBlock', value: 'h1', title: 'Heading 1', style: { fontSize: 11, fontWeight: 700 } },
    { label: 'H2', command: 'formatBlock', value: 'h2', title: 'Heading 2', style: { fontSize: 11, fontWeight: 700 } },
    { label: 'H3', command: 'formatBlock', value: 'h3', title: 'Heading 3', style: { fontSize: 11, fontWeight: 700 } },
  ],
  [
    { label: '⬅', command: 'justifyLeft', title: 'Align left' },
    { label: '≡', command: 'justifyCenter', title: 'Align center' },
    { label: '➡', command: 'justifyRight', title: 'Align right' },
  ],
  [
    { label: '• —', command: 'insertUnorderedList', title: 'Bullet list' },
    { label: '1.', command: 'insertOrderedList', title: 'Numbered list' },
    { label: '❝', command: 'formatBlock', value: 'blockquote', title: 'Quote block' },
  ],
];

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [title, setTitle] = useState('Untitled Document');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [isEmpty, setIsEmpty] = useState(true);

  // Load document
  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/documents/${id}`)
      .then((r) => r.json())
      .then((data: DocData) => {
        setTitle(data.title || 'Untitled Document');
        if (editorRef.current && data.content) {
          editorRef.current.innerHTML = data.content;
          setIsEmpty(false);
        }
      })
      .catch(() => {});
  }, [id]);

  // Focus editor on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  const saveDoc = useCallback(
    async (newTitle?: string, content?: string) => {
      if (!id) return;
      setSaveStatus('saving');
      try {
        await fetch(`/api/v1/documents/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle ?? title,
            content: content ?? editorRef.current?.innerHTML ?? '',
          }),
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('unsaved');
      }
    },
    [id, title]
  );

  const scheduleSave = useCallback(
    (newTitle?: string, content?: string) => {
      setSaveStatus('unsaved');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveDoc(newTitle, content), 1500);
    },
    [saveDoc]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    scheduleSave(val, editorRef.current?.innerHTML);
  };

  const handleEditorInput = () => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.innerText.trim();
    setIsEmpty(text.length === 0 && el.innerHTML === '');
    scheduleSave(title, el.innerHTML);
  };

  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleEditorInput();
  };

  const statusLabel: Record<SaveStatus, string> = {
    saved: 'Saved',
    saving: 'Saving...',
    unsaved: 'Unsaved changes',
  };

  const statusColor: Record<SaveStatus, string> = {
    saved: 'var(--color-success)',
    saving: 'var(--color-text-muted)',
    unsaved: 'var(--color-warning)',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--color-bg-2)',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          height: 52,
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          flexShrink: 0,
        }}
      >
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/docs')}
          style={{ gap: 4, color: 'var(--color-text-3)', flexShrink: 0 }}
        >
          ← Documents
        </button>

        <div
          style={{
            width: 1,
            height: 20,
            background: 'var(--color-border-strong)',
            flexShrink: 0,
          }}
        />

        {/* Editable title */}
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={handleTitleChange}
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--color-text)',
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            outline: 'none',
            transition: 'border-color var(--transition)',
            minWidth: 0,
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.borderColor = 'var(--color-border-strong)';
            (e.target as HTMLInputElement).style.background = 'var(--color-bg)';
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.borderColor = 'transparent';
            (e.target as HTMLInputElement).style.background = 'transparent';
          }}
        />

        {/* Autosave indicator */}
        <span
          style={{
            fontSize: 12,
            color: statusColor[saveStatus],
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {saveStatus === 'saved' && <span style={{ fontSize: 10 }}>✓</span>}
          {statusLabel[saveStatus]}
        </span>
      </div>

      {/* Rich text toolbar */}
      <div className="toolbar" style={{ flexWrap: 'wrap' }}>
        {TOOLBAR_GROUPS.map((group, gi) => (
          <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {gi > 0 && <div className="toolbar-sep" />}
            {group.map((item) => {
              if (item === 'sep') return <div key="sep" className="toolbar-sep" />;
              const action = item as ToolbarAction;
              return (
                <button
                  key={action.title}
                  className="toolbar-btn"
                  title={action.title}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent editor losing focus
                    execCmd(action.command, action.value);
                  }}
                  style={action.style}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Editor scroll container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '40px 24px',
        }}
      >
        {/* Paper */}
        <div
          style={{
            maxWidth: 720,
            margin: '0 auto',
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
            padding: '48px 64px',
            minHeight: '80vh',
            position: 'relative',
          }}
        >
          {/* Placeholder */}
          {isEmpty && (
            <div
              style={{
                position: 'absolute',
                top: '48px',
                left: '64px',
                color: 'var(--color-text-muted)',
                fontSize: 16,
                lineHeight: 1.8,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              Start typing...
            </div>
          )}

          {/* Contenteditable area */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorInput}
            onKeyDown={(e) => {
              // Tab inserts 4 spaces
              if (e.key === 'Tab') {
                e.preventDefault();
                document.execCommand('insertText', false, '    ');
              }
            }}
            style={{
              outline: 'none',
              fontSize: 16,
              lineHeight: 1.8,
              color: 'var(--color-text)',
              minHeight: '70vh',
              fontFamily: 'var(--font)',
            }}
          />
        </div>
      </div>

      {/* Editor content styles */}
      <style>{`
        [contenteditable] h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0 0.25em; line-height: 1.3; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0 0.25em; line-height: 1.3; }
        [contenteditable] h3 { font-size: 1.2em; font-weight: 600; margin: 0.5em 0 0.25em; line-height: 1.3; }
        [contenteditable] ul { padding-left: 1.5em; margin: 0.4em 0; }
        [contenteditable] ol { padding-left: 1.5em; margin: 0.4em 0; }
        [contenteditable] li { margin: 0.2em 0; }
        [contenteditable] blockquote {
          border-left: 3px solid var(--color-primary);
          margin: 0.75em 0;
          padding: 0.5em 0 0.5em 1.25em;
          color: var(--color-text-3);
          font-style: italic;
        }
        [contenteditable] p { margin: 0; }
      `}</style>
    </div>
  );
}
