import type { Command } from 'commander'
import * as fs from 'node:fs'
import { lexicalToMarkdown, markdownToLexical, parseFrontmatter } from '../lib/markdown.js'
import { printError, printSuccess } from '../lib/output.js'
import type { PayloadDocument } from '../types/api.js'
import type { LexicalDocument } from '../types/lexical.js'
import { resolveAPI } from './auth.js'

type ExportFormat = 'json' | 'md'

interface ExportOptions {
  format: ExportFormat
  output?: string
  depth?: string
  locale?: string
  domain?: string
}

interface ImportOptions {
  collection?: string
  status?: string
  locale?: string
  domain?: string
}

function buildMarkdownOutput(doc: PayloadDocument): string {
  const title = typeof doc['title'] === 'string' ? doc['title'] : ''
  const slug = typeof doc['slug'] === 'string' ? doc['slug'] : ''
  const excerpt = typeof doc['excerpt'] === 'string' ? doc['excerpt'] : ''
  const status = typeof doc['status'] === 'string' ? doc['status'] : ''
  const publishedAt = typeof doc['publishedAt'] === 'string' ? doc['publishedAt'] : ''
  const createdAt = typeof doc['createdAt'] === 'string' ? doc['createdAt'] : ''

  const frontmatterLines: string[] = ['---']
  if (title) frontmatterLines.push(`title: "${title}"`)
  if (slug) frontmatterLines.push(`slug: "${slug}"`)
  if (excerpt) frontmatterLines.push(`excerpt: "${excerpt}"`)
  if (status) frontmatterLines.push(`status: "${status}"`)
  if (publishedAt) frontmatterLines.push(`publishedAt: "${publishedAt}"`)
  if (createdAt) frontmatterLines.push(`createdAt: "${createdAt}"`)
  frontmatterLines.push('---')

  const bodyField = doc['content'] ?? doc['body'] ?? doc['richText']
  let bodyMd = ''
  if (bodyField !== null && bodyField !== undefined && typeof bodyField === 'object') {
    const lexicalDoc = bodyField as LexicalDocument
    if ('root' in lexicalDoc) {
      bodyMd = lexicalToMarkdown(lexicalDoc)
    }
  }

  return `${frontmatterLines.join('\n')}\n\n${bodyMd}`
}

export function registerExportImportCommands(program: Command): void {
  program
    .command('export <collection> <id>')
    .description('Export a document from Payload CMS')
    .option('-f, --format <format>', 'Output format: json or md', 'json')
    .option('-o, --output <path>', 'Output file (stdout by default)')
    .option('--depth <depth>', 'Relation resolution depth')
    .option('--locale <locale>', 'Document locale')
    .option('-d, --domain <domain>', 'Payload CMS domain URL')
    .action(async (collection: string, id: string, opts: ExportOptions) => {
      try {
        const api = await resolveAPI(opts)

        const params: { depth?: number; locale?: string } = {}
        if (opts.depth !== undefined) params.depth = parseInt(opts.depth, 10)
        if (opts.locale !== undefined) params.locale = opts.locale

        const doc = await api.findByID(collection, id, params)

        const format: ExportFormat = opts.format === 'md' ? 'md' : 'json'
        let output: string

        if (format === 'md') {
          output = buildMarkdownOutput(doc)
        } else {
          output = JSON.stringify(doc, null, 2)
        }

        if (opts.output !== undefined) {
          fs.writeFileSync(opts.output, output, 'utf-8')
          printSuccess(`Document exported to ${opts.output}`)
        } else {
          process.stdout.write(output + '\n')
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  program
    .command('import <file>')
    .description('Import a Markdown document into Payload CMS')
    .option('-c, --collection <collection>', 'Target collection (e.g., posts)')
    .option('-s, --status <status>', 'Imported document status (e.g., draft)')
    .option('--locale <locale>', 'Document locale')
    .option('-d, --domain <domain>', 'Payload CMS domain URL')
    .action(async (file: string, opts: ImportOptions) => {
      try {
        if (!fs.existsSync(file)) {
          throw new Error(`File not found: ${file}`)
        }

        const collection = opts.collection
        if (collection === undefined || collection === '') {
          throw new Error('Collection is required (--collection option)')
        }

        const raw = fs.readFileSync(file, 'utf-8')
        const { meta, body } = parseFrontmatter(raw)

        const lexicalBody = markdownToLexical(body)

        const data: Record<string, unknown> = {
          ...meta,
          content: lexicalBody,
        }

        if (opts.status !== undefined) {
          data['status'] = opts.status
        } else if (meta['status'] !== undefined) {
          data['status'] = meta['status']
        }

        const api = await resolveAPI(opts)

        const params: { locale?: string } = {}
        if (opts.locale !== undefined) params.locale = opts.locale

        const result = await api.create(collection, data, params)
        printSuccess(`Document successfully imported to "${collection}" (id: ${result.doc.id})`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
