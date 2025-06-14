import { load } from "cheerio";

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
];

const testSource = async (source: { name: string; url: string; selector: string }) => {
  try {
    console.log(`🎵 Testing ${source.name}...`);
    
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
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
        };
      })
      .get()
      .filter((l) => l.text && l.href)
      .slice(0, 10); // Limit to 10 for testing

    console.log(`✅ ${source.name}: Found ${links.length} links`);
    
    if (links.length > 0) {
      console.log(`   Sample links:`);
      links.slice(0, 3).forEach((link, i) => {
        console.log(`   ${i + 1}. ${link.text.slice(0, 50)}... -> ${link.href.slice(0, 60)}...`);
      });
    }
    
    return { source: source.name, count: links.length, success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`❌ ${source.name}: ${errorMsg}`);
    return { source: source.name, count: 0, success: false, error: errorMsg };
  }
};

const testAll = async () => {
  console.log(`🚀 Testing ${sources.length} LA music venue sources...\n`);

  const results = await Promise.allSettled(
    sources.map((source) => testSource(source))
  );

  const summary = results.map((r) =>
    r.status === "fulfilled" ? r.value : r.reason
  );
  
  const totalLinks = summary.reduce((sum, r) => sum + (r.count || 0), 0);
  const successCount = summary.filter(r => r.success).length;

  console.log("\n📊 Test Summary:");
  for (const r of summary) {
    const status = r.success ? "✅" : "❌";
    console.log(`${status} ${r.source}: ${r.count} links ${r.error ? `(${r.error})` : ""}`);
  }
  
  console.log(`\n🎯 Results: ${totalLinks} total links from ${successCount}/${sources.length} working sources`);
  
  if (totalLinks >= 10) {
    console.log(`🎉 SUCCESS: We found ${totalLinks} links, which should be enough to get 10+ shows!`);
  } else {
    console.log(`⚠️  WARNING: Only found ${totalLinks} links. May need to adjust selectors.`);
  }
};

testAll().catch(console.error);