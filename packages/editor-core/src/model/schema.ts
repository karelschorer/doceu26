import type { NodeType, MarkType } from './node';

export interface NodeSpec {
  inline?: boolean;
  leaf?: boolean;
  allowedContent?: NodeType[];
  allowedMarks?: MarkType[];
}

export interface MarkSpec {
  excludes?: MarkType[];
  attrs?: Record<string, { default?: unknown }>;
}

export interface Schema {
  nodes: Record<NodeType, NodeSpec>;
  marks: Record<MarkType, MarkSpec>;
}

export const defaultSchema: Schema = {
  nodes: {
    doc: { allowedContent: ['paragraph', 'heading', 'blockquote', 'code_block', 'bullet_list', 'ordered_list', 'horizontal_rule', 'image', 'table'] },
    paragraph: { allowedContent: ['text', 'hard_break', 'image'], allowedMarks: ['bold', 'italic', 'underline', 'strikethrough', 'code', 'link'] },
    heading: { allowedContent: ['text'], allowedMarks: ['bold', 'italic', 'link'], },
    text: { inline: true, leaf: true },
    hard_break: { inline: true, leaf: true },
    horizontal_rule: { leaf: true },
    blockquote: { allowedContent: ['paragraph'] },
    code_block: { allowedContent: ['text'] },
    bullet_list: { allowedContent: ['list_item'] },
    ordered_list: { allowedContent: ['list_item'] },
    list_item: { allowedContent: ['paragraph', 'bullet_list', 'ordered_list'] },
    image: { inline: true, leaf: true },
    table: { allowedContent: ['table_row'] },
    table_row: { allowedContent: ['table_cell'] },
    table_cell: { allowedContent: ['paragraph'] },
  },
  marks: {
    bold: {},
    italic: {},
    underline: {},
    strikethrough: {},
    code: { excludes: ['bold', 'italic', 'underline', 'strikethrough', 'link'] },
    link: { attrs: { href: {}, title: { default: null } } },
  },
};
