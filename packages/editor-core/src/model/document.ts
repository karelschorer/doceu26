import type { DocNode } from './node';

export interface EditorState {
  doc: DocNode;
  selection: Selection;
}

export interface Selection {
  anchor: number; // character offset from doc start
  head: number;   // character offset from doc start (may differ from anchor for range)
}

export function emptyDoc(): DocNode {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }],
  };
}

export function createState(doc?: DocNode): EditorState {
  return {
    doc: doc ?? emptyDoc(),
    selection: { anchor: 0, head: 0 },
  };
}

/** Count all leaf/text nodes to compute document size */
export function docSize(node: DocNode): number {
  if (node.type === 'text') return node.text?.length ?? 0;
  if (!node.content) return 1; // leaf node
  return node.content.reduce((sum, child) => sum + docSize(child), 2); // 2 for open/close tokens
}
