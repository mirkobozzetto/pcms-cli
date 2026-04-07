import type { Command } from 'commander'
import { readFileSync } from 'node:fs'
import { markdownToLexical, parseFrontmatter } from '../lib/markdown.js'
import { printError, printJson, printSuccess } from '../lib/output.js'
import { promptText } from '../lib/prompt.js'
import { resolveAPI } from './auth.js'

interface ListOptions {
  domain?: string
  where?: string
  sort?: string
  limit?: string
  page?: string
  depth?: string
  locale?: string
}

interface GetOptions {
  domain?: string
  depth?: string
  locale?: string
}

interface CreateOptions {
  domain?: string
  data?: string
  md?: string
  input?: string
  title?: string
  content?: string
  status?: string
  slug?: string
  excerpt?: string
  locale?: string
  depth?: string
}

interface UpdateOptions {
  domain?: string
  data?: string
  title?: string
  content?: string
  status?: string
  slug?: string
  excerpt?: string
  locale?: string
  depth?: string
}

interface DeleteOptions {
  domain?: string
  force?: boolean
}

function parseIntOption(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? undefined : parsed
}

function buildDocumentData(opts: CreateOptions | UpdateOptions): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  if (opts.title !== undefined) data['title'] = opts.title
  if (opts.status !== undefined) data['status'] = opts.status
  if (opts.slug !== undefined) data['slug'] = opts.slug
  if (opts.excerpt !== undefined) data['excerpt'] = opts.excerpt

  if (opts.content !== undefined) {
    data['content'] = markdownToLexical(opts.content)
  }

  return data
}

export function registerDocumentCommands(program: Command): void {
  const docs = program.command('documents').description('Manage Payload CMS documents')

  docs
    .command('list <collection>')
    .description('List documents in a collection')
    .option('-d, --domain <domain>', 'Payload CMS domain URL')
    .option('--where <where>', 'JSON or where string filter')
    .option('--sort <sort>', 'Sort field (e.g., -createdAt)')
    .option('--limit <limit>', 'Number of documents per page')
    .option('--page <page>', 'Page number')
    .option('--depth <depth>', 'Relation resolution depth')
    .option('--locale <locale>', 'Locale code')
    .action(async (collection: string, opts: ListOptions) => {
      try {
        const api = await resolveAPI(opts)
        const result = await api.find(collection, {
          where: opts.where,
          sort: opts.sort,
          limit: parseIntOption(opts.limit),
          page: parseIntOption(opts.page),
          depth: parseIntOption(opts.depth),
          locale: opts.locale,
        })
        printJson(result)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  docs
    .command('get <collection> <id>')
    .description('Get a document by ID')
    .option('-d, --domain <domain>', 'Payload CMS domain URL')
    .option('--depth <depth>', 'Relation resolution depth')
    .option('--locale <locale>', 'Locale code')
    .action(async (collection: string, id: string, opts: GetOptions) => {
      try {
        const api = await resolveAPI(opts)
        const result = await api.findByID(collection, id, {
          depth: parseIntOption(opts.depth),
          locale: opts.locale,
        })
        printJson(result)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  docs
    .command('create <collection>')
    .description('Create a new document')
    .option('-d, --domain <domain>', 'Payload CMS domain URL')
    .option('--data <json>', 'Document JSON data')
    .option('--md <path>', 'Markdown file with frontmatter to convert to Lexical')
    .option('--input <path>', 'Path to JSON data file')
    .option('--title <title>', 'Document title')
    .option('--content <content>', 'Document Markdown content')
    .option('--status <status>', 'Document status (draft, published)', 'draft')
    .option('--slug <slug>', 'Document slug')
    .option('--excerpt <excerpt>', 'Document excerpt')
    .option('--locale <locale>', 'Locale code')
    .option('--depth <depth>', 'Relation resolution depth')
    .action(async (collection: string, opts: CreateOptions) => {
      try {
        const api = await resolveAPI(opts)
        let documentData: Record<string, unknown> = {}

        if (opts.md !== undefined) {
          const raw = readFileSync(opts.md, 'utf-8')
          const { meta, body } = parseFrontmatter(raw)
          documentData = { ...meta }
          documentData['content'] = markdownToLexical(body)
        } else if (opts.input !== undefined) {
          const raw = readFileSync(opts.input, 'utf-8')
          documentData = JSON.parse(raw) as Record<string, unknown>
        } else if (opts.data !== undefined) {
          documentData = JSON.parse(opts.data) as Record<string, unknown>
        }

        const fieldData = buildDocumentData(opts)
        documentData = { ...documentData, ...fieldData }

        const result = await api.create(collection, documentData, {
          locale: opts.locale,
          depth: parseIntOption(opts.depth),
        })
        printSuccess(`Document created: ${String(result.doc.id)}`)
        printJson(result.doc)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  docs
    .command('update <collection> <id>')
    .description('Update an existing document')
    .option('-d, --domain <domain>', 'Payload CMS domain URL')
    .option('--data <json>', 'JSON data to merge')
    .option('--title <title>', 'New document title')
    .option('--content <content>', 'New Markdown content')
    .option('--status <status>', 'New document status')
    .option('--slug <slug>', 'New slug')
    .option('--excerpt <excerpt>', 'New excerpt')
    .option('--locale <locale>', 'Locale code')
    .option('--depth <depth>', 'Relation resolution depth')
    .action(async (collection: string, id: string, opts: UpdateOptions) => {
      try {
        const api = await resolveAPI(opts)
        let documentData: Record<string, unknown> = {}

        if (opts.data !== undefined) {
          documentData = JSON.parse(opts.data) as Record<string, unknown>
        }

        const fieldData = buildDocumentData(opts)
        documentData = { ...documentData, ...fieldData }

        const result = await api.update(collection, id, documentData, {
          locale: opts.locale,
          depth: parseIntOption(opts.depth),
        })
        printSuccess(`Document updated: ${String(result.doc.id)}`)
        printJson(result.doc)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  docs
    .command('delete <collection> <id>')
    .description('Delete a document')
    .option('-d, --domain <domain>', 'Payload CMS domain URL')
    .option('--force', 'Delete without asking for confirmation')
    .action(async (collection: string, id: string, opts: DeleteOptions) => {
      try {
        if (opts.force !== true) {
          const answer = await promptText(
            `Confirm deletion of document "${id}" in "${collection}" ? (yes/no): `,
          )
          if (answer.toLowerCase() !== 'yes') {
            printSuccess('Deletion cancelled')
            return
          }
        }

        const api = await resolveAPI(opts)
        const result = await api.deleteDoc(collection, id)
        printSuccess(`Document deleted: ${String(result.doc.id)}`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
