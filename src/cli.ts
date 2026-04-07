import { createRequire } from 'node:module'
import { Command } from 'commander'
import { registerAuthCommands } from './commands/auth.js'
import { registerCollectionCommands } from './commands/collections.js'
import { registerDocumentCommands } from './commands/documents.js'
import { registerPublishingCommands } from './commands/publishing.js'
import { registerMediaCommands } from './commands/media.js'
import { registerSearchCommands } from './commands/search.js'
import { registerExportImportCommands } from './commands/export-import.js'
import { registerVersionCommands } from './commands/versions.js'
import { registerGlobalCommands } from './commands/globals.js'

const require = createRequire(import.meta.url)
const pkg = require('../package.json') as { version: string }

export function createProgram(): Command {
  const program = new Command()

  program.name('pcms').description('Payload CMS CLI').version(pkg.version)

  registerAuthCommands(program)
  registerCollectionCommands(program)
  registerDocumentCommands(program)
  registerPublishingCommands(program)
  registerMediaCommands(program)
  registerSearchCommands(program)
  registerExportImportCommands(program)
  registerVersionCommands(program)
  registerGlobalCommands(program)

  return program
}
