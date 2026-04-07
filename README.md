# pcms-cli

A CLI to control [Payload CMS](https://payloadcms.com) from the terminal.

I built this because I wanted to manage my Payload content without opening the admin panel every time. The main use case: generating blog posts programmatically from Claude Code or any script, pushing drafts, publishing, importing markdown files — all from the command line.

It wraps the Payload REST API in a single `pcms` command. Nothing fancy, just every endpoint Payload exposes, accessible from your shell.

## Why

- Write an article in markdown, `pcms import` it as a draft, review in the admin, publish with `pcms publish`
- Script content creation from Claude Code or any automation tool
- Manage multiple Payload instances from one place (staging, prod, etc.)
- Quick lookups without loading the admin UI — list posts, check a document, inspect a schema

## Install

```bash
npm install -g pcms-cli
# or
pnpm add -g pcms-cli
```

From source:

```bash
git clone https://github.com/mirkobozzetto/pcms-cli.git
cd pcms-cli
pnpm install
pnpm build
pnpm link --global
```

Needs Node.js 18+.

## Getting started

```bash
# Login to your Payload instance
pcms auth login --domain https://your-site.com --email admin@your-site.com

# See what's there
pcms collections
pcms documents list posts --limit 5

# Create a draft from a markdown file
pcms import ./my-article.md --collection posts

# Or create directly
pcms documents create posts --title "Hello" --status draft

# Publish when ready
pcms publish posts 42
```

## Commands

### Auth

```bash
pcms auth login [--domain <url>] [--email <email>] [--password <pass>]
pcms auth status
pcms auth me
pcms auth logout [--domain <url>]
pcms auth profiles
```

Credentials are stored in `~/.config/pcms/credentials.json`. Supports multiple profiles for different Payload instances.

### Collections

```bash
pcms collections                              # list all collections
pcms collections schema <collection>          # show fields and types
pcms collections count <collection> [--where] # count documents
```

### Documents

```bash
pcms documents list <collection> [--where --sort --limit --page --depth --locale]
pcms documents get <collection> <id> [--depth --locale]
pcms documents create <collection> [--data <json> | --md --input <file> | --title --content --status --slug --excerpt]
pcms documents update <collection> <id> [--data <json> | --title --status ...]
pcms documents delete <collection> <id> [--force]
```

### Publishing

```bash
pcms publish <collection> <id> [--status-field <field> --value <value>]
pcms unpublish <collection> <id> [--status-field <field> --value <value>]
```

### Media

```bash
pcms media upload <file> [--alt <text> --locale <code>]
```

### Search

```bash
pcms search <query> [--limit --page]
```

### Export / Import

```bash
pcms export <collection> <id> [-f json|md] [-o <file>]
pcms import <file> [-c <collection>] [--status draft]
```

Export to markdown or JSON. Import from markdown with YAML frontmatter:

```markdown
---
title: 'My Article'
slug: 'my-article'
excerpt: 'Short description'
status: 'draft'
---

Article content in markdown. Headings, bold, italic, links, lists, code blocks — all converted to Payload's Lexical format.
```

### Versions

```bash
pcms versions <collection> <id> [--limit --page]
pcms version <collection> <versionId> [--depth]
pcms restore <collection> <versionId>
```

### Globals

```bash
pcms globals [slug] [--depth --locale]
pcms global:update <slug> --data <json> [--locale --depth]
```

## Where clause

The `--where` option passes through to Payload's REST API:

```bash
pcms documents list posts --where 'status[equals]=published'
pcms documents list posts --where 'title[like]=payload&status[equals]=draft'
pcms collections count posts --where 'publishedAt[exists]=true'
```

Operators: `equals`, `not_equals`, `greater_than`, `less_than`, `like`, `contains`, `in`, `not_in`, `exists`.

## Stack

- TypeScript (strict, no `any`)
- Commander.js for CLI parsing
- Native `fetch` (Node 18+)
- Zero runtime dependencies beyond Commander
- Vitest for tests

## Development

```bash
pnpm install
pnpm build       # compile to dist/
pnpm test        # run tests
pnpm typecheck   # check types
pnpm format      # format with prettier
pnpm check       # typecheck + lint + test
```

## Contributing

Open an issue first. Then:

1. Fork the repo
2. Create your branch (`git checkout -b feat/my-feature`)
3. Make sure `pnpm check` passes
4. Open a PR

## API Reference

This CLI wraps the [Payload REST API](https://payloadcms.com/docs/rest-api/overview). Every endpoint is supported.

## License

[MIT](LICENSE) — Mirko Bozzetto
