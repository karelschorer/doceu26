import type { EditorState } from '../model/document';
import { Transaction } from '../transform/transaction';
import type { Plugin } from '../plugins/plugin';

export type DispatchFn = (tr: Transaction) => void;

export interface EditorViewOptions {
  state: EditorState;
  plugins?: Plugin[];
  dispatchTransaction?: DispatchFn;
}

export class EditorView {
  private _state: EditorState;
  private plugins: Plugin[];
  private dispatchTransaction: DispatchFn;
  dom: HTMLElement;

  constructor(dom: HTMLElement, options: EditorViewOptions) {
    this.dom = dom;
    this._state = options.state;
    this.plugins = options.plugins ?? [];
    this.dispatchTransaction = options.dispatchTransaction ?? ((tr) => {
      this.updateState(tr.apply());
    });

    dom.setAttribute('contenteditable', 'true');
    dom.setAttribute('role', 'textbox');
    dom.setAttribute('aria-multiline', 'true');
    dom.classList.add('doceu26-editor');

    this.render();
    this.attachEventListeners();
  }

  get state(): EditorState {
    return this._state;
  }

  dispatch(tr: Transaction): void {
    this.dispatchTransaction(tr);
  }

  updateState(state: EditorState): void {
    this._state = state;
    this.render();
  }

  createTransaction(): Transaction {
    return new Transaction(this._state);
  }

  private render(): void {
    // Simplified render: in full impl, reconcile DOM with doc tree
    const { doc } = this._state;
    this.dom.dataset.docType = doc.type;
  }

  private attachEventListeners(): void {
    this.dom.addEventListener('keydown', (e) => {
      for (const plugin of this.plugins) {
        if (plugin.props?.handleKeyDown?.(this, e)) {
          e.preventDefault();
          return;
        }
      }
    });

    this.dom.addEventListener('input', (e) => {
      // Input handling: read from DOM, create transaction
      const inputEvent = e as InputEvent;
      if (inputEvent.inputType === 'insertText' && inputEvent.data) {
        const tr = this.createTransaction();
        tr.insertText(this._state.selection.anchor, inputEvent.data);
        this.dispatch(tr);
      }
    });
  }

  destroy(): void {
    this.dom.removeAttribute('contenteditable');
    this.dom.innerHTML = '';
  }
}
