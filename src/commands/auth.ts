import type { Command } from 'commander'
import { PayloadAPI } from '../lib/api.js'
import {
  getConfigPath,
  getDefaultDomain,
  getProfile,
  listProfiles,
  removeProfile,
  setProfile,
} from '../lib/config.js'
import { printError, printJson, printSuccess } from '../lib/output.js'
import { promptHidden, promptText } from '../lib/prompt.js'

async function resolveAPI(opts: { domain?: string }): Promise<PayloadAPI> {
  const domain = opts.domain ?? getDefaultDomain()
  if (domain === null) {
    throw new Error('No domain specified and no default domain configured')
  }
  const profile = getProfile(domain)
  if (profile === null) {
    throw new Error(`No profile found for domain: ${domain}`)
  }
  const api = new PayloadAPI(domain)
  await api.login(profile.email, profile.password)
  return api
}

export function registerAuthCommands(program: Command): void {
  const auth = program.command('auth').description("Manage Payload CMS authentication")

  auth
    .command('login')
    .description('Log in to a Payload CMS instance')
    .option('-d, --domain <domain>', 'Payload CMS domain URL')
    .option('-e, --email <email>', 'Email address')
    .option('-p, --password <password>', 'Password')
    .action(async (opts: { domain?: string; email?: string; password?: string }) => {
      try {
        const domain = opts.domain ?? (await promptText('Domain (e.g., https://cms.example.com): '))
        const email = opts.email ?? (await promptText('Email: '))
        const password = opts.password ?? (await promptHidden('Password: '))

        const api = new PayloadAPI(domain)
        await api.login(email, password)

        setProfile({ domain, email, password })
        printSuccess(`Successfully logged in to ${domain} as ${email}`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  auth
    .command('status')
    .description('Show current configuration status')
    .action(() => {
      try {
        const domain = getDefaultDomain()
        const configPath = getConfigPath()

        if (domain === null) {
          printSuccess('No profile configured')
          printSuccess(`Config file: ${configPath}`)
          return
        }

        const profile = getProfile(domain)
        if (profile === null) {
          printSuccess(`Default domain: ${domain} (profile not found)`)
          printSuccess(`Config file: ${configPath}`)
          return
        }

        printSuccess(`Default domain: ${domain}`)
        printSuccess(`Email: ${profile.email}`)
        printSuccess(`Config file: ${configPath}`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  auth
    .command('me')
    .description("Show logged-in user information")
    .option('-d, --domain <domain>', 'Payload CMS domain URL')
    .action(async (opts: { domain?: string }) => {
      try {
        const api = await resolveAPI(opts)
        const me = await api.me()
        printJson(me)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  auth
    .command('logout')
    .description('Log out and remove a profile')
    .option('-d, --domain <domain>', 'Domain URL to disconnect')
    .action((opts: { domain?: string }) => {
      try {
        const domain = opts.domain ?? getDefaultDomain()
        if (domain === null) {
          printError('No domain specified and no default domain configured')
          process.exit(1)
          return
        }

        const profile = getProfile(domain)
        if (profile === null) {
          printError(`No profile found for domain: ${domain}`)
          process.exit(1)
          return
        }

        removeProfile(domain)
        printSuccess(`Logged out from ${domain}`)
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  auth
    .command('profiles')
    .description('List all saved profiles')
    .action(() => {
      try {
        const profiles = listProfiles()
        const defaultDomain = getDefaultDomain()

        if (profiles.length === 0) {
          printSuccess('No profile configured')
          return
        }

        for (const profile of profiles) {
          const marker = profile.domain === defaultDomain ? ' (active)' : ''
          printSuccess(`${profile.domain} — ${profile.email}${marker}`)
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
