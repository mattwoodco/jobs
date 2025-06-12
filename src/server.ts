import { readFileSync } from "node:fs";

const html = readFileSync("docs/index.html", "utf-8");
const jobs = readFileSync("docs/jobs.json", "utf-8");

Bun.serve({
	port: 3000,
	development: {
		hmr: true,
	},
	fetch(req) {
		const url = new URL(req.url);

		if (url.pathname === "/" || url.pathname === "/index.html") {
			return new Response(html, {
				headers: { "Content-Type": "text/html" },
			});
		}

		if (url.pathname === "/jobs.json") {
			return new Response(jobs, {
				headers: { "Content-Type": "application/json" },
			});
		}

		if (url.pathname === "/rss.xml") {
			try {
				const rss = readFileSync("docs/rss.xml", "utf-8");
				return new Response(rss, {
					headers: { "Content-Type": "application/rss+xml" },
				});
			} catch (e) {
				return new Response("RSS feed not found", { status: 404 });
			}
		}

		return new Response("Not found", { status: 404 });
	},
});
