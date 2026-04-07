# Documents Reference

## List documents

```bash
pcms documents list <collection> [options]

Options:
  --where <query>    Filter: 'status[equals]=published', 'title[like]=keyword'
  --sort <field>     Sort: '-createdAt' (desc), 'title' (asc)
  --limit <n>        Results per page (default: 10)
  --page <n>         Page number
  --depth <n>        Populate relation depth
  --locale <code>    Locale (fr, en, etc.)
  --domain <url>     Target instance
```

Common queries:

```bash
# All published posts
pcms documents list posts --where 'status[equals]=published' --sort '-publishedAt'

# Drafts only
pcms documents list posts --where 'status[equals]=draft'

# Search by title
pcms documents list posts --where 'title[like]=juridique'

# With pagination
pcms documents list posts --limit 5 --page 2

# With populated relations
pcms documents list posts --depth 2
```

## Get single document

```bash
pcms documents get <collection> <id> [--depth <n>] [--locale <code>]
```

## Create document

```bash
# From flags
pcms documents create <collection> --title "Title" --status draft --excerpt "Short desc"

# From JSON
pcms documents create <collection> --data '{"title":"Title","status":"draft","category":"cat-id"}'

# From markdown file
pcms documents create <collection> --md --input ./article.md
```

## Update document

```bash
# Update specific fields
pcms documents update <collection> <id> --title "New Title"
pcms documents update <collection> <id> --status published
pcms documents update <collection> <id> --data '{"excerpt":"Updated excerpt"}'
```

## Delete document

```bash
pcms documents delete <collection> <id>          # asks for confirmation
pcms documents delete <collection> <id> --force   # skip confirmation
```

## Publish / Unpublish

```bash
pcms publish <collection> <id>
pcms unpublish <collection> <id>

# Custom status field
pcms publish <collection> <id> --status-field _status --value published
```

## Collections metadata

```bash
pcms collections                           # list all collections
pcms collections schema <collection>       # show fields and types
pcms collections count <collection>        # count documents
pcms collections count <collection> --where 'status[equals]=published'
```

## Search

```bash
pcms search "keyword" --limit 10 --page 1
```

Requires the Payload Search plugin to be active.

## Versions

```bash
pcms versions <collection> <id>              # list versions
pcms versions <collection> <id> --limit 5    # limit results
pcms version <collection> <versionId>        # show specific version
pcms restore <collection> <versionId>        # restore a version
```

## Globals

```bash
pcms globals                                 # list all globals
pcms globals <slug>                          # read a global
pcms global:update <slug> --data '{"key":"value"}'  # update a global
```

## Where clause syntax

| Operator        | Syntax                      | Example                    |
| --------------- | --------------------------- | -------------------------- |
| equals          | `field[equals]=value`       | `status[equals]=published` |
| not equals      | `field[not_equals]=value`   | `status[not_equals]=draft` |
| greater than    | `field[greater_than]=value` | `views[greater_than]=100`  |
| less than       | `field[less_than]=value`    | `views[less_than]=50`      |
| like (contains) | `field[like]=value`         | `title[like]=payload`      |
| exists          | `field[exists]=true`        | `publishedAt[exists]=true` |
| in              | `field[in]=a,b`             | `status[in]=draft,review`  |

Combine with `&`:

```bash
--where 'status[equals]=published&title[like]=juridique'
```
