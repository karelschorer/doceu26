import type { DocNode, Mark, MarkType } from '../model/node';
import type { EditorState, Selection } from '../model/document';

export type StepType = 'insert' | 'delete' | 'replace' | 'addMark' | 'removeMark' | 'setAttrs';

export interface Step {
  type: StepType;
  from: number;
  to?: number;
  content?: DocNode | DocNode[];
  mark?: Mark;
  markType?: MarkType;
  attrs?: Record<string, unknown>;
}

export class Transaction {
  private steps: Step[] = [];
  private _selection: Selection;
  doc: DocNode;

  constructor(state: EditorState) {
    this.doc = structuredClone(state.doc);
    this._selection = { ...state.selection };
  }

  insertText(pos: number, text: string): this {
    this.steps.push({ type: 'insert', from: pos, content: { type: 'text', text } });
    return this;
  }

  delete(from: number, to: number): this {
    this.steps.push({ type: 'delete', from, to });
    return this;
  }

  addMark(from: number, to: number, mark: Mark): this {
    this.steps.push({ type: 'addMark', from, to, mark });
    return this;
  }

  removeMark(from: number, to: number, markType: MarkType): this {
    this.steps.push({ type: 'removeMark', from, to, markType });
    return this;
  }

  setSelection(selection: Selection): this {
    this._selection = selection;
    return this;
  }

  getSteps(): readonly Step[] {
    return this.steps;
  }

  getSelection(): Selection {
    return this._selection;
  }

  apply(): EditorState {
    // Simplified: apply steps and return new state
    // Full implementation would walk the doc tree and apply each step
    return { doc: this.doc, selection: this._selection };
  }
}
