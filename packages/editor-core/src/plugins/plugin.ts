import type { EditorState } from '../model/document';
import type { Transaction } from '../transform/transaction';
import type { EditorView } from '../view/editor-view';
import type { Schema } from '../model/schema';

export interface PluginState<T = unknown> {
  init(schema: Schema, state: EditorState): T;
  apply(tr: Transaction, value: T, oldState: EditorState, newState: EditorState): T;
}

export interface PluginProps {
  handleKeyDown?: (view: EditorView, event: KeyboardEvent) => boolean;
  handleDOMEvents?: Record<string, (view: EditorView, event: Event) => boolean>;
}

export interface Plugin<T = unknown> {
  key?: string;
  state?: PluginState<T>;
  props?: PluginProps;
  filterTransaction?: (tr: Transaction, state: EditorState) => boolean;
  appendTransaction?: (trs: readonly Transaction[], oldState: EditorState, newState: EditorState) => Transaction | null;
}

export function createPlugin<T = unknown>(plugin: Plugin<T>): Plugin<T> {
  return plugin;
}
