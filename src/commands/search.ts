import type { Command } from 'commander'
import { PayloadAPI } from '../lib/api.js'
import { getProfile } from '../lib/config.js'
import { printError, printJson, printSuccess } from '../lib/output.js'

function resolveAPI(domain: string | undefined): PayloadAPI {
  const profile = getProfile(domain)
  if (!profile) {
    printError(
      domain
        ? `Profile not found for domain: ${domain}`
        : "No default profile configured. Use `pcms auth login` first.",
    )
    process.exit(1)
  }
  return new PayloadAPI(profile.domain, profile.password)
}

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
          const api = resolveAPI(options.domain)
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
