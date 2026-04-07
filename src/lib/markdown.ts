import { TEXT_FORMAT } from '../types/lexical.js'
import type {
  LexicalDocument,
  LexicalRootNode,
  LexicalBlockNode,
  LexicalInlineNode,
  LexicalTextNode,
  LexicalLinkNode,
  LexicalCodeHighlightNode,
  LexicalParagraphNode,
  LexicalHeadingNode,
  LexicalListNode,
  LexicalListItemNode,
  LexicalQuoteNode,
  LexicalCodeNode,
  LexicalHorizontalRuleNode,
  TextFormatBitmask,
} from '../types/lexical.js'

export function parseFrontmatter(text: string): { meta: Record<string, string>; body: string } {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/
  const match = text.match(frontmatterRegex)

  if (!match) {
    return { meta: {}, body: text }
  }

  const rawMeta = match[1] ?? ''
  const body = match[2] ?? ''
  const meta: Record<string, string> = {}

  for (const line of rawMeta.split('\n')) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    const key = line.slice(0, colonIndex).trim()
    const value = line
      .slice(colonIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (key) {
      meta[key] = value
    }
  }

  return { meta, body }
}

function parseInlineNodes(text: string): readonly LexicalInlineNode[] {
  const nodes: LexicalInlineNode[] = []
  let remaining = text

  while (remaining.length > 0) {
    const linkMatch = remaining.match(/^\[([^\]]*)\]\(([^)]*)\)/)
    if (linkMatch) {
      const linkText = linkMatch[1] ?? ''
      const url = linkMatch[2] ?? ''
      const linkNode: LexicalLinkNode = {
        type: 'link',
        fields: {
          url,
          newTab: false,
          linkType: 'custom',
        },
        children: [makeTextNode(linkText, 0)],
      }
      nodes.push(linkNode)
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/)
    if (boldMatch) {
      nodes.push(makeTextNode(boldMatch[1] ?? '', TEXT_FORMAT.BOLD))
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    const italicMatch = remaining.match(/^\*(.+?)\*/)
    if (italicMatch) {
      nodes.push(makeTextNode(italicMatch[1] ?? '', TEXT_FORMAT.ITALIC))
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      nodes.push(makeTextNode(codeMatch[1] ?? '', TEXT_FORMAT.CODE))
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    const nextSpecial = remaining.search(/\*\*|\*|`|\[/)
    if (nextSpecial === -1) {
      nodes.push(makeTextNode(remaining, 0))
      remaining = ''
    } else if (nextSpecial > 0) {
      nodes.push(makeTextNode(remaining.slice(0, nextSpecial), 0))
      remaining = remaining.slice(nextSpecial)
    } else {
      nodes.push(makeTextNode(remaining[0] ?? '', 0))
      remaining = remaining.slice(1)
    }
  }

  return nodes
}

function makeTextNode(text: string, format: TextFormatBitmask): LexicalTextNode {
  return {
    type: 'text',
    text,
    format,
    mode: 'normal',
  }
}

function makeParagraph(text: string): LexicalParagraphNode {
  return {
    type: 'paragraph',
    children: parseInlineNodes(text),
    direction: 'ltr',
  }
}

function makeHeading(tag: LexicalHeadingNode['tag'], text: string): LexicalHeadingNode {
  return {
    type: 'heading',
    tag,
    children: parseInlineNodes(text),
    direction: 'ltr',
  }
}

function makeListItem(value: number, text: string): LexicalListItemNode {
  return {
    type: 'listitem',
    value,
    children: [makeParagraph(text)],
  }
}

function makeCodeNode(language: string, lines: readonly string[]): LexicalCodeNode {
  const children: LexicalCodeHighlightNode[] = lines.map((line) => ({
    type: 'code-highlight',
    text: line,
  }))
  return {
    type: 'code',
    language: language !== '' ? language : undefined,
    children,
  }
}

function makeHorizontalRule(): LexicalHorizontalRuleNode {
  return { type: 'horizontalrule' }
}

type ParseState = {
  blocks: LexicalBlockNode[]
  inCodeBlock: boolean
  codeBlockLang: string
  codeBlockLines: string[]
  bulletItems: LexicalListItemNode[]
  numberedItems: LexicalListItemNode[]
}

function flushBulletList(state: ParseState): void {
  if (state.bulletItems.length > 0) {
    const listNode: LexicalListNode = {
      type: 'list',
      listType: 'bullet',
      tag: 'ul',
      children: [...state.bulletItems],
    }
    state.blocks.push(listNode)
    state.bulletItems = []
  }
}

function flushNumberedList(state: ParseState): void {
  if (state.numberedItems.length > 0) {
    const listNode: LexicalListNode = {
      type: 'list',
      listType: 'number',
      tag: 'ol',
      children: [...state.numberedItems],
    }
    state.blocks.push(listNode)
    state.numberedItems = []
  }
}

function flushCodeBlock(state: ParseState): void {
  if (state.inCodeBlock) {
    state.blocks.push(makeCodeNode(state.codeBlockLang, state.codeBlockLines))
    state.inCodeBlock = false
    state.codeBlockLang = ''
    state.codeBlockLines = []
  }
}

export function markdownToLexical(markdown: string): LexicalDocument {
  const lines = markdown.split('\n')
  const state: ParseState = {
    blocks: [],
    inCodeBlock: false,
    codeBlockLang: '',
    codeBlockLines: [],
    bulletItems: [],
    numberedItems: [],
  }

  for (const line of lines) {
    if (state.inCodeBlock) {
      if (line.trimEnd() === '```') {
        flushCodeBlock(state)
      } else {
        state.codeBlockLines.push(line)
      }
      continue
    }

    const codeBlockStart = line.match(/^```(\w*)$/)
    if (codeBlockStart) {
      flushBulletList(state)
      flushNumberedList(state)
      state.inCodeBlock = true
      state.codeBlockLang = codeBlockStart[1] ?? ''
      state.codeBlockLines = []
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushBulletList(state)
      flushNumberedList(state)
      const level = headingMatch[1]?.length ?? 1
      const text = headingMatch[2] ?? ''
      const tagMap: Record<number, LexicalHeadingNode['tag']> = {
        1: 'h1',
        2: 'h2',
        3: 'h3',
        4: 'h4',
        5: 'h5',
        6: 'h6',
      }
      state.blocks.push(makeHeading(tagMap[level] ?? 'h1', text))
      continue
    }

    if (/^---+$/.test(line.trim())) {
      flushBulletList(state)
      flushNumberedList(state)
      state.blocks.push(makeHorizontalRule())
      continue
    }

    const blockquoteMatch = line.match(/^>\s?(.*)$/)
    if (blockquoteMatch) {
      flushBulletList(state)
      flushNumberedList(state)
      const quoteNode: LexicalQuoteNode = {
        type: 'quote',
        children: [makeParagraph(blockquoteMatch[1] ?? '')],
      }
      state.blocks.push(quoteNode)
      continue
    }

    const bulletMatch = line.match(/^[-*+]\s+(.*)$/)
    if (bulletMatch) {
      flushNumberedList(state)
      state.bulletItems.push(makeListItem(state.bulletItems.length + 1, bulletMatch[1] ?? ''))
      continue
    }

    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/)
    if (numberedMatch) {
      flushBulletList(state)
      const num = parseInt(numberedMatch[1] ?? '1', 10)
      state.numberedItems.push(makeListItem(num, numberedMatch[2] ?? ''))
      continue
    }

    flushBulletList(state)
    flushNumberedList(state)

    if (line.trim() === '') {
      continue
    }

    state.blocks.push(makeParagraph(line))
  }

  flushBulletList(state)
  flushNumberedList(state)
  flushCodeBlock(state)

  const root: LexicalRootNode = {
    type: 'root',
    children: state.blocks,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }

  return { root }
}

function inlineNodeToMarkdown(node: LexicalInlineNode): string {
  if (node.type === 'text') {
    const format = node.format ?? 0
    let text = node.text

    if (format & TEXT_FORMAT.CODE) return `\`${text}\``
    if (format & TEXT_FORMAT.BOLD) text = `**${text}**`
    if (format & TEXT_FORMAT.ITALIC) text = `*${text}*`
    if (format & TEXT_FORMAT.STRIKETHROUGH) text = `~~${text}~~`
    if (format & TEXT_FORMAT.UNDERLINE) text = `<u>${text}</u>`

    return text
  }

  if (node.type === 'link') {
    const linkText = node.children.map(inlineNodeToMarkdown).join('')
    return `[${linkText}](${node.fields.url})`
  }

  if (node.type === 'code-highlight') {
    return node.text
  }

  return ''
}

