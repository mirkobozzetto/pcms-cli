/**
 * Lexical Editor JSON types — mirrors Payload CMS Lexical richtext format.
 * @see https://payloadcms.com/docs/rich-text/lexical
 */

export const TEXT_FORMAT = {
  BOLD: 1,
  ITALIC: 2,
  STRIKETHROUGH: 4,
  UNDERLINE: 8,
  CODE: 16,
  SUBSCRIPT: 32,
  SUPERSCRIPT: 64,
} as const

export type TextFormatValue = (typeof TEXT_FORMAT)[keyof typeof TEXT_FORMAT]
export type TextFormatBitmask = number

export interface LexicalTextNode {
  readonly type: 'text'
  readonly text: string
  readonly format?: TextFormatBitmask
  readonly detail?: number
  readonly mode?: 'normal' | 'token' | 'segmented'
  readonly style?: string
}

export interface LexicalCodeHighlightNode {
  readonly type: 'code-highlight'
  readonly text: string
  readonly highlightType?: string
}

export interface LexicalLinkFields {
  readonly url: string
  readonly newTab: boolean
  readonly linkType: 'custom' | 'internal'
  readonly doc?: { readonly value: string; readonly relationTo: string }
}

export interface LexicalLinkNode {
  readonly type: 'link'
  readonly fields: LexicalLinkFields
  readonly children: readonly LexicalInlineNode[]
}

export type LexicalInlineNode = LexicalTextNode | LexicalLinkNode | LexicalCodeHighlightNode

export interface LexicalParagraphNode {
  readonly type: 'paragraph'
  readonly children: readonly LexicalInlineNode[]
  readonly format?: string
  readonly indent?: number
  readonly direction?: 'ltr' | 'rtl' | null
}

export interface LexicalHeadingNode {
  readonly type: 'heading'
  readonly tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  readonly children: readonly LexicalInlineNode[]
  readonly format?: string
  readonly indent?: number
  readonly direction?: 'ltr' | 'rtl' | null
}

export interface LexicalListItemNode {
  readonly type: 'listitem'
  readonly value: number
  readonly children: readonly LexicalBlockNode[]
  readonly checked?: boolean
}

export interface LexicalListNode {
  readonly type: 'list'
  readonly listType: 'bullet' | 'number' | 'check'
  readonly children: readonly LexicalListItemNode[]
  readonly start?: number
  readonly tag?: 'ul' | 'ol'
}

export interface LexicalQuoteNode {
  readonly type: 'quote'
  readonly children: readonly LexicalBlockNode[]
}

export interface LexicalCodeNode {
  readonly type: 'code'
  readonly language?: string | undefined
  readonly children: readonly LexicalCodeHighlightNode[]
}

export interface LexicalHorizontalRuleNode {
  readonly type: 'horizontalrule'
}

export interface LexicalUploadNode {
  readonly type: 'upload'
  readonly value: { readonly id: string }
  readonly relationTo: string
  readonly fields?: Record<string, unknown>
}

export type LexicalBlockNode =
  | LexicalParagraphNode
  | LexicalHeadingNode
  | LexicalListNode
  | LexicalQuoteNode
  | LexicalCodeNode
  | LexicalHorizontalRuleNode
  | LexicalUploadNode

export interface LexicalRootNode {
  readonly type: 'root'
  readonly children: readonly LexicalBlockNode[]
  readonly direction: 'ltr' | 'rtl'
  readonly format: string
  readonly indent: number
  readonly version: 1
}

export interface LexicalDocument {
  readonly root: LexicalRootNode
}
