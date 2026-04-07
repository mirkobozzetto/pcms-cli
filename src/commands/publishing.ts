import type { Command } from 'commander'
import { printError, printSuccess } from '../lib/output.js'
import { resolveAPI } from './auth.js'

interface PublishOptions {
  statusField: string
  value: string
  locale?: string
  domain?: string
}

interface UnpublishOptions {
  statusField: string
  value: string
  locale?: string
  domain?: string
}

export function registerPublishingCommands(program: Command): void {
  program
    .command('publish <collection> <id>')
    .description('Publish a document in a collection')
    .option('--status-field <field>', 'Status field to update', 'status')
    .option('--value <value>', 'Published status value', 'published')
    .option('--locale <locale>', 'Document locale')
    .option('--domain <domain>', 'Profile domain to use')
    .action(async (collection: string, id: string, options: PublishOptions): Promise<void> => {
      try {
        const api = await resolveAPI(options.domain ? { domain: options.domain } : {})
        const data: Record<string, unknown> = { [options.statusField]: options.value }
        const params = options.locale ? { locale: options.locale } : undefined
        await api.update(collection, id, data, params)
        printSuccess(`Published: ${collection}/${id}`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  program
    .command('unpublish <collection> <id>')
    .description('Unpublish a document in a collection')
    .option('--status-field <field>', 'Status field to update', 'status')
    .option('--value <value>', 'Unpublished status value', 'draft')
    .option('--locale <locale>', 'Document locale')
    .option('--domain <domain>', 'Profile domain to use')
    .action(async (collection: string, id: string, options: UnpublishOptions): Promise<void> => {
      try {
        const api = await resolveAPI(options.domain ? { domain: options.domain } : {})
        const data: Record<string, unknown> = { [options.statusField]: options.value }
        const params = options.locale ? { locale: options.locale } : undefined
        await api.update(collection, id, data, params)
        printSuccess(`Unpublished: ${collection}/${id}`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
