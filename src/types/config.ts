/**
 * Configuration and credential types for pcms CLI.
 */

export interface Profile {
  readonly domain: string
  readonly email: string
  readonly password: string
}

export interface Config {
  readonly profiles: Readonly<Record<string, Profile>>
  readonly default: string | null
}

export const DEFAULT_CONFIG: Config = {
  profiles: {},
  default: null,
} as const
