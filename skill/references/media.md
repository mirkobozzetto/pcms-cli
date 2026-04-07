# Media Reference

## Upload a file

```bash
pcms media upload <file> [options]

Options:
  --alt <text>       Alt text for accessibility
  --locale <code>    Locale
  --domain <url>     Target instance
```

Examples:

```bash
pcms media upload ./hero.jpg --alt "Hero image for blog post"
pcms media upload ./document.pdf --alt "Legal document PDF"
pcms media upload ./screenshot.png
```

Output includes the media ID and URL. Use the media ID when creating documents with `featuredImage` or similar fields:

```bash
# Upload then create post with that image
pcms media upload ./cover.jpg --alt "Article cover"
# note the ID from output, e.g. 42
pcms documents create posts --data '{"title":"My Post","featuredImage":42,"status":"draft"}'
```

## Supported formats

Images: jpg, jpeg, png, gif, webp, svg
Documents: pdf
Video: mp4, webm
Audio: mp3

## Batch upload

```bash
for f in ./images/*.jpg; do
  pcms media upload "$f" --alt "$(basename "$f" .jpg)"
done
```
