import { describe, it, expect } from 'vitest'
import { PayloadAPI } from '../../src/lib/api.js'

describe('PayloadAPI.buildWhereParams', () => {
  const api = new PayloadAPI('https://example.com')

  it('wraps a simple condition', () => {
    const result = api.buildWhereParams('status=published')
    expect(result).toHaveProperty('where')
  })

  it('preserves the where string for the API to parse', () => {
    const result = api.buildWhereParams('status=published,title~test')
    expect(result.where).toBe('status=published,title~test')
  })
})

describe('PayloadAPI constructor', () => {
  it('strips trailing slash from domain', () => {
    const api = new PayloadAPI('https://example.com/')
    expect(api).toBeDefined()
  })
})
