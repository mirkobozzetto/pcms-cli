import type { Command } from 'commander'
import { printError, printSuccess } from '../lib/output.js'
import { resolveAPI } from './auth.js'

export function registerCollectionCommands(program: Command): void {
  const collections = program
    .command('collections')
    .description('List all available collections')
    .option('--domain <domain>', 'Profile domain to use')
    .action(async (options: { domain?: string }): Promise<void> => {
      try {
        const api = await resolveAPI(options.domain ? { domain: options.domain } : {})
        const access = await api.getAccess()
        const names = Object.keys(access.collections)
        if (names.length === 0) {
          printSuccess('No accessible collections.')
          return
        }
        for (const name of names) {
          printSuccess(name)
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  collections
    .command('schema <collection>')
    .description('Show fields and types of the first document in a collection')
    .option('--domain <domain>', 'Profile domain to use')
    .action(async (collection: string, options: { domain?: string }): Promise<void> => {
      try {
        const api = await resolveAPI(options.domain ? { domain: options.domain } : {})
        const result = await api.find(collection, { limit: 1 })
        const doc = result.docs[0]
        if (!doc) {
          printSuccess(`No document found in collection: ${collection}`)
          return
        }
        for (const [field, value] of Object.entries(doc)) {
          const type = value === null ? 'null' : typeof value
          printSuccess(`${field}: ${type}`)
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  collections
    .command('count <collection>')
    .description('Count documents in a collection')
    .option('--domain <domain>', 'Profile domain to use')
    .option('--where <where>', 'Filtre JSON where')
    .action(
      async (collection: string, options: { domain?: string; where?: string }): Promise<void> => {
        try {
          const api = await resolveAPI(options.domain ? { domain: options.domain } : {})
          const params: { where?: string } = options.where ? { where: options.where } : {}
          const result = await api.count(collection, params)
          printSuccess(`${collection}: ${result.totalDocs} documents`)
        } catch (err) {
          printError(err instanceof Error ? err.message : String(err))
          process.exit(1)
        }
      },
    )
}
