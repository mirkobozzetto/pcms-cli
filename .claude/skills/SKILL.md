---
name: pcms
description: "Create posts, import markdown, publish, upload media, and manage content on any Payload CMS instance — directly from Claude Code. Full CRUD, versioning, search, globals. Requires pcms-cli (npm install -g pcms-cli). Use when user mentions 'pcms', 'payload', 'create post', 'import article', 'publish post', 'list posts', 'upload media', 'draft', 'blog post', 'export article', 'content pipeline', 'versions', 'globals'."
argument-hint: "<action> [options] — e.g. 'create a draft post about AI law' or 'list published posts'"
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
---

# PCMS — Payload CMS CLI

Manage content on any Payload CMS instance directly from the terminal.

Requires the `pcms` CLI: `npm install -g @mirkobozzetto/pcms-cli`
Source and docs: https://github.com/mirkobozzetto/pcms-cli

## Prerequisites

- `pcms` installed globally (`npm install -g @mirkobozzetto/pcms-cli`)
- Authenticated: `pcms auth login --domain https://your-site.com`

## Context

- Auth status: !`pcms auth status 2>&1`
- PCMS version: !`pcms --version 2>&1`

## Argument Routing

| User says                                      | Action                              | Reference                                                          |
| ---------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------ |
| `init`, `setup`, `configure`                   | Setup guide — install + auth        | (inline below)                                                     |
| `help`, `commands`, `reference`                | Show quick reference                | (inline below)                                                     |
| `create`, `new post`, `draft`, `write article` | Create document                     | [references/documents.md](references/documents.md)                 |
| `list`, `show posts`, `drafts`, `published`    | List/query documents                | [references/documents.md](references/documents.md)                 |
| `get`, `show`, `read post`                     | Get single document                 | [references/documents.md](references/documents.md)                 |
| `update`, `edit`, `modify`                     | Update document                     | [references/documents.md](references/documents.md)                 |
| `delete`, `remove`                             | Delete document                     | [references/documents.md](references/documents.md)                 |
| `publish`, `unpublish`                         | Change publication status           | [references/documents.md](references/documents.md)                 |
| `import`, `import markdown`                    | Import markdown file as document    | [references/content-workflows.md](references/content-workflows.md) |
| `export`                                       | Export document to JSON or markdown | [references/content-workflows.md](references/content-workflows.md) |
| `upload`, `image`, `media`                     | Upload media file                   | [references/media.md](references/media.md)                         |
| `search`                                       | Search content                      | [references/documents.md](references/documents.md)                 |
| `versions`, `restore`                          | Document version history            | [references/documents.md](references/documents.md)                 |
| `globals`                                      | Read/update globals                 | [references/documents.md](references/documents.md)                 |
| `collections`, `schema`, `count`               | Collection metadata                 | [references/documents.md](references/documents.md)                 |
| `batch import`, `import folder`                | Batch content import                | [references/content-workflows.md](references/content-workflows.md) |
| `generate`, `write about`                      | Generate content + import           | [references/content-workflows.md](references/content-workflows.md) |
| `login`, `logout`, `auth`, `profiles`          | Authentication                      | [references/auth.md](references/auth.md)                           |

When the user's intent is ambiguous, ask before executing.

## Setup Guide (triggered by `init`)

### Install

```bash
npm install -g @mirkobozzetto/pcms-cli
```

### Authenticate

```bash
pcms auth login --domain https://your-payload-instance.com
```

Email and password are prompted interactively. Credentials stored in `~/.config/pcms/credentials.json`.

### Verify

```bash
pcms collections
```

Should list available collections (posts, pages, categories, etc.).

## Quick Reference

```bash
# Auth
pcms auth login --domain <url> --email <email>
pcms auth status
pcms auth me
pcms auth profiles

# Collections
pcms collections
pcms collections schema <collection>
pcms collections count <collection> --where '<query>'

# Documents
pcms documents list <collection> --where '<query>' --sort '-createdAt' --limit 10
pcms documents get <collection> <id>
pcms documents list <collection> --draft  # include drafts
pcms documents create <collection> --title "Title" --status draft
pcms documents create <collection> --title "Title" --author 1 --category 3 --tags 5,8
pcms documents create <collection> --title "Title" --image ./photo.jpg  # upload + link
pcms documents create <collection> --md --input ./article.md
pcms documents update <collection> <id> --title "New Title" --status published
pcms documents delete <collection> <id> --force

# Publishing
pcms publish <collection> <id>
pcms unpublish <collection> <id>

# Media
pcms media upload ./image.jpg --alt "Description"

# Search
pcms search "query" --limit 10

# Import / Export
pcms import ./article.md --collection posts --status draft
pcms bulk-import ./posts-dir/ --collection posts --status draft
pcms export <collection> <id> -f md -o ./output.md

# Versions
pcms versions <collection> <id>
pcms restore <collection> <versionId>

# Globals
pcms globals
pcms globals <slug>
pcms global:update <slug> --data '{"key": "value"}'
```

## Critical Rules

1. **Always verify auth** before executing commands — if auth status fails, guide login
2. **Never delete without confirmation** — always use `--force` explicitly, and confirm with user first
3. **Default to draft** — when creating content, always use `--status draft` unless the user says otherwise
4. **Markdown import** — for articles with rich content, prefer `pcms import` with a markdown file over `--title/--content` flags
5. **Where clause** — use Payload's native syntax: `status[equals]=published`, `title[like]=keyword`
6. **Parse output** — pcms returns JSON for list/get/search commands. Extract relevant fields for clean display
7. **Batch operations** — use `pcms bulk-import ./directory/ --collection posts` instead of shell loops
8. **Error handling** — if a command fails, read the error message carefully. Common issues: auth expired (re-login), missing required fields, invalid collection name
9. **Lexical content with links** — the CLI's `markdownToLexical()` generates link nodes that may cause Lexical error #117 on some Payload versions. When creating content with links via `--data`, use this link node format:
   ```json
   {"type":"link","version":3,"format":"","indent":0,"direction":"ltr","fields":{"url":"https://...","linkType":"custom","newTab":true},"children":[{"mode":"normal","text":"link text","type":"text","format":0}]}
   ```
   For complex articles with many links, build the Lexical JSON via a Node.js script rather than using `--md` or `--content`.
10. **`_status` field** — Payload uses `_status` (with underscore) for the draft/publish system, not `status`. The CLI maps `--status` to `_status` automatically since v1.7.0.

## Service-Specific References

For detailed commands and workflow patterns:

- **Authentication**: See [references/auth.md](references/auth.md)
- **Documents**: See [references/documents.md](references/documents.md)
- **Media**: See [references/media.md](references/media.md)
- **Content workflows**: See [references/content-workflows.md](references/content-workflows.md)
- **Markdown format**: See [references/markdown-format.md](references/markdown-format.md)
