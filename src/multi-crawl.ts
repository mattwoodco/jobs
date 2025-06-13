import getOpenAIModel from "./openaiClient";
import { generateObject } from "ai";
import { load } from "cheerio";
import { z } from "zod";

const jobSchema = z.object({
  jobs: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      url: z.string(),
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
      model: getOpenAIModel(),
      schema: jobSchema,
      prompt: `Extract job listings from these links. Only include actual job postings, not navigation or unrelated links.
Base URL: ${source.url}
Links: ${JSON.stringify(links)}`,
    });

    await Bun.write(
      `results/${source.name}.json`,
      JSON.stringify(object.jobs || [])
    );
    console.log(`✓ ${source.name}: found ${object.jobs?.length || 0} jobs`);
    return { source: source.name, count: object.jobs?.length || 0 };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${source.name}:`, errorMsg);
    await Bun.write(`results/${source.name}.json`, "[]");
    return { source: source.name, count: 0, error: errorMsg };
  }
};

const sources = [
  {
    name: "hn",
    url: "https://news.ycombinator.com/jobs",
    selector: ".titleline>a",
  },
  {
    name: "wwr",
    url: "https://weworkremotely.com/remote-jobs",
    selector: ".feature a",
  },
  {
    name: "remoteok",
    url: "https://remoteok.io/",
    selector: ".job a",
  },
  {
    name: "dice",
    url: "https://www.dice.com/jobs",
    selector: "[data-testid='job-search-job-detail-link']",
  },
  {
    name: "jobspresso",
    url: "https://jobspresso.co/",
    selector: ".job_listing-clickbox",
  },
  {
    name: "outsite",
    url: "https://www.outsite.co/jobs",
    selector: "a[href^='/jobs/']",
  },
  {
    name: "yc",
    url: "https://www.workatastartup.com/jobs",
    selector: "a[href^='/jobs/']",
  },
  {
    name: "otta",
    url: "https://otta.com",
    selector: "a[href^='/jobs/']",
  },
  {
    name: "arc",
    url: "https://arc.dev/remote-jobs",
    selector: "a[href^='/remote-jobs/']",
  },
  {
    name: "remoteleads",
    url: "https://remoteleads.io/",
    selector: "a[href^='/leads/']",
  },
  // {
  //   name: "indeed",
  //   url: "https://www.indeed.com/jobs?q=software+engineer",
  //   selector: "h2 a[data-jk]",
  // },
];

const crawlAll = async () => {
  console.log(`🚀 Crawling ${sources.length} job sources...`);

  const results = await Promise.allSettled(
    sources.map((source) => crawlSource(source))
  );

  const summary = results.map((r) =>
    r.status === "fulfilled" ? r.value : r.reason
  );
  const totalJobs = summary.reduce((sum, r) => sum + (r.count || 0), 0);

  console.log("\n📊 Crawl Summary:");
  for (const r of summary) {
    const status = r.error ? "❌" : "✅";
    console.log(
      `${status} ${r.source}: ${r.count} jobs ${r.error ? `(${r.error})` : ""}`
    );
  }
  console.log(`\n🎯 Total: ${totalJobs} jobs from ${sources.length} sources`);
};

crawlAll().catch(console.error);
