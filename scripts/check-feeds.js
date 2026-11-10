// Tries every feed in server/sectors.js and reports which ones work.
import { SECTORS } from "../server/sectors.js";
import { fetchFeed } from "../server/news.js";

let broken = 0;
for (const sector of SECTORS) {
  console.log(`\n${sector.emoji} ${sector.name}`);
  const results = await Promise.allSettled(sector.feeds.map((f) => fetchFeed(sector.id, f)));
  results.forEach((r, i) => {
    const f = sector.feeds[i];
    if (r.status === "fulfilled" && r.value.length > 0) {
      console.log(`  ok    ${String(r.value.length).padStart(3)} stories  ${f.source}`);
    } else {
      broken++;
      const why = r.status === "fulfilled" ? "no stories" : r.reason?.cause?.message || r.reason?.message;
      console.log(`  FAIL  ${f.source}  ${f.url}\n        ${why}`);
    }
  });
}
console.log(broken ? `\n${broken} feed(s) need attention.` : "\nAll feeds are working.");
