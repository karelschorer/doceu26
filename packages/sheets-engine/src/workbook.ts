import type { Cell, CellValue } from './cell';
import { cellId, parseRef, emptyValue, errorValue, numberValue } from './cell';
import { parseFormula } from './formula/parser';
import { evalFormula } from './formula/evaluator';
import { DependencyGraph } from './dependency-graph';

export interface Sheet {
  id: string;
  name: string;
  cells: Map<string, Cell>;
}

export class Workbook {
  sheets: Sheet[] = [];
  private graph = new DependencyGraph();
  private activeSheetId: string;

  constructor(name = 'Sheet1') {
    const sheet: Sheet = { id: 'sheet-1', name, cells: new Map() };
    this.sheets.push(sheet);
    this.activeSheetId = sheet.id;
  }

  get activeSheet(): Sheet {
    return this.sheets.find((s) => s.id === this.activeSheetId)!;
  }

  setCell(row: number, col: number, rawValue: string): void {
    const id = cellId(row, col);
    const sheet = this.activeSheet;

    this.graph.removeDependencies(id);

    let computed: CellValue = emptyValue;
    let formula: string | undefined;

    if (rawValue.startsWith('=')) {
      formula = rawValue;
      try {
        const expr = parseFormula(rawValue);
        computed = evalFormula(
          expr,
          (ref) => this.getCellValue(ref),
          (from, to) => this.getRangeValues(from, to),
        );
      } catch {
        computed = errorValue('#VALUE!');
      }
    } else if (rawValue === '') {
      computed = emptyValue;
    } else {
      const num = parseFloat(rawValue);
      computed = isNaN(num) ? { type: 'string', value: rawValue } : numberValue(num);
    }

    sheet.cells.set(id, { id, row, col, rawValue, computed, formula });
    this.recalculateDependents(id);
  }

  getCell(row: number, col: number): Cell | undefined {
    return this.activeSheet.cells.get(cellId(row, col));
  }

  getCellValue(ref: string): CellValue {
    const cell = this.activeSheet.cells.get(ref);
    return cell?.computed ?? emptyValue;
  }

  getRangeValues(from: string, to: string): CellValue[] {
    const fromPos = parseRef(from);
    const toPos = parseRef(to);
    if (!fromPos || !toPos) return [];

    const values: CellValue[] = [];
    for (let r = fromPos.row; r <= toPos.row; r++) {
      for (let c = fromPos.col; c <= toPos.col; c++) {
        values.push(this.getCellValue(cellId(r, c)));
      }
    }
    return values;
  }

  private recalculateDependents(changedCell: string): void {
    const order = this.graph.getRecalcOrder(changedCell);
    for (const cellRef of order) {
      const parsed = parseRef(cellRef);
      if (!parsed) continue;
      const cell = this.activeSheet.cells.get(cellRef);
      if (!cell?.formula) continue;
      try {
        const expr = parseFormula(cell.formula);
        cell.computed = evalFormula(
          expr,
          (ref) => this.getCellValue(ref),
          (from, to) => this.getRangeValues(from, to),
        );
      } catch {
        cell.computed = errorValue('#VALUE!');
      }
    }
  }
}
