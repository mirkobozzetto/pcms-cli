import { describe, it, expect } from 'vitest'
import { parseFrontmatter, markdownToLexical, lexicalToMarkdown } from '../../src/lib/markdown.js'
import type { LexicalDocument } from '../../src/types/lexical.js'
import { TEXT_FORMAT } from '../../src/types/lexical.js'

describe('parseFrontmatter', () => {
  it('returns empty meta and full body when no frontmatter', () => {
    const input = 'Hello world\nSecond line'
    const result = parseFrontmatter(input)
    expect(result.meta).toEqual({})
    expect(result.body).toBe(input)
  })

  it('parses frontmatter key-value pairs', () => {
    const input = '---\ntitle: My Post\nstatus: published\n---\nBody text'
    const result = parseFrontmatter(input)
    expect(result.meta.title).toBe('My Post')
    expect(result.meta.status).toBe('published')
    expect(result.body).toBe('Body text')
  })

  it('strips quotes from values', () => {
    const input = '---\ntitle: "Quoted Title"\nauthor: \'Single Quoted\'\n---\nbody'
    const result = parseFrontmatter(input)
    expect(result.meta.title).toBe('Quoted Title')
    expect(result.meta.author).toBe('Single Quoted')
  })

  it('returns empty body when frontmatter has no body', () => {
    const input = '---\ntitle: Only Meta\n---\n'
    const result = parseFrontmatter(input)
    expect(result.meta.title).toBe('Only Meta')
    expect(result.body).toBe('')
  })

  it('handles empty frontmatter block', () => {
    const input = '---\n\n---\nbody content'
    const result = parseFrontmatter(input)
    expect(result.meta).toEqual({})
    expect(result.body).toBe('body content')
  })
})

describe('markdownToLexical', () => {
  it('converts a plain paragraph', () => {
    const doc = markdownToLexical('Hello world')
    expect(doc.root.children).toHaveLength(1)
    const node = doc.root.children[0]
    expect(node?.type).toBe('paragraph')
    if (node?.type === 'paragraph') {
      expect(node.children[0]).toMatchObject({ type: 'text', text: 'Hello world' })
    }
  })

  it('converts h1 heading', () => {
    const doc = markdownToLexical('# Title')
    const node = doc.root.children[0]
    expect(node?.type).toBe('heading')
    if (node?.type === 'heading') {
      expect(node.tag).toBe('h1')
      expect(node.children[0]).toMatchObject({ type: 'text', text: 'Title' })
    }
  })

  it('converts h2 through h6 headings', () => {
    const levels = [2, 3, 4, 5, 6] as const
    for (const level of levels) {
      const hashes = '#'.repeat(level)
      const doc = markdownToLexical(`${hashes} Heading ${level}`)
      const node = doc.root.children[0]
      expect(node?.type).toBe('heading')
      if (node?.type === 'heading') {
        expect(node.tag).toBe(`h${level}`)
      }
    }
  })

  it('converts bold text', () => {
    const doc = markdownToLexical('**bold text**')
    const node = doc.root.children[0]
    if (node?.type === 'paragraph') {
      const child = node.children[0]
      expect(child).toMatchObject({ type: 'text', text: 'bold text', format: TEXT_FORMAT.BOLD })
    }
  })

  it('converts italic text', () => {
    const doc = markdownToLexical('*italic text*')
    const node = doc.root.children[0]
    if (node?.type === 'paragraph') {
      const child = node.children[0]
      expect(child).toMatchObject({ type: 'text', text: 'italic text', format: TEXT_FORMAT.ITALIC })
    }
  })

  it('converts inline code', () => {
    const doc = markdownToLexical('`code snippet`')
    const node = doc.root.children[0]
    if (node?.type === 'paragraph') {
      const child = node.children[0]
      expect(child).toMatchObject({ type: 'text', text: 'code snippet', format: TEXT_FORMAT.CODE })
    }
  })

  it('converts a link', () => {
    const doc = markdownToLexical('[Click here](https://example.com)')
    const node = doc.root.children[0]
    if (node?.type === 'paragraph') {
      const child = node.children[0]
      expect(child?.type).toBe('link')
      if (child?.type === 'link') {
        expect(child.fields.url).toBe('https://example.com')
        expect(child.children[0]).toMatchObject({ type: 'text', text: 'Click here' })
      }
    }
  })

  it('converts bullet list', () => {
    const doc = markdownToLexical('- Item one\n- Item two\n- Item three')
    expect(doc.root.children).toHaveLength(1)
    const node = doc.root.children[0]
    expect(node?.type).toBe('list')
    if (node?.type === 'list') {
      expect(node.listType).toBe('bullet')
      expect(node.tag).toBe('ul')
      expect(node.children).toHaveLength(3)
    }
  })

  it('converts numbered list', () => {
    const doc = markdownToLexical('1. First\n2. Second\n3. Third')
    expect(doc.root.children).toHaveLength(1)
    const node = doc.root.children[0]
    expect(node?.type).toBe('list')
    if (node?.type === 'list') {
      expect(node.listType).toBe('number')
      expect(node.tag).toBe('ol')
      expect(node.children).toHaveLength(3)
    }
  })

  it('converts code block with language', () => {
    const input = '```typescript\nconst x = 1\n```'
    const doc = markdownToLexical(input)
    const node = doc.root.children[0]
    expect(node?.type).toBe('code')
    if (node?.type === 'code') {
      expect(node.language).toBe('typescript')
      expect(node.children[0]).toMatchObject({ type: 'code-highlight', text: 'const x = 1' })
    }
  })

  it('converts code block without language', () => {
    const input = '```\nsome code\n```'
    const doc = markdownToLexical(input)
    const node = doc.root.children[0]
    expect(node?.type).toBe('code')
    if (node?.type === 'code') {
      expect(node.language).toBeUndefined()
    }
  })

  it('converts blockquote', () => {
    const doc = markdownToLexical('> Quote text')
    const node = doc.root.children[0]
    expect(node?.type).toBe('quote')
    if (node?.type === 'quote') {
      expect(node.children[0]?.type).toBe('paragraph')
    }
  })

  it('converts horizontal rule', () => {
    const doc = markdownToLexical('---')
    const node = doc.root.children[0]
    expect(node?.type).toBe('horizontalrule')
  })

  it('skips empty lines between blocks', () => {
    const doc = markdownToLexical('Para one\n\nPara two')
    expect(doc.root.children).toHaveLength(2)
  })

  it('returns LexicalDocument structure with root node', () => {
    const doc = markdownToLexical('Hello')
    expect(doc).toHaveProperty('root')
    expect(doc.root.type).toBe('root')
    expect(doc.root.direction).toBe('ltr')
    expect(doc.root.version).toBe(1)
  })
})

