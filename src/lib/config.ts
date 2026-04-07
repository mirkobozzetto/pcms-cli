import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import type { Config, Profile } from '../types/config.js'
import { DEFAULT_CONFIG } from '../types/config.js'

export function getConfigPath(): string {
  return path.join(os.homedir(), '.config', 'pcms', 'credentials.json')
}

export function loadConfig(): Config {
  const configPath = getConfigPath()
  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG
  }
  const raw = fs.readFileSync(configPath, 'utf-8')
  return JSON.parse(raw) as Config
}

export function saveConfig(config: Config): void {
  const configPath = getConfigPath()
  const dir = path.dirname(configPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600, encoding: 'utf-8' })
}

export function setProfile(profile: Profile): Profile {
  const config = loadConfig()
  const updatedProfiles = { ...config.profiles, [profile.domain]: profile }
  const updatedConfig: Config = {
    profiles: updatedProfiles,
    default: profile.domain,
  }
  saveConfig(updatedConfig)
  return profile
}

export function getProfile(domain?: string): Profile | null {
  const config = loadConfig()
  if (domain !== undefined) {
    return config.profiles[domain] ?? null
  }
  if (config.default === null) {
    return null
  }
  return config.profiles[config.default] ?? null
}

export function getDefaultDomain(): string | null {
  const config = loadConfig()
  return config.default
}

export function listProfiles(): readonly Profile[] {
  const config = loadConfig()
  return Object.values(config.profiles)
}

export function removeProfile(domain: string): void {
  const config = loadConfig()
  const { [domain]: _removed, ...remainingProfiles } = config.profiles
  let newDefault = config.default
  if (newDefault === domain) {
    const remaining = Object.keys(remainingProfiles)
    newDefault = remaining.length > 0 ? (remaining[0] ?? null) : null
  }
  const updatedConfig: Config = {
    profiles: remainingProfiles,
    default: newDefault,
  }
  saveConfig(updatedConfig)
}
