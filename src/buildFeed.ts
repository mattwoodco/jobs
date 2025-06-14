import { Feed } from "feed";
import { readdir } from "node:fs/promises";

interface Show {
	title: string;
	artist: string;
	venue: string;
	url: string;
	date: string;
	location?: string;
}

const GITHUB_USER = process.env.GH_USER;

const feed = new Feed({
	title: "LA Shows Daily",
	description: "Fresh live music shows in Los Angeles",
	id: `https://${GITHUB_USER}.github.io/show-board/rss.xml`,
	link: `https://${GITHUB_USER}.github.io/show-board/`,
	copyright: `© ${new Date().getFullYear()}`,
	generator: "LA Show Board",
	feedLinks: {
		rss: `https://${GITHUB_USER}.github.io/show-board/rss.xml`,
	},
});

const build = async () => {
	const existing: Show[] = await Bun.file("docs/shows.json")
		.json()
		.catch(() => []);
	const seen = new Set(existing.map((s: Show) => s.url));
	let newCount = 0;

	// Fix any future dates in existing shows
	const now = new Date();
	for (const show of existing) {
		const showDate = new Date(show.date);
		if (showDate > now) {
			show.date = now.toISOString();
		}
	}

	for (const file of await readdir("results").catch(() => [])) {
		if (!file.endsWith(".json")) continue;

		try {
			const shows = await Bun.file(`results/${file}`).json();

			for (const show of shows) {
				if (!show.url || seen.has(show.url)) continue;
				seen.add(show.url);
				existing.push({ ...show, date: now.toISOString() });
				newCount++;
			}
		} catch (e) {
			console.error(`Error processing ${file}:`, e);
		}
	}

	existing.sort((a: Show, b: Show) => b.date.localeCompare(a.date));
	const recent = existing.slice(0, 500);

	for (const show of recent.slice(0, 50)) {
		feed.addItem({
			title: `${show.title} at ${show.venue}`,
			id: show.url,
			link: show.url,
			description: show.location
				? `${show.artist} - ${show.location}`
				: show.artist,
			date: new Date(show.date),
		});
	}

	await Bun.write("docs/shows.json", JSON.stringify(recent, null, 2));
	await Bun.write("docs/rss.xml", feed.rss2());
	await Bun.write(
		"docs/index.html",
		`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LA Shows Daily</title>
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      background: rgba(255,255,255,0.95);
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    h1 { 
      font-size: 2.5rem;
      margin: 0 0 1rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-align: center;
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
      color: #666;
      text-align: center;
    }
    .show {
      background: white;
      padding: 1.5rem;
      margin-bottom: 1rem;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
      border-left: 4px solid #667eea;
    }
    .show:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15)
    }
    .show-title {
      font-size: 1.25rem;
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      display: block;
      margin-bottom: 0.5rem;
    }
    .show-title:hover { 
      color: #764ba2;
      text-decoration: underline 
    }
    .artist {
      color: #333;
      font-size: 1.1rem;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    .venue {
      color: #666;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }
    .meta {
      color: #888;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }
    .date { 
      color: #999;
      font-size: 0.75rem
    }
    .rss-link {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 25px;
      text-decoration: none;
      font-size: 0.875rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      transition: transform 0.2s;
    }
    .rss-link:hover { 
      transform: translateY(-2px);
    }
    #loading {
      text-align: center;
      padding: 3rem;
      color: #666
    }
    .emoji {
      font-size: 1.2em;
      margin-right: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1><span class="emoji">🎵</span>LA Shows Daily</h1>
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
    <div id="loading">🎸 Loading shows...</div>
    <div id="shows"></div>
  </div>
  <script>
    fetch('shows.json')
      .then(r => r.json())
      .then(shows => {
        const now = new Date()
        document.getElementById('stats').textContent = shows.length + ' shows • Updated ' + 
          new Date().toLocaleDateString()
        document.getElementById('loading').style.display = 'none'
        document.getElementById('shows').innerHTML = shows.map(s => {
          try {
            const date = new Date(s.date)
            let days = 0
            if (!isNaN(date.getTime())) {
              days = Math.max(0, Math.floor((now - date) / (1000 * 60 * 60 * 24)))
            }
            const dateStr = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : days + ' days ago'
            return '<div class="show">' +
              '<a href="' + s.url + '" target="_blank" class="show-title">🎤 ' + s.title + '</a>' +
              '<div class="artist">🎸 ' + s.artist + '</div>' +
              '<div class="venue">📍 ' + s.venue + '</div>' +
              '<div class="meta">' +
                (s.location ? s.location + ' • ' : '') +
                '<span class="date">🗓️ ' + dateStr + '</span>' +
              '</div>' +
            '</div>'
          } catch (e) {
            return '<div class="show">' +
              '<a href="' + s.url + '" target="_blank" class="show-title">🎤 ' + s.title + '</a>' +
              '<div class="artist">🎸 ' + s.artist + '</div>' +
              '<div class="venue">📍 ' + s.venue + '</div>' +
              '<div class="meta">' + (s.location || '') + '</div>' +
            '</div>'
          }
        }).join('')
      })
      .catch(e => {
        console.error(e)
        document.getElementById('loading').innerHTML = '❌ Error loading shows. Please refresh the page.'
      })
  </script>
</body>
</html>`,
	);

	console.log(
		`✓ Built feed with ${recent.length} total shows (${newCount} new)`,
	);
};

build().catch(console.error);
