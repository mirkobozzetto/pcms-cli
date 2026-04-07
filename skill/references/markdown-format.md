# Markdown Format Reference

## Frontmatter fields

```yaml
---
title: "Article Title"
slug: "article-slug"
excerpt: "Short description for SEO and listing pages"
status: "draft"
publishedAt: "2026-04-07T10:00:00.000Z"
---
```

| Field | Required | Description |
|---|---|---|
| title | yes | Document title |
| slug | no | URL slug (auto-generated from title if omitted) |
| excerpt | no | Short description |
| status | no | draft, review, or published (defaults to draft) |
| publishedAt | no | ISO date string, auto-set on publish if omitted |

## Body format

Standard markdown. Converted to Payload's Lexical rich text format on import.

Supported elements:

| Markdown | Lexical node |
|---|---|
| `# Heading` | HeadingNode (h1-h6) |
| `Regular text` | ParagraphNode |
| `**bold**` | TextNode format=bold |
| `*italic*` | TextNode format=italic |
| `` `code` `` | TextNode format=code |
| `[text](url)` | LinkNode |
| `- item` | ListNode (bullet) |
| `1. item` | ListNode (number) |
| ` ```lang ``` ` | CodeNode |
| `> quote` | QuoteNode |
| `---` | HorizontalRuleNode |

## Example article

```markdown
---
title: "Hallucinations IA juridique : risques pour les avocats"
slug: "hallucinations-ia-juridique"
excerpt: "Stanford a documenté 17-33% d'erreurs chez les leaders du marché"
status: "draft"
---

# Les hallucinations IA dans le domaine juridique

L'IA juridique promet un gain de temps considérable, mais les risques sont réels.

## Le problème documenté

En 2025, **Stanford Law School** a révélé que les outils d'IA juridique les plus utilisés produisent entre 17 et 33% de réponses incorrectes.

- Lexis+ AI : 17% d'hallucinations
- Westlaw AI : 33% d'hallucinations
- 729 avocats ont soumis des citations inventées

## Ce que ça implique

> Un seul cas de citation inventée peut engager la responsabilité professionnelle de l'avocat.

Les cabinets doivent vérifier systématiquement chaque source citée par l'IA.

## La solution : traçabilité des sources

Une approche RAG (Retrieval-Augmented Generation) permet de :

1. Travailler sur ses propres documents
2. Citer exactement la source de chaque réponse
3. Vérifier en un clic le passage original
```

## Import command

```bash
pcms import ./article.md --collection posts --status draft
```

## Export command

```bash
pcms export posts 42 -f md -o ./exported-article.md
```

The exported file will have the same frontmatter + body format, ready to be re-imported or edited.
