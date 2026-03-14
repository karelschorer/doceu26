export type NodeType =
  | 'doc'
  | 'paragraph'
  | 'heading'
  | 'text'
  | 'hard_break'
  | 'horizontal_rule'
  | 'blockquote'
  | 'code_block'
  | 'bullet_list'
  | 'ordered_list'
  | 'list_item'
  | 'image'
  | 'table'
  | 'table_row'
  | 'table_cell';

export type MarkType = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link';

export interface Mark {
  type: MarkType;
  attrs?: Record<string, unknown>;
}

export interface DocNode {
  type: NodeType;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  text?: string;
  marks?: Mark[];
}

export function textNode(text: string, marks?: Mark[]): DocNode {
  return { type: 'text', text, marks };
}

export function paragraphNode(content: DocNode[]): DocNode {
  return { type: 'paragraph', content };
}

export function headingNode(level: 1 | 2 | 3 | 4 | 5 | 6, content: DocNode[]): DocNode {
  return { type: 'heading', attrs: { level }, content };
}

export function docNode(content: DocNode[]): DocNode {
  return { type: 'doc', content };
}
