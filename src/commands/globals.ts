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

export function registerGlobalCommands(program: Command): void {
  program
    .command('globals [slug]')
    .description('List accessible globals or show a specific global')
    .option('--depth <depth>', 'Relation population depth')
    .option('--locale <locale>', 'Locale to use')
    .option('--domain <domain>', 'Profile domain to use')
    .action(
      async (
        slug: string | undefined,
        options: { depth?: string; locale?: string; domain?: string },
      ): Promise<void> => {
        const api = resolveAPI(options.domain)
        if (slug !== undefined) {
          const params: { depth?: number; locale?: string } = {}
          if (options.depth !== undefined) params.depth = parseInt(options.depth, 10)
          if (options.locale !== undefined) params.locale = options.locale
          const result = await api.getGlobal(slug, params)
          printJson(result)
        } else {
          const access = await api.getAccess()
          const slugs = Object.keys(access.globals)
          if (slugs.length === 0) {
            printSuccess('No accessible globals.')
            return
          }
          for (const name of slugs) {
            printSuccess(name)
          }
        }
      },
    )

  program
    .command('global:update <slug>')
    .description('Update a global')
    .requiredOption('--data <data>', 'JSON data to send')
    .option('--locale <locale>', 'Locale to use')
    .option('--depth <depth>', 'Relation population depth')
    .option('--domain <domain>', 'Profile domain to use')
    .action(
      async (
        slug: string,
        options: { data: string; locale?: string; depth?: string; domain?: string },
      ): Promise<void> => {
        const api = resolveAPI(options.domain)
        let data: Record<string, unknown>
        try {
          data = JSON.parse(options.data) as Record<string, unknown>
        } catch {
          printError('The --data parameter must be valid JSON.')
          process.exit(1)
        }
        const params: { locale?: string; depth?: number } = {}
        if (options.locale !== undefined) params.locale = options.locale
        if (options.depth !== undefined) params.depth = parseInt(options.depth, 10)
        const result = await api.updateGlobal(slug, data, params)
        printJson(result)
      },
    )
}
