# LA Show Board

Free daily live music show listings for Los Angeles powered by GitHub Pages + Actions + AI crawlers. Zero hosting costs.

## Quick Start

1. **Fork this repo**
2. **Add OpenAI API key** to repo secrets:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key from [platform.openai.com](https://platform.openai.com)
3. **Enable GitHub Pages** (Settings → Pages → Deploy from branch: `gh-pages`)
4. **Run workflow** (Actions → `shows-feed` → Run workflow)

Your show board: `https://YOUR_USERNAME.github.io/REPO_NAME/`

> **Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions - no setup needed!

## Local Testing

```bash
# Install
bun install

# Test single source (Troubadour shows)
SOURCE_URL=https://troubadour.com/ SOURCE_NAME=test SELECTOR='.event-item a, .event-link, .show-link' bun crawl

# Test multiple sources (all LA venues)
bun multi-crawl

# Build feed
bun build

# Serve locally
bun serve
```

## Current Sources

**Working LA Music Venues:**

- **Troubadour** - Legendary West Hollywood venue (~15+ shows/week)
- **Greek Theatre** - Outdoor amphitheater shows
- **El Rey Theatre** - Historic theatre listings
- **The Echo/Echoplex** - Indie and underground shows
- **Hollywood Bowl** - Major outdoor concerts
- **The Roxy** - Sunset Strip venue
- **Showlist.la** - LA show aggregator

**To add more venues**, edit `src/multi-crawl.ts` and `.github/workflows/shows-feed.yml`

## What You Get

- **RSS feed** at `/rss.xml`
- **Show board UI** with search and filters
- **Daily updates** via GitHub Actions cron
- **Smart deduplication** (no duplicates)
- **Mobile responsive** design with beautiful gradients

## Troubleshooting

**GitHub Actions failing with npm 503 errors?**

- This is temporary npm registry downtime
- Workflow has 3 retry attempts with 30s delays
- Just re-run the workflow later

**No shows showing up?**

- Check Actions logs for API key issues
- Verify `OPENAI_API_KEY` is set in repo secrets
- Some venues may block automated requests

## Costs

- GitHub Pages: **Free**
- GitHub Actions: **Free** (2000 min/month)
- OpenAI API: **~$3/month** (GPT-4o-mini)

## Show Types Covered

- **House Music** shows and DJ sets
- **Rock** concerts and festivals  
- **Indie** and alternative performances
- **Electronic** music events
- **Hip-hop** and R&B shows
- **Jazz** and experimental music
- **Punk** and metal shows

## Tech Stack

Bun + TypeScript + Cheerio + AI SDK + GitHub Actions

## Contributing

Found a great LA venue we're missing? Submit a PR with the venue added to `src/multi-crawl.ts`!
