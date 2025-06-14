import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { load } from "cheerio";
import { z } from "zod";

const showSchema = z.object({
  shows: z.array(
    z.object({
      title: z.string(),
      artist: z.string(),
      venue: z.string(),
      url: z.string(),
      date: z.string().optional(),
      location: z.string().optional(),
    })
  ),
});

const crawlSource = async (source: {
  name: string;
  url: string;
  selector: string;
}) => {
  try {
    console.log(`📡 Crawling ${source.name}...`);

    const html = await fetch(source.url).then((r) => r.text());
    const $ = load(html);
    const baseUrl = new URL(source.url);

    const links = $(source.selector)
      .map((_, el) => {
        const $el = $(el);
        let href = $el.attr("href") || "";
        if (href && !href.startsWith("http")) {
          href = new URL(href, baseUrl).toString();
        }
        return {
          text: $el.text().trim(),
          href,
          context: $el.parent().text().trim().slice(0, 200),
        };
      })
      .get()
      .filter((l) => l.text && l.href)
      .slice(0, 100);

    if (!links.length) {
      console.warn(`No links found with selector: ${source.selector}`);
      await Bun.write(`results/${source.name}.json`, "[]");
      return { source: source.name, count: 0 };
    }

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: showSchema,
      prompt: `Extract live music show listings from these links. Only include actual concert/show events, not navigation or unrelated links.
Focus on: concerts, live music performances, shows, gigs, festivals in Los Angeles area.
Base URL: ${source.url}
Links: ${JSON.stringify(links)}`,
    });

    await Bun.write(
      `results/${source.name}.json`,
      JSON.stringify(object.shows || [])
    );
    console.log(`✓ ${source.name}: found ${object.shows?.length || 0} shows`);
    return { source: source.name, count: object.shows?.length || 0 };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${source.name}:`, errorMsg);
    await Bun.write(`results/${source.name}.json`, "[]");
    return { source: source.name, count: 0, error: errorMsg };
  }
};

const sources = [
  {
    name: "el-rey",
    url: "https://showbams.com/tag/el-rey-theatre/",
    selector: "article h2 a, .entry-title a",
  },
  {
    name: "showlist-la",
    url: "https://showlist.la/",
    selector: "a[href*='http']",
  },
  {
    name: "troubadour",
    url: "https://troubadour.com/",
    selector: "a[href*='/events/'], .event a, h3 a",
  },
  {
    name: "grimy-goods",
    url: "https://www.grimygoods.com/",
    selector: "article h2 a, .entry-title a",
  },
  {
    name: "spaceland-presents",
    url: "https://www.spacelandpresents.com/",
    selector: ".show-info a, .event-link, .artist-name a",
  },
  {
    name: "ticketmaster-la",
    url: "https://www.ticketmaster.com/discover/concerts/los-angeles",
    selector: ".event-card a, .event-name a",
  },
  {
    name: "songkick-la",
    url: "https://www.songkick.com/metro-areas/17835-us-los-angeles",
    selector: ".event-link, .artists a",
  },
  {
    name: "resident-advisor-la",
    url: "https://ra.co/events/us/losangeles",
    selector: ".event-item a, .event-title a",
  },
  {
    name: "la-weekly",
    url: "https://www.laweekly.com/category/music/",
    selector: "article h2 a, .entry-title a",
  },
  {
    name: "buzzbands-la",
    url: "https://buzzbands.la/",
    selector: "article h2 a, .entry-title a",
  },
];

const crawlAll = async () => {
  console.log(`🚀 Crawling ${sources.length} LA music venues...`);

  const results = await Promise.allSettled(
    sources.map((source) => crawlSource(source))
  );

  const summary = results.map((r) =>
    r.status === "fulfilled" ? r.value : r.reason
  );
  const totalShows = summary.reduce((sum, r) => sum + (r.count || 0), 0);

  console.log("\n📊 Crawl Summary:");
  for (const r of summary) {
    const status = r.error ? "❌" : "✅";
    console.log(
      `${status} ${r.source}: ${r.count} shows ${r.error ? `(${r.error})` : ""}`
    );
  }
  console.log(`\n Total: ${totalShows} shows from ${sources.length} venues`);
};

crawlAll().catch(console.error);
