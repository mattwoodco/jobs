process.env.SOURCE_URL = "https://news.ycombinator.com/jobs";
process.env.SOURCE_NAME = "test";
process.env.SELECTOR = ".titleline>a";
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "test-key";

console.log("Testing crawler...");
await import("./crawler.ts");

setTimeout(async () => {
	console.log("\nTesting feed builder...");
	await import("./buildFeed.ts");
	console.log("\nDone! Check docs/ folder");
}, 5000);
