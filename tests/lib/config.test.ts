import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
  setProfile,
  getProfile,
  getDefaultDomain,
  listProfiles,
  removeProfile,
  loadConfig,
  getConfigPath,
} from '../../src/lib/config.js'

let testDir: string

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os')
  return {
    ...actual,
    homedir: (): string => testDir,
  }
})

beforeEach(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pcms-test-'))
})

afterEach(() => {
  fs.rmSync(testDir, { recursive: true, force: true })
})

describe('config — real filesystem', () => {
  it('setProfile creates config file and stores credentials', () => {
    setProfile({
      domain: 'https://example.com',
      email: 'test@test.com',
      password: 'secret',
    })

    const configPath = getConfigPath()
    expect(fs.existsSync(configPath)).toBe(true)

    const raw = fs.readFileSync(configPath, 'utf8')
    const parsed = JSON.parse(raw) as Record<string, unknown>
    expect(parsed).toHaveProperty('default', 'https://example.com')
  })

  it('getProfile returns saved profile', () => {
    setProfile({
      domain: 'https://example.com',
      email: 'test@test.com',
      password: 'secret',
    })

    const profile = getProfile('https://example.com')
    expect(profile).not.toBeNull()
    expect(profile?.email).toBe('test@test.com')
  })

  it('getProfile returns null for unknown domain', () => {
    setProfile({
      domain: 'https://example.com',
      email: 'test@test.com',
      password: 'secret',
    })

    expect(getProfile('https://unknown.com')).toBeNull()
  })

  it('getDefaultDomain returns the last set profile domain', () => {
    setProfile({ domain: 'https://a.com', email: 'a@a.com', password: 'a' })
    setProfile({ domain: 'https://b.com', email: 'b@b.com', password: 'b' })

    expect(getDefaultDomain()).toBe('https://b.com')
  })

  it('listProfiles returns all saved profiles', () => {
    setProfile({ domain: 'https://a.com', email: 'a@a.com', password: 'a' })
    setProfile({ domain: 'https://b.com', email: 'b@b.com', password: 'b' })

    const profiles = listProfiles()
    expect(profiles).toHaveLength(2)
  })

  it('removeProfile deletes a profile and updates default', () => {
    setProfile({ domain: 'https://a.com', email: 'a@a.com', password: 'a' })
    setProfile({ domain: 'https://b.com', email: 'b@b.com', password: 'b' })

    removeProfile('https://b.com')

    expect(getProfile('https://b.com')).toBeNull()
    expect(getDefaultDomain()).toBe('https://a.com')
  })

  it('removeProfile sets default to null when removing last profile', () => {
    setProfile({ domain: 'https://a.com', email: 'a@a.com', password: 'a' })
    removeProfile('https://a.com')

    expect(getDefaultDomain()).toBeNull()
  })

  it('getProfile with no args returns default profile', () => {
    setProfile({ domain: 'https://a.com', email: 'a@a.com', password: 'a' })

    const profile = getProfile()
    expect(profile?.domain).toBe('https://a.com')
  })

  it('loadConfig returns default when no file exists', () => {
    const config = loadConfig()
    expect(config.default).toBeNull()
    expect(Object.keys(config.profiles)).toHaveLength(0)
  })
})
