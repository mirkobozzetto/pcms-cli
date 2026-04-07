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

function resolvePassword(opts: { password?: string }): string | null {
  if (opts.password !== undefined) return opts.password
  const envPassword = process.env['PCMS_PASSWORD']
  if (envPassword !== undefined && envPassword !== '') return envPassword
  return null
}

function validateDomain(domain: string): void {
  if (
    !domain.startsWith('https://') &&
    !domain.includes('localhost') &&
    !domain.includes('127.0.0.1')
  ) {
    throw new Error(
      `Refused insecure connection to ${domain}. Use https:// or --insecure for local dev.`,
    )
  }
}

export async function resolveAPI(opts: {
  domain?: string
  insecure?: boolean
}): Promise<PayloadAPI> {
  const domain = opts.domain ?? getDefaultDomain()
  if (domain === null) {
    throw new Error('No domain configured. Run: pcms auth login')
  }
  if (opts.insecure !== true) {
    validateDomain(domain)
  }
  const profile = getProfile(domain)
  if (profile === null) {
    throw new Error(`No profile for ${domain}. Run: pcms auth login`)
  }
  const api = new PayloadAPI(domain, profile.token)
  try {
    await api.me()
    return api
  } catch {
    const password = resolvePassword({})
    if (password !== null) {
      await api.login(profile.email, password)
      setProfile({ domain, email: profile.email, token: api.getToken() })
      return api
    }
    throw new Error(`Token expired for ${domain}. Run: pcms auth login`)
  }
}

export function registerAuthCommands(program: Command): void {
  const auth = program.command('auth').description('Manage authentication')

  auth
    .command('login')
    .description('Log in to a Payload CMS instance')
    .option('-d, --domain <domain>', 'Payload CMS domain URL (https)')
    .option('-e, --email <email>', 'Email address')
    .option('-p, --password <password>', 'Password (prefer PCMS_PASSWORD env var)')
    .option('--insecure', 'Allow http:// connections (local dev only)')
    .action(
      async (opts: { domain?: string; email?: string; password?: string; insecure?: boolean }) => {
        try {
          const domain = opts.domain ?? (await promptText('Domain: '))
          if (opts.insecure !== true) {
            validateDomain(domain)
          }
          const email = opts.email ?? (await promptText('Email: '))
          const password = resolvePassword(opts) ?? (await promptHidden('Password: '))

          const api = new PayloadAPI(domain)
          const result = await api.login(email, password)

          setProfile({ domain: api.getDomain(), email, token: result.token })
          printSuccess(`Logged in to ${api.getDomain()} as ${email}`)
        } catch (err) {
          printError(err instanceof Error ? err.message : String(err))
          process.exit(1)
        }
      },
    )

  auth
    .command('status')
    .description('Show current profile')
    .action(() => {
      const domain = getDefaultDomain()
      if (domain === null) {
        printSuccess('No profile configured')
        return
      }
      const profile = getProfile(domain)
      if (profile === null) {
        printSuccess(`Default domain: ${domain} (profile not found)`)
        return
      }
      printSuccess(`Domain: ${domain}`)
      printSuccess(`Email: ${profile.email}`)
      printSuccess(`Token: ${profile.token.slice(0, 20)}...`)
      printSuccess(`Config: ${getConfigPath()}`)
    })

  auth
    .command('me')
    .description('Show authenticated user details')
    .option('-d, --domain <domain>', 'Payload domain')
    .option('--insecure', 'Allow http://')
    .action(async (opts: { domain?: string; insecure?: boolean }) => {
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
    .description('Remove a saved profile')
    .option('-d, --domain <domain>', 'Domain to remove')
    .action((opts: { domain?: string }) => {
      const domain = opts.domain ?? getDefaultDomain()
      if (domain === null) {
        printError('No domain to log out from')
        return
      }
      removeProfile(domain)
      printSuccess(`Logged out from ${domain}`)
    })

  auth
    .command('profiles')
    .description('List all saved profiles')
    .action(() => {
      const profiles = listProfiles()
      const defaultDomain = getDefaultDomain()
      if (profiles.length === 0) {
        printSuccess('No profiles configured')
        return
      }
      for (const profile of profiles) {
        const marker = profile.domain === defaultDomain ? ' (active)' : ''
        printSuccess(`${profile.domain} — ${profile.email}${marker}`)
      }
    })
}
