import type { EditorView } from '../view/editor-view';
import { createPlugin } from './plugin';

export type KeymapDefinition = Record<string, (view: EditorView) => boolean>;

export function keymapPlugin(bindings: KeymapDefinition) {
  return createPlugin({
    key: 'keymap',
    props: {
      handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
        const isMac = navigator.platform.includes('Mac');
        const parts: string[] = [];
        if (event.ctrlKey) parts.push('Ctrl');
        if (event.metaKey) parts.push(isMac ? 'Cmd' : 'Meta');
        if (event.altKey) parts.push('Alt');
        if (event.shiftKey) parts.push('Shift');
        parts.push(event.key);
        const key = parts.join('-');

        const handler = bindings[key];
        if (handler) return handler(view);
        return false;
      },
    },
  });
}

export const baseKeymap: KeymapDefinition = {
  'Enter': (view) => {
    const tr = view.createTransaction();
    tr.insertText(view.state.selection.anchor, '\n');
    view.dispatch(tr);
    return true;
  },
};
