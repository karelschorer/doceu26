export type CellValueType = 'number' | 'string' | 'boolean' | 'error' | 'empty';

export type CellErrorType = '#DIV/0!' | '#VALUE!' | '#REF!' | '#NAME?' | '#N/A' | '#NUM!' | '#NULL!';

export interface CellValue {
  type: CellValueType;
  value: number | string | boolean | null;
  error?: CellErrorType;
}

export interface Cell {
  id: string; // e.g. "A1"
  row: number;
  col: number;
  rawValue: string; // what user typed
  computed: CellValue;
  format?: string;
  formula?: string;
}

export function cellId(row: number, col: number): string {
  return `${colLetter(col)}${row + 1}`;
}

export function colLetter(col: number): string {
  let result = '';
  let n = col;
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

export function parseRef(ref: string): { row: number; col: number } | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const col = match[1].split('').reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 65 + 1, 0) - 1;
  const row = parseInt(match[2], 10) - 1;
  return { row, col };
}

export function numberValue(n: number): CellValue {
  return { type: 'number', value: n };
}

export function stringValue(s: string): CellValue {
  return { type: 'string', value: s };
}

export function errorValue(e: CellErrorType): CellValue {
  return { type: 'error', value: null, error: e };
}

export const emptyValue: CellValue = { type: 'empty', value: null };
