import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type MouseEvent as RMouseEvent,
} from 'react';
import {
  createPresentation,
  createSlide,
  createTextElement,
  createShapeElement,
  renderSlide,
  hitTest,
} from '@doceu26/slides-engine';
import type { Presentation, SlideElement } from '@doceu26/slides-engine';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SLIDE_W = 960;
const SLIDE_H = 540;
const THUMB_W = 152;
const THUMB_H = 86;
const HANDLE_SIZE = 8;

type ResizeHandle =
  | 'nw' | 'n' | 'ne'
  | 'w'  |       'e'
  | 'sw' | 's' | 'se';

const HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

function handlePosition(
  handle: ResizeHandle,
  x: number, y: number, w: number, h: number
): { hx: number; hy: number } {
  const cx = x + w / 2;
  const cy = y + h / 2;
  switch (handle) {
    case 'nw': return { hx: x,  hy: y  };
    case 'n':  return { hx: cx, hy: y  };
    case 'ne': return { hx: x + w, hy: y  };
    case 'w':  return { hx: x,     hy: cy };
    case 'e':  return { hx: x + w, hy: cy };
    case 'sw': return { hx: x,     hy: y + h };
    case 's':  return { hx: cx,    hy: y + h };
    case 'se': return { hx: x + w, hy: y + h };
  }
}

// ---------------------------------------------------------------------------
// Types for drag state
// ---------------------------------------------------------------------------
interface DragState {
  kind: 'move' | 'resize';
  elementId: string;
  startMouseX: number;
  startMouseY: number;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  handle?: ResizeHandle;
}

// ---------------------------------------------------------------------------
// Context menu state
// ---------------------------------------------------------------------------
interface ContextMenuState {
  x: number;
  y: number;
  slideIdx: number;
}

