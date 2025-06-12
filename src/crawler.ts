import { openai } from "@ai-sdk/openai";
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
		}),
	),
});

const crawl = async () => {
	const { SOURCE_URL, SOURCE_NAME, SELECTOR = "a" } = process.env;
	if (!SOURCE_URL || !SOURCE_NAME)
		throw new Error("Missing SOURCE_URL or SOURCE_NAME");

	try {
		const html = await fetch(SOURCE_URL).then((r) => r.text());
		const $ = load(html);
		const baseUrl = new URL(SOURCE_URL);

		const links = $(SELECTOR)
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
			console.warn(`No links found with selector: ${SELECTOR}`);
			await Bun.write(`results/${SOURCE_NAME}.json`, "[]");
			return;
		}

		const { object } = await generateObject({
			model: openai("gpt-4o-mini"),
			schema: jobSchema,
			prompt: `Extract job listings from these links. Only include actual job postings, not navigation or unrelated links.
Base URL: ${SOURCE_URL}
Links: ${JSON.stringify(links)}`,
		});

		await Bun.write(
			`results/${SOURCE_NAME}.json`,
			JSON.stringify(object.jobs || []),
		);
		console.log(`✓ ${SOURCE_NAME}: found ${object.jobs?.length || 0} jobs`);
	} catch (error) {
		console.error(`✗ ${SOURCE_NAME}:`, error);
		await Bun.write(`results/${SOURCE_NAME}.json`, "[]");
	}
};

crawl().catch(console.error);
