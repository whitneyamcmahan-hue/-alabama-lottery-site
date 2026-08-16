import { XMLParser } from "fast-xml-parser";

// Multiple RSS sources so one feed going down doesn't kill the page.
// Google News RSS needs no API key and covers most outlets automatically.
const FEEDS = [
  {
    name: "Google News",
    url: "https://news.google.com/rss/search?q=%22Alabama%20lottery%22&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News (gambling bill)",
    url: "https://news.google.com/rss/search?q=Alabama%20gambling%20bill%20legislature&hl=en-US&gl=US&ceid=US:en",
  },
];

const parser = new XMLParser({ ignoreAttributes: false });

function stripHtml(str = "") {
  return str.replace(/<[^>]*>/g, "").trim();
}

async function fetchFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AlabamaLotteryBot/1.0)" },
  });
  if (!res.ok) throw new Error(`${feed.name} responded ${res.status}`);
  const xml = await res.text();
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item || [];
  const list = Array.isArray(items) ? items : [items];

  return list.map((item) => ({
    title: stripHtml(item.title),
    link: item.link,
    source: item?.source?.["#text"] || feed.name,
    publishedAt: item.pubDate || null,
    summary: stripHtml(item.description).slice(0, 280),
  }));
}

export default async function handler(req, res) {
  try {
    const results = await Promise.allSettled(FEEDS.map(fetchFeed));

    const combined = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value);

    // De-dupe by title (different feeds often surface the same story)
    const seen = new Set();
    const deduped = combined.filter((item) => {
      const key = item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Newest first
    deduped.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

    // Cache at the edge for 1 hour, serve stale for up to a day while revalidating.
    // This is what makes the page "auto-update": every visit after the cache
    // window expires triggers a fresh fetch of the RSS feeds above.
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );

    res.status(200).json({
      updatedAt: new Date().toISOString(),
      count: deduped.length,
      articles: deduped.slice(0, 30),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load news", detail: err.message });
  }
}
