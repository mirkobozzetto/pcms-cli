# pcms-cli

A CLI to control [Payload CMS](https://payloadcms.com) from the terminal.

I built this because I needed to create blog posts, push drafts, and manage content on my Payload instances without opening the admin panel. I use it mainly through Claude Code — I tell it what I want in plain language and it handles the rest. But it works just as well from a regular shell, a script, or any CI pipeline.

## Quick examples

```bash
# Import a markdown article as a draft
pcms import ./article.md --collection posts

# List published posts
pcms documents list posts --where 'status[equals]=published' --sort '-publishedAt'

# Publish a draft
pcms publish posts 42

# Upload an image
pcms media upload ./hero.jpg --alt "Article cover"

# Export a post back to markdown
pcms export posts 42 -f md -o ./backup.md
```

## Claude Code Skill

The repo includes a Claude Code skill (`.claude/skills/`). This is how I use pcms day-to-day — through natural language inside Claude Code:

```
/pcms create a draft post about AI hallucinations in legal tech
/pcms list my drafts
/pcms import all the markdown files in ./articles/
/pcms publish posts 42
/pcms how many published posts do I have
```

The skill figures out the right `pcms` command, checks your auth, runs it, and formats the output. It ships with reference docs for every feature.

To install the skill after cloning:

```bash
ln -s /path/to/pcms-cli/.claude/skills ~/.claude/skills/pcms
```

## Install

```bash
npm install -g @mirkobozzetto/pcms-cli
```

From source:

```bash
git clone https://github.com/mirkobozzetto/pcms-cli.git
cd pcms-cli
pnpm install && pnpm build && pnpm link --global
```

Needs Node.js 18+.

## Setup

```bash
pcms auth login --domain https://your-site.com --email admin@your-site.com --password 'yourpassword'

# Check it works
pcms collections
```

If you're in an interactive terminal, you can omit `--password` and it will be prompted with hidden input. From scripts or Claude Code, always pass `--password` explicitly.

Supports multiple instances — just `pcms auth login` again with a different domain. The last one becomes the default, or use `--domain` on any command.

## Commands

### Content lifecycle

The typical flow: create → review → publish.

```bash
# Create from a markdown file (best for articles)
pcms import ./article.md --collection posts --status draft

# Or create inline
pcms documents create posts --title "My Post" --status draft --excerpt "Short desc"

# Or from raw JSON
pcms documents create posts --data '{"title":"My Post","status":"draft","category":1}'

# Check your drafts
pcms documents list posts --where 'status[equals]=draft' --limit 10

# Read a specific post
pcms documents get posts 42

# Edit it
pcms documents update posts 42 --title "Better Title" --excerpt "Updated"

# Publish
pcms publish posts 42

# Changed your mind
pcms unpublish posts 42

# Delete (asks confirmation, use --force to skip)
pcms documents delete posts 42
```

### Media

```bash
pcms media upload ./image.jpg --alt "Description for accessibility"
# returns the media ID — use it in document creation
```

### Search

```bash
pcms search "keyword" --limit 10
```

Requires the Payload Search plugin.

### Export / Import

```bash
# Export to markdown (with frontmatter)
pcms export posts 42 -f md -o ./post.md

# Export to JSON
pcms export posts 42 -f json -o ./post.json

# Import markdown with frontmatter
pcms import ./article.md --collection posts --status draft

# Batch import a folder
for f in ./articles/*.md; do pcms import "$f" --collection posts; done
```

Markdown format for import:

```markdown
---
title: 'My Article'
slug: 'my-article'
excerpt: 'Short description'
status: 'draft'
---

Content here. Supports headings, **bold**, _italic_, `code`, [links](url),
lists, code blocks, blockquotes — all converted to Payload's Lexical format.
```

### Collections info

```bash
pcms collections                                    # list all
pcms collections schema posts                       # show fields and types
pcms collections count posts                        # total count
pcms collections count posts --where 'status[equals]=published'
```

### Versions

```bash
pcms versions posts 42                  # list version history
pcms version posts <versionId>          # inspect a version
pcms restore posts <versionId>          # roll back
```

### Globals

```bash
pcms globals                            # list globals
pcms globals navigation                 # read one
pcms global:update nav --data '{"items":[{"label":"Home","url":"/"}]}'
```

### Auth management

```bash
pcms auth status          # current profile
pcms auth me              # user details from the API
pcms auth profiles        # all saved profiles
pcms auth logout           # remove current profile
```

## Where clause

Filter documents with Payload's query syntax:

```bash
pcms documents list posts --where 'status[equals]=published'
pcms documents list posts --where 'title[like]=juridique&status[not_equals]=draft'
pcms collections count posts --where 'publishedAt[exists]=true'
```

| Operator       | Example                    |
| -------------- | -------------------------- |
| `equals`       | `status[equals]=published` |
| `not_equals`   | `status[not_equals]=draft` |
| `greater_than` | `views[greater_than]=100`  |
| `less_than`    | `views[less_than]=50`      |
| `like`         | `title[like]=keyword`      |
| `exists`       | `publishedAt[exists]=true` |
| `in`           | `status[in]=draft,review`  |

## Stack

- TypeScript 6 (strict, zero `any`)
- Commander.js
- Native fetch (Node 18+)
- Single runtime dependency
- Vitest 4 for tests

## Development

```bash
pnpm install
pnpm build        # compile to dist/
pnpm test         # vitest
pnpm typecheck    # tsc --noEmit
pnpm format       # prettier
pnpm check        # all of the above
```

## Contributing

Open an issue first. Then fork, branch, `pnpm check`, PR.

## Links

- [Payload CMS](https://payloadcms.com)
- [Payload REST API docs](https://payloadcms.com/docs/rest-api/overview)

## License

[MIT](LICENSE) — Mirko Bozzetto
