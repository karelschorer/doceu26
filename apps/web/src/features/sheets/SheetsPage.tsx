import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Workbook } from '@doceu26/sheets-engine';

const ROWS = 200;
const COLS = 26;
const COL_WIDTH = 100;
const ROW_HEIGHT = 24;
const ROW_NUM_WIDTH = 48;

type CellCoord = { row: number; col: number };
type NumberFormat = 'General' | 'Number' | 'Currency' | 'Percent' | 'Date';

function colLabel(c: number): string {
  return String.fromCharCode(65 + c);
}

function cellRef(row: number, col: number): string {
  return `${colLabel(col)}${row + 1}`;
}

function formatValue(raw: string, computed: { type: string; value: unknown; error?: string | null }, fmt: NumberFormat): string {
  if (computed.error) return computed.error;
  if (computed.type === 'empty') return '';
  const val = computed.value;
  if (fmt === 'General' || typeof val !== 'number') return String(val ?? '');
  switch (fmt) {
    case 'Number':
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'Currency':
      return val.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
    case 'Percent':
      return (val * 100).toFixed(2) + '%';
    case 'Date': {
      // Treat numeric value as Excel serial date
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString();
    }
    default:
      return String(val ?? '');
  }
}

function isNumericValue(computed: { type: string; value: unknown; error?: string | null }): boolean {
  return computed.type === 'number' || (computed.type !== 'empty' && !computed.error && typeof computed.value === 'number');
}

