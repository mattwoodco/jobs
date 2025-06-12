import { Feed } from "feed";
import { readdir } from "node:fs/promises";

interface Job {
	title: string;
	company: string;
	url: string;
	date: string;
	location?: string;
}

const GITHUB_USER = process.env.GH_USER;

const feed = new Feed({
	title: "AI Jobs Daily",
	description: "Fresh tech jobs scraped by AI",
	id: `https://${GITHUB_USER}.github.io/job-board/rss.xml`,
	link: `https://${GITHUB_USER}.github.io/job-board/`,
	copyright: `© ${new Date().getFullYear()}`,
	generator: "AI Job Board",
	feedLinks: {
		rss: `https://${GITHUB_USER}.github.io/job-board/rss.xml`,
	},
});

const build = async () => {
	const existing: Job[] = await Bun.file("docs/jobs.json")
		.json()
		.catch(() => []);
	const seen = new Set(existing.map((j: Job) => j.url));
	let newCount = 0;

	// Fix any future dates in existing jobs
	const now = new Date();
	for (const job of existing) {
		const jobDate = new Date(job.date);
		if (jobDate > now) {
			job.date = now.toISOString();
		}
	}

	for (const file of await readdir("results").catch(() => [])) {
		if (!file.endsWith(".json")) continue;

		try {
			const jobs = await Bun.file(`results/${file}`).json();

			for (const job of jobs) {
				if (!job.url || seen.has(job.url)) continue;
				seen.add(job.url);
				existing.push({ ...job, date: now.toISOString() });
				newCount++;
			}
		} catch (e) {
			console.error(`Error processing ${file}:`, e);
		}
	}

	existing.sort((a: Job, b: Job) => b.date.localeCompare(a.date));
	const recent = existing.slice(0, 500);

	for (const job of recent.slice(0, 50)) {
		feed.addItem({
			title: `${job.title} at ${job.company}`,
			id: job.url,
			link: job.url,
			description: job.location
				? `${job.company} - ${job.location}`
				: job.company,
			date: new Date(job.date),
		});
	}

	await Bun.write("docs/jobs.json", JSON.stringify(recent, null, 2));
	await Bun.write("docs/rss.xml", feed.rss2());
	await Bun.write(
		"docs/index.html",
		`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Jobs Daily</title>
  <link rel="alternate" type="application/rss+xml" href="rss.xml">
  <style>
    * { box-sizing: border-box }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1rem;
      line-height: 1.6;
      color: #333;
      background: #fafafa
    }
    h1 { 
      font-size: 2rem;
      margin: 0 0 1rem;
      font-weight: 600
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem
    }
    .stats {
      font-size: 0.875rem;
      color: #666
    }
    .job {
      background: white;
      padding: 1.25rem;
      margin-bottom: 0.75rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s
    }
    .job:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15)
    }
    .job-title {
      font-size: 1.125rem;
      color: #0066cc;
      text-decoration: none;
      font-weight: 500
    }
    .job-title:hover { text-decoration: underline }
    .meta {
      color: #666;
      font-size: 0.875rem;
      margin-top: 0.25rem
    }
    .date { 
      color: #999;
      font-size: 0.75rem
    }
    .rss-link {
      background: #ff6600;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.875rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem
    }
    .rss-link:hover { background: #e55500 }
    #loading {
      text-align: center;
      padding: 3rem;
      color: #666
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>AI Jobs Daily</h1>
      <div class="stats" id="stats"></div>
    </div>
    <a href="rss.xml" class="rss-link">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.429 7.1c0-.79.64-1.429 1.428-1.429 5.465 0 9.9 4.435 9.9 9.9 0 .789-.64 1.429-1.428 1.429-.79 0-1.429-.64-1.429-1.429 0-3.888-3.155-7.043-7.043-7.043-.789 0-1.428-.64-1.428-1.428z"/>
        <path d="M3.429 12.6c0-.79.64-1.429 1.428-1.429 2.438 0 4.4 1.961 4.4 4.4 0 .789-.64 1.429-1.428 1.429-.79 0-1.429-.64-1.429-1.429 0-.86-.7-1.543-1.543-1.543-.789 0-1.428-.64-1.428-1.428z"/>
        <circle cx="4.857" cy="15.571" r="1.714"/>
      </svg>
      RSS Feed
    </a>
  </div>
  <div id="loading">Loading jobs...</div>
  <div id="jobs"></div>
  <script>
    fetch('jobs.json')
      .then(r => r.json())
      .then(jobs => {
        const now = new Date()
        document.getElementById('stats').textContent = jobs.length + ' jobs • Updated ' + 
          new Date().toLocaleDateString()
        document.getElementById('loading').style.display = 'none'
        document.getElementById('jobs').innerHTML = jobs.map(j => {
          try {
            const date = new Date(j.date)
            let days = 0
            if (!isNaN(date.getTime())) {
              days = Math.max(0, Math.floor((now - date) / (1000 * 60 * 60 * 24)))
            }
            const dateStr = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : days + ' days ago'
            return '<div class="job">' +
              '<a href="' + j.url + '" target="_blank" class="job-title">' + j.title + '</a>' +
              '<div class="meta">' +
                j.company + (j.location ? ' • ' + j.location : '') +
                '<span class="date"> • ' + dateStr + '</span>' +
              '</div>' +
            '</div>'
          } catch (e) {
            return '<div class="job">' +
              '<a href="' + j.url + '" target="_blank" class="job-title">' + j.title + '</a>' +
              '<div class="meta">' + j.company + (j.location ? ' • ' + j.location : '') + '</div>' +
            '</div>'
          }
        }).join('')
      })
      .catch(e => {
        console.error(e)
        document.getElementById('loading').innerHTML = 'Error loading jobs. Please refresh the page.'
      })
  </script>
</body>
</html>`,
	);

	console.log(
		`✓ Built feed with ${recent.length} total jobs (${newCount} new)`,
	);
};

build().catch(console.error);
