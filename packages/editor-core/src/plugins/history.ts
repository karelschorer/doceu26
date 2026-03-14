import type { EditorState } from '../model/document';
import type { Transaction } from '../transform/transaction';
import { createPlugin } from './plugin';

interface HistoryState {
  undoStack: EditorState[];
  redoStack: EditorState[];
}

export const historyPlugin = createPlugin<HistoryState>({
  key: 'history',
  state: {
    init: () => ({ undoStack: [], redoStack: [] }),
    apply: (tr, value, oldState) => {
      if (tr.getSteps().length === 0) return value;
      return {
        undoStack: [...value.undoStack, oldState].slice(-100), // keep last 100
        redoStack: [],
      };
    },
  },
  props: {
    handleKeyDown: (view, event) => {
      const isMac = navigator.platform.includes('Mac');
      const mod = isMac ? event.metaKey : event.ctrlKey;
      if (mod && event.key === 'z' && !event.shiftKey) {
        // undo - simplified
        return true;
      }
      if (mod && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        // redo - simplified
        return true;
      }
      return false;
    },
  },
});