// ---------------------------------------------------------------------------
// Shapes dropdown state
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function SlidesPage() {
  const [presentation, setPresentation] = useState<Presentation>(() =>
    createPresentation('Untitled Presentation')
  );
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [selectedElId, setSelectedElId] = useState<string | null>(null);
  const [titleEditing, setTitleEditing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const thumbCanvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [shapesMenuOpen, setShapesMenuOpen] = useState(false);
  const shapesMenuRef = useRef<HTMLDivElement>(null);
  const [bgPickerVisible, setBgPickerVisible] = useState(false);

  const activeSlide = presentation.slides[activeSlideIdx];
  const selectedEl = activeSlide?.elements.find((e) => e.id === selectedElId) ?? null;

  // ---- Scale factor: map canvas CSS pixels → slide logical pixels ----------
  const getScale = useCallback((): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    return SLIDE_W / canvas.getBoundingClientRect().width;
  }, []);

  // ---- Render main canvas --------------------------------------------------
  const renderMain = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeSlide) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderSlide(ctx, activeSlide, SLIDE_W, SLIDE_H);

    if (selectedEl) {
      const { x, y, width, height } = selectedEl.transform;
      // Dashed selection border
      ctx.save();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);

      // Resize handles
      ctx.fillStyle = '#2563eb';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      for (const handle of HANDLES) {
        const { hx, hy } = handlePosition(handle, x, y, width, height);
        const hs = HANDLE_SIZE;
        ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
        ctx.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs);
      }
      ctx.restore();
    }
  }, [activeSlide, selectedEl]);

  useEffect(() => {
    renderMain();
  }, [renderMain]);

  // ---- Render thumbnails ---------------------------------------------------
  useEffect(() => {
    for (const slide of presentation.slides) {
      const canvas = thumbCanvasRefs.current.get(slide.id);
      if (!canvas) continue;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      renderSlide(ctx, slide, THUMB_W, THUMB_H);
    }
  }, [presentation]);

  // ---- Focus title input when editing -------------------------------------
  useEffect(() => {
    if (titleEditing) titleInputRef.current?.select();
  }, [titleEditing]);

  // ---- Close menus on outside click ----------------------------------------
  useEffect(() => {
    const handler = () => {
      setContextMenu(null);
      setShapesMenuOpen(false);
      setBgPickerVisible(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // =========================================================================
  // Presentation mutations
  // =========================================================================
  const updatePresentation = useCallback(
    (updater: (p: Presentation) => Presentation) => {
      setPresentation((p) => updater(p));
    },
    []
  );

  const updateSlide = useCallback(
    (slideIdx: number, updater: (s: typeof activeSlide) => typeof activeSlide) => {
      updatePresentation((p) => {
        const slides = [...p.slides];
        slides[slideIdx] = updater(slides[slideIdx]);
        return { ...p, slides };
      });
    },
    [updatePresentation]
  );

  const updateElement = useCallback(
    (elId: string, updater: (el: SlideElement) => SlideElement) => {
      updateSlide(activeSlideIdx, (slide) => ({
        ...slide,
        elements: slide.elements.map((el) => (el.id === elId ? updater(el) : el)),
      }));
    },
    [updateSlide, activeSlideIdx]
  );

  // =========================================================================
  // Slide management
  // =========================================================================
  const addSlide = () => {
    const newSlide = createSlide();
    updatePresentation((p) => ({ ...p, slides: [...p.slides, newSlide] }));
    setActiveSlideIdx(presentation.slides.length);
    setSelectedElId(null);
  };

  const duplicateSlide = (idx: number) => {
    updatePresentation((p) => {
      const src = p.slides[idx];
      const clone = {
        ...src,
        id: crypto.randomUUID(),
        elements: src.elements.map((el) => ({ ...el, id: crypto.randomUUID() })),
      };
      const slides = [...p.slides];
      slides.splice(idx + 1, 0, clone);
      return { ...p, slides };
    });
    setActiveSlideIdx(idx + 1);
    setContextMenu(null);
  };

  const deleteSlide = (idx: number) => {
    if (presentation.slides.length <= 1) return;
    updatePresentation((p) => {
      const slides = p.slides.filter((_, i) => i !== idx);
      return { ...p, slides };
    });
    setActiveSlideIdx(Math.min(idx, presentation.slides.length - 2));
    setSelectedElId(null);
    setContextMenu(null);
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= presentation.slides.length) return;
    updatePresentation((p) => {
      const slides = [...p.slides];
      [slides[idx], slides[target]] = [slides[target], slides[idx]];
      return { ...p, slides };
    });
    setActiveSlideIdx(target);
    setContextMenu(null);
  };

  // =========================================================================
  // Element insertion
  // =========================================================================
  const insertText = () => {
    const el = createTextElement(160, 140);
    updateSlide(activeSlideIdx, (slide) => ({
      ...slide,
      elements: [...slide.elements, el],
    }));
    setSelectedElId(el.id);
  };

  const insertShape = (shape: 'rect' | 'ellipse' | 'arrow') => {
    const el = createShapeElement(shape, 200, 160);
    updateSlide(activeSlideIdx, (slide) => ({
      ...slide,
      elements: [...slide.elements, el],
    }));
    setSelectedElId(el.id);
    setShapesMenuOpen(false);
  };

  const insertImagePlaceholder = () => {
    updateSlide(activeSlideIdx, (slide) => ({
      ...slide,
      elements: [
        ...slide.elements,
        {
          id: crypto.randomUUID(),
          type: 'image' as const,
          transform: { x: 200, y: 150, width: 240, height: 160, rotation: 0 },
          src: '',
          alt: 'Image placeholder',
        },
      ],
    }));
  };

  const deleteSelected = useCallback(() => {
    if (!selectedElId) return;
    updateSlide(activeSlideIdx, (slide) => ({
      ...slide,
      elements: slide.elements.filter((el) => el.id !== selectedElId),
    }));
    setSelectedElId(null);
  }, [selectedElId, updateSlide, activeSlideIdx]);

  const bringForward = () => {
    if (!selectedElId) return;
    updateSlide(activeSlideIdx, (slide) => {
      const idx = slide.elements.findIndex((e) => e.id === selectedElId);
      if (idx < 0 || idx === slide.elements.length - 1) return slide;
      const els = [...slide.elements];
      [els[idx], els[idx + 1]] = [els[idx + 1], els[idx]];
      return { ...slide, elements: els };
    });
  };

  const sendBackward = () => {
    if (!selectedElId) return;
    updateSlide(activeSlideIdx, (slide) => {
      const idx = slide.elements.findIndex((e) => e.id === selectedElId);
      if (idx <= 0) return slide;
      const els = [...slide.elements];
      [els[idx], els[idx - 1]] = [els[idx - 1], els[idx]];
      return { ...slide, elements: els };
    });
  };

  // =========================================================================
  // Canvas hit test + handle detection
  // =========================================================================
  const hitHandle = (
    px: number, py: number
  ): ResizeHandle | null => {
    if (!selectedEl) return null;
    const { x, y, width, height } = selectedEl.transform;
    for (const handle of HANDLES) {
      const { hx, hy } = handlePosition(handle, x, y, width, height);
      const hs = HANDLE_SIZE;
      if (
        px >= hx - hs && px <= hx + hs &&
        py >= hy - hs && py <= hy + hs
      ) {
        return handle;
      }
    }
    return null;
  };

  // =========================================================================
  // Pointer events on canvas
  // =========================================================================
  const handleCanvasMouseDown = (e: RMouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const scale = getScale();
    const rect = canvasRef.current!.getBoundingClientRect();
    const px = (e.clientX - rect.left) * scale;
    const py = (e.clientY - rect.top) * scale;

    // Check resize handles first
    const resizeHandle = hitHandle(px, py);
    if (resizeHandle && selectedEl) {
      dragRef.current = {
        kind: 'resize',
        elementId: selectedEl.id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startX: selectedEl.transform.x,
        startY: selectedEl.transform.y,
        startW: selectedEl.transform.width,
        startH: selectedEl.transform.height,
        handle: resizeHandle,
      };
      return;
    }

    // Hit test elements
    const hitId = hitTest(activeSlide, px, py);
    setSelectedElId(hitId);

    if (hitId) {
      const el = activeSlide.elements.find((el) => el.id === hitId)!;
      dragRef.current = {
        kind: 'move',
        elementId: hitId,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startX: el.transform.x,
        startY: el.transform.y,
        startW: el.transform.width,
        startH: el.transform.height,
      };
    }
  };

  const handleCanvasMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const scale = getScale();
      const dx = (e.clientX - drag.startMouseX) * scale;
      const dy = (e.clientY - drag.startMouseY) * scale;

      updateElement(drag.elementId, (el) => {
        const t = { ...el.transform };
        if (drag.kind === 'move') {
          t.x = drag.startX + dx;
          t.y = drag.startY + dy;
        } else if (drag.kind === 'resize' && drag.handle) {
          const h = drag.handle;
          const left   = h.includes('w');
          const right  = h.includes('e');
          const top    = h.startsWith('n');
          const bottom = h.startsWith('s');

          if (right)  t.width  = Math.max(20, drag.startW + dx);
          if (bottom) t.height = Math.max(20, drag.startH + dy);
          if (left) {
            t.width = Math.max(20, drag.startW - dx);
            t.x = drag.startX + drag.startW - t.width;
          }
          if (top) {
            t.height = Math.max(20, drag.startH - dy);
            t.y = drag.startY + drag.startH - t.height;
          }
        }
        return { ...el, transform: t };
      });
    },
    [getScale, updateElement]
  );

  const handleCanvasMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleCanvasMouseMove);
    window.addEventListener('mouseup', handleCanvasMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleCanvasMouseMove);
      window.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  }, [handleCanvasMouseMove, handleCanvasMouseUp]);

  // =========================================================================
  // Double-click → edit text
  // =========================================================================
  const handleCanvasDblClick = (e: RMouseEvent<HTMLCanvasElement>) => {
    const scale = getScale();
    const rect = canvasRef.current!.getBoundingClientRect();
    const px = (e.clientX - rect.left) * scale;
    const py = (e.clientY - rect.top) * scale;
    const hitId = hitTest(activeSlide, px, py);
    if (!hitId) return;
    const el = activeSlide.elements.find((el) => el.id === hitId);
    if (!el || el.type !== 'text') return;
    const newText = window.prompt('Edit text:', el.content);
    if (newText !== null) {
      updateElement(hitId, (el) => ({ ...el, content: newText } as SlideElement));
    }
  };

  // =========================================================================
  // Keyboard
  // =========================================================================
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (document.activeElement === canvasRef.current || (document.activeElement as HTMLElement)?.closest?.('.slides-canvas-wrap')) {
        deleteSelected();
      }
    }
    if (e.key === 'Escape') {
      setSelectedElId(null);
    }
  };

  // =========================================================================
  // Properties panel helpers
  // =========================================================================
  const setTextProp = <K extends keyof Omit<Extract<SlideElement, { type: 'text' }>, 'id' | 'type' | 'transform'>>(
    key: K,
    value: Extract<SlideElement, { type: 'text' }>[K]
  ) => {
    if (!selectedElId) return;
    updateElement(selectedElId, (el) => {
      if (el.type !== 'text') return el;
      return { ...el, [key]: value };
    });
  };

  const setShapeProp = <K extends keyof Omit<Extract<SlideElement, { type: 'shape' }>, 'id' | 'type' | 'transform'>>(
    key: K,
    value: Extract<SlideElement, { type: 'shape' }>[K]
  ) => {
    if (!selectedElId) return;
    updateElement(selectedElId, (el) => {
      if (el.type !== 'shape') return el;
      return { ...el, [key]: value };
    });
  };

  const setTransformProp = (key: keyof import('@doceu26/slides-engine').Transform, value: number) => {
    if (!selectedElId) return;
    updateElement(selectedElId, (el) => ({
      ...el,
      transform: { ...el.transform, [key]: value },
    }));
  };

  // =========================================================================
  // Toolbar formatting for text
  // =========================================================================
  const textEl = selectedEl?.type === 'text' ? selectedEl : null;
  const shapeEl = selectedEl?.type === 'shape' ? selectedEl : null;

  const toggleBold = () => {
    if (!textEl) return;
    setTextProp('fontWeight', textEl.fontWeight === 'bold' ? 'normal' : 'bold');
  };

  // =========================================================================
  // Slide right-click context menu
  // =========================================================================
  const handleSlideContextMenu = (e: RMouseEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, slideIdx: idx });
  };

  // =========================================================================
  // Cursor style on canvas
  // =========================================================================
  const [canvasCursor, setCanvasCursor] = useState<string>('default');

  const handleCanvasMouseMoveForCursor = (e: RMouseEvent<HTMLCanvasElement>) => {
    const scale = getScale();
    const rect = canvasRef.current!.getBoundingClientRect();
    const px = (e.clientX - rect.left) * scale;
    const py = (e.clientY - rect.top) * scale;

    if (hitHandle(px, py)) {
      setCanvasCursor('nwse-resize');
    } else if (hitTest(activeSlide, px, py)) {
      setCanvasCursor(dragRef.current ? 'grabbing' : 'grab');
    } else {
      setCanvasCursor('default');
    }
  };

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--color-bg)', fontFamily: 'var(--font)' }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* ------------------------------------------------------------------ */}
      {/* HEADER BAR                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="page-header" style={{ justifyContent: 'flex-start', gap: '8px', padding: '0 16px' }}>
        {/* Editable title */}
        {titleEditing ? (
          <input
            ref={titleInputRef}
            value={presentation.title}
            onChange={(e) =>
              updatePresentation((p) => ({ ...p, title: e.target.value }))
            }
            onBlur={() => setTitleEditing(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setTitleEditing(false); }}
            style={{
              fontSize: '15px',
              fontWeight: 600,
              border: '1px solid var(--color-primary)',
              borderRadius: 'var(--radius-xs)',
              outline: 'none',
              padding: '2px 6px',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              boxShadow: '0 0 0 3px rgba(37,99,235,0.1)',
              minWidth: '160px',
            }}
          />
        ) : (
          <span
            onClick={() => setTitleEditing(true)}
            style={{
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'text',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid transparent',
              transition: 'border-color var(--transition)',
              userSelect: 'none',
            }}
            title="Click to rename"
          >
            {presentation.title}
          </span>
        )}

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginRight: '4px' }}>
          Saved ✓
        </span>
        <button className="btn btn-secondary btn-sm">Share</button>
        <button className="btn btn-primary btn-sm" style={{ gap: '5px' }}>
          <span style={{ fontSize: '11px' }}>▶</span> Present
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIBBON TOOLBAR                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="toolbar" style={{ gap: '2px', padding: '4px 12px', flexWrap: 'wrap' }}>
        {/* INSERT section */}
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginRight: '4px', fontWeight: 500, letterSpacing: '0.04em' }}>INSERT</span>

        <button className="toolbar-btn" onClick={insertText} title="Text Box" style={{ width: 'auto', padding: '0 8px', gap: '4px' }}>
          <span style={{ fontSize: '14px' }}>T</span>
          <span style={{ fontSize: '11px' }}>Text Box</span>
        </button>

        {/* Shapes dropdown */}
        <div style={{ position: 'relative' }} ref={shapesMenuRef} onMouseDown={(e) => e.stopPropagation()}>
          <button
            className="toolbar-btn"
            onClick={() => setShapesMenuOpen((v) => !v)}
            title="Shapes"
            style={{ width: 'auto', padding: '0 8px', gap: '4px' }}
          >
            <span style={{ fontSize: '13px' }}>⬛</span>
            <span style={{ fontSize: '11px' }}>Shapes</span>
            <span style={{ fontSize: '9px', opacity: 0.6 }}>▾</span>
          </button>
          {shapesMenuOpen && (
            <div className="dropdown" style={{ top: '100%', left: 0, marginTop: '4px', minWidth: '130px' }}>
              <button className="dropdown-item" onClick={() => insertShape('rect')}>
                <span>▭</span> Rectangle
              </button>
              <button className="dropdown-item" onClick={() => insertShape('ellipse')}>
                <span>○</span> Ellipse
              </button>
              <button className="dropdown-item" onClick={() => insertShape('arrow')}>
                <span>→</span> Arrow
              </button>
            </div>
          )}
        </div>

        <button className="toolbar-btn" onClick={insertImagePlaceholder} title="Image placeholder" style={{ width: 'auto', padding: '0 8px', gap: '4px' }}>
          <span style={{ fontSize: '13px' }}>🖼</span>
          <span style={{ fontSize: '11px' }}>Image</span>
        </button>

        <div className="toolbar-sep" />

        {/* FORMAT section */}
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginRight: '4px', fontWeight: 500, letterSpacing: '0.04em' }}>FORMAT</span>

        {/* Font family */}
        <select
          className="input"
          value={textEl?.color ? 'sans-serif' : 'sans-serif'}
          disabled={!textEl}
          style={{ width: '110px', height: '28px', fontSize: '12px', padding: '0 6px' }}
          title="Font family"
        >
          <option value="sans-serif">Sans-serif</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
        </select>

        {/* Font size */}
        <input
          type="number"
          className="input"
          min={8}
          max={200}
          value={textEl?.fontSize ?? 24}
          disabled={!textEl}
          onChange={(e) => setTextProp('fontSize', Number(e.target.value))}
          style={{ width: '52px', height: '28px', fontSize: '12px', padding: '0 6px', textAlign: 'center' }}
          title="Font size"
        />

        <button
          className={`toolbar-btn${textEl?.fontWeight === 'bold' ? ' active' : ''}`}
          onClick={toggleBold}
          disabled={!textEl}
          title="Bold"
          style={{ fontWeight: 700 }}
        >
          B
        </button>
        <button
          className="toolbar-btn"
          disabled={!textEl}
          title="Italic"
          style={{ fontStyle: 'italic' }}
        >
          I
        </button>
        <button
          className="toolbar-btn"
          disabled={!textEl}
          title="Underline"
          style={{ textDecoration: 'underline' }}
        >
          U
        </button>

        <div className="toolbar-sep" />

        {/* ARRANGE section */}
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginRight: '4px', fontWeight: 500, letterSpacing: '0.04em' }}>ARRANGE</span>

        <button
          className="toolbar-btn"
          onClick={bringForward}
          disabled={!selectedEl}
          title="Bring Forward"
          style={{ width: 'auto', padding: '0 8px', fontSize: '11px' }}
        >
          ↑ Forward
        </button>
        <button
          className="toolbar-btn"
          onClick={sendBackward}
          disabled={!selectedEl}
          title="Send Backward"
          style={{ width: 'auto', padding: '0 8px', fontSize: '11px' }}
        >
          ↓ Backward
        </button>

        <div className="toolbar-sep" />

        {/* BACKGROUND */}
        <div style={{ position: 'relative' }} onMouseDown={(e) => e.stopPropagation()}>
          <button
            className="toolbar-btn"
            onClick={() => setBgPickerVisible((v) => !v)}
            title="Slide background"
            style={{ width: 'auto', padding: '0 8px', gap: '6px', fontSize: '11px' }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '14px',
                height: '14px',
                borderRadius: '2px',
                background: activeSlide?.background ?? '#fff',
                border: '1px solid var(--color-border-strong)',
                flexShrink: 0,
              }}
            />
            Background
          </button>
          {bgPickerVisible && (
            <div
              className="dropdown"
              style={{ top: '100%', left: 0, marginTop: '4px', padding: '10px', width: '200px' }}
            >
              <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
                Slide background color
              </label>
              <input
                type="color"
                value={activeSlide?.background ?? '#ffffff'}
                onChange={(e) =>
                  updateSlide(activeSlideIdx, (s) => ({ ...s, background: e.target.value }))
                }
                style={{ width: '100%', height: '36px', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-xs)' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN WORK AREA                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ---------------------------------------------------------------- */}
        {/* LEFT SLIDE PANEL                                                  */}
        {/* ---------------------------------------------------------------- */}
        <div
          style={{
            width: '180px',
            borderRight: '1px solid var(--color-border)',
            background: '#f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <div style={{ padding: '8px 8px 4px', flex: 1 }}>
            {presentation.slides.map((slide, i) => (
              <div
                key={slide.id}
                onClick={() => { setActiveSlideIdx(i); setSelectedElId(null); }}
                onContextMenu={(e) => handleSlideContextMenu(e, i)}
                style={{
                  marginBottom: '8px',
                  border: `2px solid ${i === activeSlideIdx ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: '#fff',
                  boxShadow: i === activeSlideIdx ? '0 0 0 1px var(--color-primary)' : 'none',
                  transition: 'border-color 120ms ease, box-shadow 120ms ease',
                }}
              >
                {/* Mini canvas thumbnail */}
                <canvas
                  ref={(el) => {
                    if (el) thumbCanvasRefs.current.set(slide.id, el);
                    else thumbCanvasRefs.current.delete(slide.id);
                  }}
                  width={THUMB_W}
                  height={THUMB_H}
                  style={{ display: 'block', width: '100%', height: 'auto', pointerEvents: 'none' }}
                />
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: '11px',
                    color: i === activeSlideIdx ? 'var(--color-primary-text)' : 'var(--color-text-muted)',
                    padding: '3px 0 4px',
                    background: i === activeSlideIdx ? 'var(--color-primary-light)' : 'transparent',
                    fontWeight: i === activeSlideIdx ? 600 : 400,
                  }}
                >
                  {i + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Add slide button */}
          <div style={{ padding: '4px 8px 8px' }}>
            <button
              onClick={addSlide}
              style={{
                width: '100%',
                padding: '7px 0',
                border: '2px dashed var(--color-border-strong)',
                borderRadius: '4px',
                background: 'transparent',
                color: 'var(--color-text-3)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'border-color var(--transition), color var(--transition)',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary-text)';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border-strong)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-3)';
              }}
            >
              + Add Slide
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* CENTER CANVAS AREA                                                */}
        {/* ---------------------------------------------------------------- */}
        <div
          className="slides-canvas-wrap"
          ref={canvasWrapRef}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#6b7280',
            overflow: 'hidden',
            position: 'relative',
          }}
          onClick={(e) => {
            // Deselect when clicking the background (not the canvas)
            if (e.target === canvasWrapRef.current) setSelectedElId(null);
          }}
        >
          <canvas
            ref={canvasRef}
            width={SLIDE_W}
            height={SLIDE_H}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMoveForCursor}
            onDoubleClick={handleCanvasDblClick}
            style={{
              background: '#ffffff',
              boxShadow: 'var(--shadow-xl)',
              cursor: canvasCursor,
              display: 'block',
              maxWidth: 'calc(100% - 48px)',
              maxHeight: 'calc(100% - 48px)',
              aspectRatio: `${SLIDE_W} / ${SLIDE_H}`,
            }}
          />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* RIGHT PROPERTIES PANEL                                            */}
        {/* ---------------------------------------------------------------- */}
        <div
          style={{
            width: '220px',
            borderLeft: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            flexShrink: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {selectedEl ? (
            <div style={{ padding: '12px' }}>
              {/* ---- Text element properties ---- */}
              {textEl && (
                <>
                  <div className="sidebar-header" style={{ padding: '0 0 8px', marginBottom: '10px' }}>Text</div>

                  <div className="form-group">
                    <label className="form-label">Font size</label>
                    <input
                      type="number"
                      className="input"
                      min={8} max={200}
                      value={textEl.fontSize}
                      onChange={(e) => setTextProp('fontSize', Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Style</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className={`toolbar-btn${textEl.fontWeight === 'bold' ? ' active' : ''}`}
                        onClick={toggleBold}
                        style={{ fontWeight: 700, width: '36px', height: '28px' }}
                      >
                        B
                      </button>
                      <button className="toolbar-btn" style={{ fontStyle: 'italic', width: '36px', height: '28px' }}>I</button>
                      <button className="toolbar-btn" style={{ textDecoration: 'underline', width: '36px', height: '28px' }}>U</button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alignment</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                          key={align}
                          className={`toolbar-btn${textEl.align === align ? ' active' : ''}`}
                          onClick={() => setTextProp('align', align)}
                          style={{ width: '36px', height: '28px', fontSize: '12px' }}
                          title={align}
                        >
                          {align === 'left' ? '≡' : align === 'center' ? '☰' : '≡'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Text color</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={textEl.color}
                        onChange={(e) => setTextProp('color', e.target.value)}
                        style={{ width: '36px', height: '28px', border: '1px solid var(--color-border-strong)', borderRadius: '4px', cursor: 'pointer', padding: '2px' }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
                        {textEl.color}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* ---- Shape element properties ---- */}
              {shapeEl && (
                <>
                  <div className="sidebar-header" style={{ padding: '0 0 8px', marginBottom: '10px' }}>Shape</div>

                  <div className="form-group">
                    <label className="form-label">Fill color</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={shapeEl.fill}
                        onChange={(e) => setShapeProp('fill', e.target.value)}
                        style={{ width: '36px', height: '28px', border: '1px solid var(--color-border-strong)', borderRadius: '4px', cursor: 'pointer', padding: '2px' }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
                        {shapeEl.fill}
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stroke color</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={shapeEl.stroke}
                        onChange={(e) => setShapeProp('stroke', e.target.value)}
                        style={{ width: '36px', height: '28px', border: '1px solid var(--color-border-strong)', borderRadius: '4px', cursor: 'pointer', padding: '2px' }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
                        {shapeEl.stroke}
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stroke width</label>
                    <input
                      type="number"
                      className="input"
                      min={0} max={20}
                      value={shapeEl.strokeWidth}
                      onChange={(e) => setShapeProp('strokeWidth', Number(e.target.value))}
                    />
                  </div>
                </>
              )}

              {/* ---- Position & Size (all elements) ---- */}
              <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '12px', paddingTop: '12px' }}>
                <div className="sidebar-header" style={{ padding: '0 0 8px' }}>Position & Size</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {(
                    [
                      { key: 'x', label: 'X' },
                      { key: 'y', label: 'Y' },
                      { key: 'width', label: 'W' },
                      { key: 'height', label: 'H' },
                    ] as const
                  ).map(({ key, label }) => (
                    <div key={key}>
                      <label className="form-label">{label}</label>
                      <input
                        type="number"
                        className="input"
                        value={Math.round(selectedEl.transform[key])}
                        onChange={(e) => setTransformProp(key, Number(e.target.value))}
                        style={{ fontSize: '12px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* No selection → slide background */
            <div style={{ padding: '12px' }}>
              <div className="sidebar-header" style={{ padding: '0 0 8px', marginBottom: '10px' }}>Slide</div>
              <div className="form-group">
                <label className="form-label">Background color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={activeSlide?.background ?? '#ffffff'}
                    onChange={(e) =>
                      updateSlide(activeSlideIdx, (s) => ({ ...s, background: e.target.value }))
                    }
                    style={{ width: '36px', height: '28px', border: '1px solid var(--color-border-strong)', borderRadius: '4px', cursor: 'pointer', padding: '2px' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
                    {activeSlide?.background ?? '#ffffff'}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                Click an element on the slide to edit its properties.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SLIDE CONTEXT MENU                                                   */}
      {/* ------------------------------------------------------------------ */}
      {contextMenu && (
        <div
          className="dropdown"
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 600 }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button className="dropdown-item" onClick={() => duplicateSlide(contextMenu.slideIdx)}>
            Duplicate slide
          </button>
          <button
            className="dropdown-item"
            onClick={() => moveSlide(contextMenu.slideIdx, -1)}
            disabled={contextMenu.slideIdx === 0}
          >
            Move up
          </button>
          <button
            className="dropdown-item"
            onClick={() => moveSlide(contextMenu.slideIdx, 1)}
            disabled={contextMenu.slideIdx === presentation.slides.length - 1}
          >
            Move down
          </button>
          <button
            className="dropdown-item danger"
            onClick={() => deleteSlide(contextMenu.slideIdx)}
            disabled={presentation.slides.length <= 1}
          >
            Delete slide
          </button>
        </div>
      )}
    </div>
  );
}
