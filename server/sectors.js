// The sectors a reader can follow, and the feeds each one is built from.
// To change the app's focus, edit this list: add a sector, or swap its feeds.
export const SECTORS = [
  {
    id: "tech",
    name: "Tech & AI",
    emoji: "🤖",
    feeds: [
      { source: "BBC", url: "https://feeds.bbci.co.uk/news/technology/rss.xml" },
      { source: "The Guardian", url: "https://www.theguardian.com/technology/rss" },
      { source: "NPR", url: "https://feeds.npr.org/1019/rss.xml" },
    ],
  },
  {
    id: "business",
    name: "Business & Markets",
    emoji: "📈",
    feeds: [
      { source: "BBC", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
      { source: "The Guardian", url: "https://www.theguardian.com/business/rss" },
      { source: "NPR", url: "https://feeds.npr.org/1006/rss.xml" },
    ],
  },
  {
    id: "health",
    name: "Health",
    emoji: "🩺",
    feeds: [
      { source: "BBC", url: "https://feeds.bbci.co.uk/news/health/rss.xml" },
      { source: "The Guardian", url: "https://www.theguardian.com/society/health/rss" },
      { source: "NPR", url: "https://feeds.npr.org/1128/rss.xml" },
    ],
  },
  {
    id: "science",
    name: "Science",
    emoji: "🔬",
    feeds: [
      { source: "BBC", url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml" },
      { source: "The Guardian", url: "https://www.theguardian.com/science/rss" },
      { source: "NPR", url: "https://feeds.npr.org/1007/rss.xml" },
    ],
  },
  {
    id: "climate",
    name: "Climate & Energy",
    emoji: "🌍",
    feeds: [
      { source: "The Guardian", url: "https://www.theguardian.com/environment/rss" },
      { source: "NPR", url: "https://feeds.npr.org/1167/rss.xml" },
    ],
  },
  {
    id: "world",
    name: "World & Politics",
    emoji: "🏛️",
    feeds: [
      { source: "BBC", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
      { source: "The Guardian", url: "https://www.theguardian.com/world/rss" },
      { source: "NPR", url: "https://feeds.npr.org/1004/rss.xml" },
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    emoji: "🎬",
    feeds: [
      { source: "BBC", url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml" },
      { source: "The Guardian", url: "https://www.theguardian.com/culture/rss" },
    ],
  },
  {
    id: "sport",
    name: "Sport",
    emoji: "⚽",
    feeds: [
      { source: "BBC", url: "https://feeds.bbci.co.uk/sport/rss.xml" },
      { source: "The Guardian", url: "https://www.theguardian.com/sport/rss" },
    ],
  },
];

export const MAX_STORIES_PER_SECTOR = 10;