describe('lexicalToMarkdown', () => {
  it('converts paragraph back to markdown', () => {
    const doc: LexicalDocument = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Hello world', format: 0 }],
            direction: 'ltr',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    }
    expect(lexicalToMarkdown(doc)).toBe('Hello world')
  })

  it('converts heading back to markdown', () => {
    const doc: LexicalDocument = {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: 'Section', format: 0 }],
            direction: 'ltr',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    }
    expect(lexicalToMarkdown(doc)).toBe('## Section')
  })

  it('converts bold text back to markdown', () => {
    const doc: LexicalDocument = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'bold', format: TEXT_FORMAT.BOLD }],
            direction: 'ltr',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    }
    expect(lexicalToMarkdown(doc)).toBe('**bold**')
  })

  it('converts italic text back to markdown', () => {
    const doc: LexicalDocument = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'italic', format: TEXT_FORMAT.ITALIC }],
            direction: 'ltr',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    }
    expect(lexicalToMarkdown(doc)).toBe('*italic*')
  })

  it('converts inline code back to markdown', () => {
    const doc: LexicalDocument = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'snippet', format: TEXT_FORMAT.CODE }],
            direction: 'ltr',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    }
    expect(lexicalToMarkdown(doc)).toBe('`snippet`')
  })

  it('converts link back to markdown', () => {
    const doc: LexicalDocument = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'link',
                fields: { url: 'https://example.com', newTab: false, linkType: 'custom' },
                children: [{ type: 'text', text: 'Click', format: 0 }],
              },
            ],
            direction: 'ltr',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    }
    expect(lexicalToMarkdown(doc)).toBe('[Click](https://example.com)')
  })

  it('converts bullet list back to markdown', () => {
    const doc: LexicalDocument = {
      root: {
        type: 'root',
        children: [
          {
            type: 'list',
            listType: 'bullet',
            tag: 'ul',
            children: [
              {
                type: 'listitem',
                value: 1,
                children: [
                  {
                    type: 'paragraph',
                    children: [{ type: 'text', text: 'Item', format: 0 }],
                    direction: 'ltr',
                  },
                ],
              },
            ],
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    }
    expect(lexicalToMarkdown(doc)).toBe('- Item')
  })

  it('converts numbered list back to markdown', () => {
    const doc: LexicalDocument = {
      root: {
        type: 'root',
        children: [
          {
            type: 'list',
            listType: 'number',
            tag: 'ol',
            children: [
              {
                type: 'listitem',
                value: 1,
                children: [
                  {
                    type: 'paragraph',
                    children: [{ type: 'text', text: 'First', format: 0 }],
                    direction: 'ltr',
                  },
                ],
              },
            ],
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    }
    expect(lexicalToMarkdown(doc)).toBe('1. First')
  })

  it('converts code block back to markdown', () => {
    const doc: LexicalDocument = {
      root: {
        type: 'root',
        children: [
          {
            type: 'code',
            language: 'js',
            children: [{ type: 'code-highlight', text: 'const x = 1' }],
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    }
    expect(lexicalToMarkdown(doc)).toBe('```js\nconst x = 1\n```')
  })

  it('converts blockquote back to markdown', () => {
    const doc: LexicalDocument = {
      root: {
        type: 'root',
        children: [
          {
            type: 'quote',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', text: 'Quote text', format: 0 }],
                direction: 'ltr',
              },
            ],
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    }
    expect(lexicalToMarkdown(doc)).toBe('> Quote text')
  })

  it('converts horizontal rule back to markdown', () => {
    const doc: LexicalDocument = {
      root: {
        type: 'root',
        children: [{ type: 'horizontalrule' }],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    }
    expect(lexicalToMarkdown(doc)).toBe('---')
  })

  it('roundtrip: paragraph survives markdown → lexical → markdown', () => {
    const original = 'Simple paragraph text'
    const doc = markdownToLexical(original)
    expect(lexicalToMarkdown(doc)).toBe(original)
  })

  it('roundtrip: heading survives markdown → lexical → markdown', () => {
    const original = '# Main Title'
    const doc = markdownToLexical(original)
    expect(lexicalToMarkdown(doc)).toBe(original)
  })

  it('roundtrip: code block survives markdown → lexical → markdown', () => {
    const original = '```python\nprint("hello")\n```'
    const doc = markdownToLexical(original)
    expect(lexicalToMarkdown(doc)).toBe(original)
  })

  it('roundtrip: horizontal rule survives markdown → lexical → markdown', () => {
    const original = '---'
    const doc = markdownToLexical(original)
    expect(lexicalToMarkdown(doc)).toBe(original)
  })
})
