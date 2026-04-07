import { describe, it, expect } from 'vitest'
import { Command } from 'commander'
import { registerDocumentCommands } from '../../src/commands/documents.js'

describe('registerDocumentCommands', () => {
  it('registers a documents command group with list, get, create, update, delete', () => {
    const program = new Command()
    program.exitOverride()
    registerDocumentCommands(program)

    const docs = program.commands.find((c) => c.name() === 'documents')
    expect(docs).toBeDefined()

    const subcommands = docs?.commands.map((c) => c.name()) ?? []
    expect(subcommands).toContain('list')
    expect(subcommands).toContain('get')
    expect(subcommands).toContain('create')
    expect(subcommands).toContain('update')
    expect(subcommands).toContain('delete')
  })

  it('create command supports markdown import via --md and --input', () => {
    const program = new Command()
    program.exitOverride()
    registerDocumentCommands(program)

    const docs = program.commands.find((c) => c.name() === 'documents') as Command
    const create = docs.commands.find((c) => c.name() === 'create') as Command
    const optionNames = create.options.map((o) => o.long)
    expect(optionNames).toContain('--md')
    expect(optionNames).toContain('--input')
  })

  it('delete command has --force to skip confirmation', () => {
    const program = new Command()
    program.exitOverride()
    registerDocumentCommands(program)

    const docs = program.commands.find((c) => c.name() === 'documents') as Command
    const del = docs.commands.find((c) => c.name() === 'delete') as Command
    const optionNames = del.options.map((o) => o.long)
    expect(optionNames).toContain('--force')
  })
})
