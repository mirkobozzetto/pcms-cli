import type { Command } from 'commander'
import { PayloadAPI } from '../lib/api.js'
import { getProfile } from '../lib/config.js'
import { printError, printSuccess } from '../lib/output.js'

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

export function registerMediaCommands(program: Command): void {
  const media = program.command('media').description('Manage Payload CMS media')

  media
    .command('upload <file>')
    .description('Upload a media file')
    .option('--alt <alt>', 'Media alt text')
    .option('--locale <locale>', 'Media locale')
    .option('--domain <domain>', 'Profile domain to use')
    .action(
      async (
        file: string,
        options: { alt?: string; locale?: string; domain?: string },
      ): Promise<void> => {
        try {
          const api = resolveAPI(options.domain)
          const result = await api.upload(file, {
            alt: options.alt,
            locale: options.locale,
          })
          const doc = result.doc
          printSuccess(`id: ${String(doc.id)}`)
          printSuccess(`filename: ${doc.filename}`)
          printSuccess(`url: ${doc.url}`)
        } catch (err) {
          printError(err instanceof Error ? err.message : String(err))
          process.exit(1)
        }
      },
    )
}
