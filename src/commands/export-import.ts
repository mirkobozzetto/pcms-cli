import type { Command } from 'commander'
import * as fs from 'node:fs'
import { basename, join } from 'node:path'
import type { PayloadAPI } from '../lib/api.js'
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

interface BulkImportOptions {
  collection: string
  status?: string
  locale?: string
  domain?: string
}

async function importSingleFile(
  filePath: string,
  collection: string,
  api: PayloadAPI,
  statusOverride?: string,
  locale?: string,
): Promise<{ id: number | string; title: string }> {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { meta, body } = parseFrontmatter(raw)
  const lexicalBody = markdownToLexical(body)

  const data: Record<string, unknown> = {
    ...meta,
    content: lexicalBody,
  }

  if (statusOverride !== undefined) {
    data['_status'] = statusOverride
  } else if (meta['status'] !== undefined) {
    data['_status'] = meta['status']
  }

  const params: { locale?: string } = {}
  if (locale !== undefined) params.locale = locale

  const result = await api.create(collection, data, params)
  return { id: result.doc.id, title: String(data['title'] ?? '') }
}

function buildMarkdownOutput(doc: PayloadDocument): string {
  const title = typeof doc['title'] === 'string' ? doc['title'] : ''
  const slug = typeof doc['slug'] === 'string' ? doc['slug'] : ''
  const excerpt = typeof doc['excerpt'] === 'string' ? doc['excerpt'] : ''
  const status = typeof doc['_status'] === 'string' ? doc['_status'] : ''
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

        const api = await resolveAPI(opts)
        const result = await importSingleFile(file, collection, api, opts.status, opts.locale)
        printSuccess(`Document successfully imported to "${collection}" (id: ${result.id})`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  program
    .command('bulk-import <directory>')
    .description('Import all Markdown files from a directory')
    .requiredOption('-c, --collection <collection>', 'Target collection')
    .option('-s, --status <status>', 'Status override for all documents')
    .option('--locale <locale>', 'Document locale')
    .option('-d, --domain <domain>', 'Payload CMS domain URL')
    .action(async (directory: string, opts: BulkImportOptions) => {
      try {
        const api = await resolveAPI(opts)
        const files = fs
          .readdirSync(directory)
          .filter((f) => f.endsWith('.md'))
          .map((f) => join(directory, f))

        if (files.length === 0) {
          console.error('No .md files found in', directory)
          return
        }

        console.log(`Importing ${files.length} files into ${opts.collection}...`)

        let success = 0
        let failed = 0

        for (const file of files) {
          try {
            const result = await importSingleFile(
              file,
              opts.collection,
              api,
              opts.status,
              opts.locale,
            )
            console.log(`  OK ${basename(file)} -> ID ${result.id}`)
            success++
          } catch (err) {
            console.error(
              `  FAIL ${basename(file)}: ${err instanceof Error ? err.message : String(err)}`,
            )
            failed++
          }
        }

        console.log(`\nDone: ${success} imported, ${failed} failed`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