function blockNodeToMarkdown(node: LexicalBlockNode): string {
  switch (node.type) {
    case 'paragraph':
      return node.children.map(inlineNodeToMarkdown).join('')

    case 'heading': {
      const levelMap: Record<LexicalHeadingNode['tag'], string> = {
        h1: '#',
        h2: '##',
        h3: '###',
        h4: '####',
        h5: '#####',
        h6: '######',
      }
      const prefix = levelMap[node.tag]
      const text = node.children.map(inlineNodeToMarkdown).join('')
      return `${prefix} ${text}`
    }

    case 'list': {
      return node.children
        .map((item, index) => {
          const innerText = item.children.map(blockNodeToMarkdown).join('')
          if (node.listType === 'bullet') return `- ${innerText}`
          return `${item.value > 0 ? item.value : index + 1}. ${innerText}`
        })
        .join('\n')
    }

    case 'quote': {
      return node.children.map((child) => `> ${blockNodeToMarkdown(child)}`).join('\n')
    }

    case 'code': {
      const lang = node.language ?? ''
      const codeText = node.children.map((c) => c.text).join('\n')
      return `\`\`\`${lang}\n${codeText}\n\`\`\``
    }

    case 'horizontalrule':
      return '---'

    case 'upload':
      return `![upload](${node.value.id})`

    default:
      return ''
  }
}

export function lexicalToMarkdown(doc: LexicalDocument): string {
  return doc.root.children
    .map(blockNodeToMarkdown)
    .filter((line) => line.length > 0)
    .join('\n\n')
}