export function SheetsPage() {
  const [workbook] = useState(() => new Workbook());

  // A version counter so we can force re-renders after setCell
  const [version, setVersion] = useState(0);
  const bumpVersion = useCallback(() => setVersion((v) => v + 1), []);

  const [title, setTitle] = useState('Untitled spreadsheet');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [numberFormat, setNumberFormat] = useState<NumberFormat>('General');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);

  const [selected, setSelected] = useState<CellCoord | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  // Track the pre-edit value so Escape can restore it
  const preEditValueRef = useRef('');

  // Track selected column (for header highlight)
  const [selectedCol, setSelectedCol] = useState<number | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const cellInputRef = useRef<HTMLInputElement>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Keep formula bar in sync when selection changes (not editing)
  useEffect(() => {
    if (selected && !isEditing) {
      const cell = workbook.getCell(selected.row, selected.col);
      setEditValue(cell?.rawValue ?? '');
    }
  }, [selected, isEditing, version, workbook]);

  // Focus grid container on mount
  useEffect(() => {
    gridRef.current?.focus();
  }, []);

  // When entering edit mode inside a cell, focus the inline input
  useLayoutEffect(() => {
    if (isEditing) {
      cellInputRef.current?.focus();
    }
  }, [isEditing, selected]);

  const getRawValue = useCallback((row: number, col: number): string => {
    return workbook.getCell(row, col)?.rawValue ?? '';
  }, [workbook, version]); // eslint-disable-line react-hooks/exhaustive-deps

  const getComputed = useCallback((row: number, col: number) => {
    const cell = workbook.getCell(row, col);
    if (!cell) return { type: 'empty', value: '', error: null };
    return cell.computed;
  }, [workbook, version]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitCell = useCallback((row: number, col: number, value: string) => {
    workbook.setCell(row, col, value);
    bumpVersion();
  }, [workbook, bumpVersion]);

  const finishEditing = useCallback((commit: boolean) => {
    if (!selected) return;
    if (commit) {
      commitCell(selected.row, selected.col, editValue);
    } else {
      // Escape: restore pre-edit value in the bar
      setEditValue(preEditValueRef.current);
    }
    setIsEditing(false);
    // Return focus to grid
    gridRef.current?.focus();
  }, [selected, editValue, commitCell]);

  const selectCell = useCallback((row: number, col: number, keepEditing = false) => {
    const clampedRow = Math.max(0, Math.min(ROWS - 1, row));
    const clampedCol = Math.max(0, Math.min(COLS - 1, col));

    if (isEditing && selected && !keepEditing) {
      commitCell(selected.row, selected.col, editValue);
      setIsEditing(false);
    }

    setSelected({ row: clampedRow, col: clampedCol });
    setSelectedCol(null);
    const raw = workbook.getCell(clampedRow, clampedCol)?.rawValue ?? '';
    setEditValue(raw);
    preEditValueRef.current = raw;
  }, [isEditing, selected, editValue, commitCell, workbook]);

  const enterEditMode = useCallback((replaceWith?: string) => {
    if (!selected) return;
    preEditValueRef.current = workbook.getCell(selected.row, selected.col)?.rawValue ?? '';
    if (replaceWith !== undefined) {
      setEditValue(replaceWith);
    }
    setIsEditing(true);
  }, [selected, workbook]);

  // Grid keydown — handles navigation and triggers edit mode
  const handleGridKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return; // Cell input handles keys while editing

    if (!selected) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab'].includes(e.key)) {
        setSelected({ row: 0, col: 0 });
        setSelectedCol(null);
        setEditValue(workbook.getCell(0, 0)?.rawValue ?? '');
        e.preventDefault();
      }
      return;
    }

    const { row, col } = selected;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        selectCell(row - 1, col);
        break;
      case 'ArrowDown':
        e.preventDefault();
        selectCell(row + 1, col);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        selectCell(row, col - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        selectCell(row, col + 1);
        break;
      case 'Enter':
        e.preventDefault();
        selectCell(row + 1, col);
        break;
      case 'Tab':
        e.preventDefault();
        selectCell(row, col + 1);
        break;
      case 'F2':
        e.preventDefault();
        enterEditMode();
        break;
      case 'Backspace':
      case 'Delete':
        e.preventDefault();
        commitCell(row, col, '');
        setEditValue('');
        break;
      case 'Escape':
        setSelected(null);
        setSelectedCol(null);
        setEditValue('');
        break;
      default:
        // Printable character — start edit and replace content
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          enterEditMode(e.key);
        }
        break;
    }
  }, [isEditing, selected, selectCell, enterEditMode, commitCell, workbook]);

  // Inline cell input keydown
  const handleCellInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!selected) return;
    const { row, col } = selected;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        finishEditing(true);
        selectCell(row + 1, col);
        break;
      case 'Tab':
        e.preventDefault();
        finishEditing(true);
        selectCell(row, col + 1);
        break;
      case 'Escape':
        e.preventDefault();
        finishEditing(false);
        break;
      case 'ArrowUp':
        e.preventDefault();
        finishEditing(true);
        selectCell(row - 1, col);
        break;
      case 'ArrowDown':
        e.preventDefault();
        finishEditing(true);
        selectCell(row + 1, col);
        break;
    }
  }, [selected, finishEditing, selectCell]);

  // Formula bar input keydown
  const handleFormulaKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!selected) return;
    const { row, col } = selected;

    if (e.key === 'Enter') {
      e.preventDefault();
      commitCell(row, col, editValue);
      setIsEditing(false);
      selectCell(row + 1, col);
      gridRef.current?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      const raw = workbook.getCell(row, col)?.rawValue ?? '';
      setEditValue(raw);
      setIsEditing(false);
      gridRef.current?.focus();
    } else {
      // Typing in formula bar should sync isEditing state
      setIsEditing(true);
    }
  }, [selected, editValue, commitCell, selectCell, workbook]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (isEditing && selected && (selected.row !== row || selected.col !== col)) {
      commitCell(selected.row, selected.col, editValue);
    }
    selectCell(row, col);
    gridRef.current?.focus();
  }, [isEditing, selected, editValue, commitCell, selectCell]);

  const handleCellDoubleClick = useCallback((row: number, col: number) => {
    selectCell(row, col);
    enterEditMode();
  }, [selectCell, enterEditMode]);

  const handleColHeaderClick = useCallback((col: number) => {
    if (isEditing && selected) {
      commitCell(selected.row, selected.col, editValue);
      setIsEditing(false);
    }
    setSelected(null);
    setSelectedCol(col);
    setEditValue('');
    gridRef.current?.focus();
  }, [isEditing, selected, editValue, commitCell]);

  const handleFormulaFocus = useCallback(() => {
    if (!selected) return;
    // Entering the formula bar is like F2 — keeps content
    preEditValueRef.current = workbook.getCell(selected.row, selected.col)?.rawValue ?? '';
  }, [selected, workbook]);

  // Title editing
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditingTitle(false);
      gridRef.current?.focus();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--color-bg)',
        fontFamily: 'var(--font)',
        fontSize: '13px',
      }}
    >
      {/* ── Toolbar row ───────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 12px',
          height: '40px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          flexShrink: 0,
        }}
      >
        {/* Editable title */}
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text)',
              border: '1px solid var(--color-primary)',
              borderRadius: 'var(--radius-xs)',
              padding: '2px 6px',
              outline: 'none',
              boxShadow: '0 0 0 2px rgba(37,99,235,0.15)',
              background: 'var(--color-bg)',
              minWidth: '140px',
            }}
          />
        ) : (
          <span
            onClick={() => setIsEditingTitle(true)}
            title="Click to rename"
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text)',
              cursor: 'text',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid transparent',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-strong)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
            }}
          >
            {title}
          </span>
        )}

        {/* Separator */}
        <div className="toolbar-sep" />

        {/* Bold */}
        <button
          className={`toolbar-btn${bold ? ' active' : ''}`}
          title="Bold (Ctrl+B)"
          onClick={() => setBold((b) => !b)}
          style={{ fontWeight: 700, fontStyle: 'normal' }}
        >
          B
        </button>

        {/* Italic */}
        <button
          className={`toolbar-btn${italic ? ' active' : ''}`}
          title="Italic (Ctrl+I)"
          onClick={() => setItalic((i) => !i)}
          style={{ fontStyle: 'italic', fontWeight: 600 }}
        >
          I
        </button>

        {/* Separator */}
        <div className="toolbar-sep" />

        {/* Number format selector */}
        <select
          value={numberFormat}
          onChange={(e) => setNumberFormat(e.target.value as NumberFormat)}
          style={{
            fontSize: '12px',
            padding: '3px 6px',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-xs)',
            background: 'var(--color-bg)',
            color: 'var(--color-text-2)',
            cursor: 'pointer',
            outline: 'none',
            height: '26px',
          }}
        >
          <option value="General">General</option>
          <option value="Number">Number</option>
          <option value="Currency">Currency</option>
          <option value="Percent">Percent</option>
          <option value="Date">Date</option>
        </select>
      </div>

      {/* ── Formula bar ───────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          height: '30px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          flexShrink: 0,
          gap: '4px',
        }}
      >
        {/* Cell reference box */}
        <div
          style={{
            width: '60px',
            flexShrink: 0,
            padding: '2px 6px',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-xs)',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-text-2)',
            background: 'var(--color-bg-2)',
            lineHeight: '20px',
            height: '22px',
            boxSizing: 'border-box',
          }}
        >
          {selected ? cellRef(selected.row, selected.col) : ''}
        </div>

        {/* fx label */}
        <span
          style={{
            fontSize: '13px',
            fontStyle: 'italic',
            color: 'var(--color-text-3)',
            fontFamily: 'var(--font-mono)',
            flexShrink: 0,
            padding: '0 4px',
            userSelect: 'none',
          }}
        >
          fx
        </span>

        {/* Formula / value input */}
        <input
          ref={formulaInputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onFocus={handleFormulaFocus}
          onKeyDown={handleFormulaKeyDown}
          placeholder={selected ? '' : 'Select a cell to edit'}
          disabled={!selected}
          style={{
            flex: 1,
            height: '22px',
            padding: '0 6px',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-xs)',
            background: selected ? 'var(--color-bg)' : 'var(--color-bg-2)',
            color: 'var(--color-text)',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocusCapture={() => {
            // When the formula bar gets focus, show it as focused
            if (formulaInputRef.current) {
              formulaInputRef.current.style.borderColor = 'var(--color-primary)';
              formulaInputRef.current.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.12)';
            }
          }}
          onBlurCapture={() => {
            if (formulaInputRef.current) {
              formulaInputRef.current.style.borderColor = 'var(--color-border-strong)';
              formulaInputRef.current.style.boxShadow = 'none';
            }
          }}
        />
      </div>

      {/* ── Grid ──────────────────────────────────────────────────────── */}
      <div
        ref={gridRef}
        tabIndex={0}
        onKeyDown={handleGridKeyDown}
        style={{
          flex: 1,
          overflow: 'auto',
          outline: 'none',
          position: 'relative',
        }}
      >
        <table
          style={{
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            width: `${ROW_NUM_WIDTH + COLS * COL_WIDTH}px`,
            userSelect: 'none',
          }}
        >
          {/* Column widths */}
          <colgroup>
            <col style={{ width: `${ROW_NUM_WIDTH}px` }} />
            {Array.from({ length: COLS }, (_, c) => (
              <col key={c} style={{ width: `${COL_WIDTH}px` }} />
            ))}
          </colgroup>

          <thead>
            <tr>
              {/* Top-left corner cell */}
              <th
                style={{
                  position: 'sticky',
                  top: 0,
                  left: 0,
                  zIndex: 30,
                  background: 'var(--color-bg-3)',
                  border: '1px solid var(--color-border)',
                  height: `${ROW_HEIGHT}px`,
                  boxSizing: 'border-box',
                }}
              />
              {Array.from({ length: COLS }, (_, c) => {
                const isColSelected = selectedCol === c;
                const isInSelectedCol = selected?.col === c;
                return (
                  <th
                    key={c}
                    onClick={() => handleColHeaderClick(c)}
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 20,
                      height: `${ROW_HEIGHT}px`,
                      background: isColSelected
                        ? 'var(--color-primary)'
                        : isInSelectedCol
                        ? '#e8f0fe'
                        : 'var(--color-bg-3)',
                      border: '1px solid var(--color-border)',
                      borderBottom: isColSelected || isInSelectedCol
                        ? '2px solid var(--color-primary)'
                        : '1px solid var(--color-border)',
                      padding: '0 4px',
                      textAlign: 'center',
                      fontWeight: 600,
                      fontSize: '12px',
                      color: isColSelected
                        ? 'white'
                        : isInSelectedCol
                        ? 'var(--color-primary)'
                        : 'var(--color-text-3)',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      userSelect: 'none',
                    }}
                  >
                    {colLabel(c)}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: ROWS }, (_, r) => (
              <tr key={r}>
                {/* Row number */}
                <td
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 10,
                    height: `${ROW_HEIGHT}px`,
                    background: selected?.row === r ? '#e8f0fe' : 'var(--color-bg-3)',
                    border: '1px solid var(--color-border)',
                    borderRight: selected?.row === r
                      ? '2px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                    padding: '0 6px',
                    textAlign: 'right',
                    fontWeight: 500,
                    fontSize: '11px',
                    color: selected?.row === r ? 'var(--color-primary)' : 'var(--color-text-3)',
                    boxSizing: 'border-box',
                    userSelect: 'none',
                  }}
                >
                  {r + 1}
                </td>

                {/* Data cells */}
                {Array.from({ length: COLS }, (_, c) => {
                  const isSelected = selected?.row === r && selected?.col === c;
                  const isColHighlighted = selectedCol === c;
                  const computed = getComputed(r, c);
                  const isError = !!computed.error;
                  const numeric = isNumericValue(computed);
                  const displayText = isSelected && isEditing
                    ? '' // will render input instead
                    : formatValue(getRawValue(r, c), computed, numberFormat);

                  return (
                    <td
                      key={c}
                      onClick={() => handleCellClick(r, c)}
                      onDoubleClick={() => handleCellDoubleClick(r, c)}
                      style={{
                        height: `${ROW_HEIGHT}px`,
                        maxWidth: `${COL_WIDTH}px`,
                        padding: isSelected && isEditing ? '0' : '0 4px',
                        boxSizing: 'border-box',
                        border: isSelected
                          ? '2px solid var(--color-primary)'
                          : '1px solid var(--color-border)',
                        background: isSelected
                          ? '#eff6ff'
                          : isColHighlighted
                          ? '#f0f4ff'
                          : 'var(--color-bg)',
                        cursor: 'cell',
                        textAlign: numeric ? 'right' : 'left',
                        color: isError ? 'var(--color-danger)' : 'var(--color-text)',
                        fontWeight: bold ? 700 : 400,
                        fontStyle: italic ? 'italic' : 'normal',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: '13px',
                        position: 'relative',
                      }}
                    >
                      {isSelected && isEditing ? (
                        <input
                          ref={cellInputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleCellInputKeyDown}
                          onBlur={() => {
                            // Only commit on blur if we're still in editing state
                            // (avoid double-commit when arrow keys move focus)
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            outline: 'none',
                            padding: '0 4px',
                            margin: 0,
                            background: '#eff6ff',
                            fontFamily: 'var(--font)',
                            fontSize: '13px',
                            color: 'var(--color-text)',
                            fontWeight: bold ? 700 : 400,
                            fontStyle: italic ? 'italic' : 'normal',
                            boxSizing: 'border-box',
                          }}
                        />
                      ) : (
                        displayText
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
