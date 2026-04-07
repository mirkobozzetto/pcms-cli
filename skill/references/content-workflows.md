# Content Workflows Reference

## Import a markdown article

```bash
pcms import ./article.md --collection posts --status draft
```

The markdown file should have YAML frontmatter. See [markdown-format.md](markdown-format.md) for the format.

## Export a document to markdown

```bash
pcms export posts 42 -f md -o ./article.md
pcms export posts 42 -f json -o ./article.json
pcms export posts 42 -f md   # stdout
```

## Batch import a folder of markdown files

```bash
for f in ./articles/*.md; do
  pcms import "$f" --collection posts --status draft
  echo "Imported: $f"
done
```

## Generate content and import

When the user asks to "write an article about X", the workflow is:

1. Generate the markdown content (with frontmatter)
2. Write to a temporary file
3. Import via pcms

```bash
# 1. Write the markdown file
# (Claude generates the content)
cat > /tmp/article.md << 'ARTICLE'
---
title: "Article Title"
slug: "article-slug"
excerpt: "Short description"
status: "draft"
---

Article content here...
ARTICLE

# 2. Import it
pcms import /tmp/article.md --collection posts --status draft
```

## Create with category and tags

Categories and tags are relations. You need their IDs:

```bash
# Find category ID
pcms documents list categories --where 'label[like]=juridique'

# Find tag IDs
pcms documents list tags --where 'label[like]=ia'

# Create post with relations (use the IDs from above)
pcms documents create posts --data '{
  "title": "Mon article",
  "status": "draft",
  "category": 1,
  "tags": [1, 2]
}'
```

## Full content pipeline

Complete flow from writing to publishing:

```bash
# 1. Create category if needed
pcms documents create categories --data '{"label":"IA Juridique"}'

# 2. Upload cover image
pcms media upload ./cover.jpg --alt "Cover"

# 3. Import the article
pcms import ./article.md --collection posts --status draft

# 4. Check the draft
pcms documents list posts --where 'status[equals]=draft' --sort '-createdAt' --limit 1

# 5. When ready, publish
pcms publish posts <id>
```

## Export all posts for backup

```bash
pcms documents list posts --limit 100 | \
  node -e "const d=require('fs').readFileSync('/dev/stdin','utf8');const docs=JSON.parse(d);for(const doc of docs){console.log(doc.id)}" | \
  while read id; do
    pcms export posts "$id" -f md -o "./backup/post-${id}.md"
  done
```
