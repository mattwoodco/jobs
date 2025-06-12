# AI Job Board

Free daily job board powered by GitHub Pages + Actions + AI crawlers. Zero hosting costs.

## Quick Start

1. **Fork this repo**
2. **Add OpenAI API key** to repo secrets:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key from [platform.openai.com](https://platform.openai.com)
3. **Enable GitHub Pages** (Settings → Pages → Deploy from branch: `gh-pages`)
4. **Run workflow** (Actions → `jobs-feed` → Run workflow)

Your job board: `https://YOUR_USERNAME.github.io/REPO_NAME/`

> **Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions - no setup needed!

## Local Testing

```bash
# Install
bun install

# Test single source (27 jobs)
SOURCE_URL=https://news.ycombinator.com/jobs SOURCE_NAME=test SELECTOR='.titleline>a' bun crawl

# Test multiple sources (75+ jobs)
bun multi-crawl

# Build feed
bun build

# Serve locally
bun serve
```

## Current Sources

**Working (75+ jobs/day):**

- **HackerNews Jobs** - YC companies (~27 jobs)
- **WeWorkRemotely** - Remote positions (~48 jobs)

**To add more sources**, edit `src/multi-crawl.ts` and `.github/workflows/jobs-feed.yml`

## What You Get

- **RSS feed** at `/rss.xml`
- **Job board UI** with search and filters
- **Daily updates** via GitHub Actions cron
- **Smart deduplication** (no duplicates)
- **Mobile responsive** design

## Troubleshooting

**GitHub Actions failing with npm 503 errors?**

- This is temporary npm registry downtime
- Workflow has 3 retry attempts with 30s delays
- Just re-run the workflow later

**No jobs showing up?**

- Check Actions logs for API key issues
- Verify `OPENAI_API_KEY` is set in repo secrets
- Some job sites may block automated requests

## Costs

- GitHub Pages: **Free**
- GitHub Actions: **Free** (2000 min/month)
- OpenAI API: **~$3/month** (GPT-4o-mini)

## Tech Stack

Bun + TypeScript + Cheerio + AI SDK + GitHub Actions
