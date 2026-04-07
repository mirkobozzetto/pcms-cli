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

export function registerVersionCommands(program: Command): void {
  program
    .command('versions <collection> <id>')
    .description("List versions of a document")
    .option('--limit <limit>', 'Number of versions to return', '10')
    .option('--page <page>', 'Results page')
    .option('--domain <domain>', 'Profile domain to use')
    .action(
      async (
        collection: string,
        id: string,
        options: { limit?: string; page?: string; domain?: string },
      ): Promise<void> => {
        const api = resolveAPI(options.domain)
        const params: { limit?: number; page?: number } = {}
        if (options.limit !== undefined) params.limit = parseInt(options.limit, 10)
        if (options.page !== undefined) params.page = parseInt(options.page, 10)
        const result = await api.findVersions(collection, id, params)
        if (result.docs.length === 0) {
          printSuccess('No versions found.')
          return
        }
        for (const doc of result.docs) {
          printSuccess(
            `${doc.id}  status=${doc.version['_status'] ?? 'unknown'}  updatedAt=${doc.updatedAt}`,
          )
        }
      },
    )

  program
    .command('version <collection> <versionId>')
    .description('Show a specific version')
    .option('--depth <depth>', 'Relation population depth')
    .option('--domain <domain>', 'Profile domain to use')
    .action(
      async (
        collection: string,
        versionId: string,
        options: { depth?: string; domain?: string },
      ): Promise<void> => {
        const api = resolveAPI(options.domain)
        const params: { depth?: number } = {}
        if (options.depth !== undefined) params.depth = parseInt(options.depth, 10)
        const result = await api.getVersion(collection, versionId, params)
        printJson(result)
      },
    )

  program
    .command('restore <collection> <versionId>')
    .description("Restore a version of a document")
    .option('--domain <domain>', 'Profile domain to use')
    .action(
      async (
        collection: string,
        versionId: string,
        options: { domain?: string },
      ): Promise<void> => {
        const api = resolveAPI(options.domain)
        await api.restoreVersion(collection, versionId)
        printSuccess(`Version ${versionId} successfully restored in collection ${collection}.`)
      },
    )
}
