import type { Command } from 'commander'
import { printError, printJson, printSuccess } from '../lib/output.js'
import { resolveAPI } from './auth.js'

export function registerSearchCommands(program: Command): void {
  program
    .command('search <query>')
    .description('Search Payload CMS content')
    .option('--limit <limit>', 'Number of results per page', '10')
    .option('--page <page>', 'Page number', '1')
    .option('--domain <domain>', 'Profile domain to use')
    .action(
      async (
        query: string,
        options: { limit: string; page: string; domain?: string },
      ): Promise<void> => {
        try {
          const api = await resolveAPI(options.domain ? { domain: options.domain } : {})
          const result = await api.search(query, {
            limit: Number(options.limit),
            page: Number(options.page),
          })
          printSuccess(`${result.totalDocs} results found`)
          printJson(result.docs)
        } catch (err) {
          printError(err instanceof Error ? err.message : String(err))
          process.exit(1)
        }
      },
    )
}
