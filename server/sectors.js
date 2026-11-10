// The sectors a reader can follow, and the feeds each one is built from.
// To change the app's focus, edit this list: add a sector, or swap its feeds.
// Run `npm run check-feeds` to see which feeds are reachable and how many stories each returns.
const guardian = (path) => ({ source: "The Guardian", url: `https://www.theguardian.com/${path}/rss` });
const bbc = (path) => ({ source: "BBC", url: `https://feeds.bbci.co.uk/${path}/rss.xml` });
const npr = (id) => ({ source: "NPR", url: `https://feeds.npr.org/${id}/rss.xml` });
const feed = (source, url) => ({ source, url });

export const SECTORS = [
  // --- Tech ---
  {
    id: "ai",
    name: "AI",
    emoji: "🤖",
    group: "Tech",
    feeds: [
      guardian("technology/artificialintelligenceai"),
      feed("MIT Technology Review", "https://www.technologyreview.com/feed/"),
      feed("The Verge", "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml"),
    ],
  },
  {
    id: "tech",
    name: "Technology",
    emoji: "💻",
    group: "Tech",
    feeds: [bbc("news/technology"), guardian("technology"), npr(1019)],
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    emoji: "🔐",
    group: "Tech",
    feeds: [
      feed("BleepingComputer", "https://www.bleepingcomputer.com/feed/"),
      feed("Krebs on Security", "https://krebsonsecurity.com/feed/"),
      guardian("technology/data-computer-security"),
    ],
  },
  {
    id: "space",
    name: "Space",
    emoji: "🚀",
    group: "Tech",
    feeds: [
      feed("Space.com", "https://www.space.com/feeds/all"),
      guardian("science/space"),
      feed("NASA", "https://www.nasa.gov/news-release/feed/"),
    ],
  },

  // --- Money & industry ---
  {
    id: "business",
    name: "Business",
    emoji: "💼",
    group: "Money & industry",
    feeds: [bbc("news/business"), guardian("business"), npr(1006)],
  },
  {
    id: "markets",
    name: "Markets & Economy",
    emoji: "📈",
    group: "Money & industry",
    feeds: [
      guardian("business/economics"),
      feed("CNBC", "https://www.cnbc.com/id/20910258/device/rss/rss.html"),
      npr(1017),
    ],
  },
  {
    id: "startups",
    name: "Startups & VC",
    emoji: "🦄",
    group: "Money & industry",
    feeds: [
      feed("TechCrunch", "https://techcrunch.com/category/startups/feed/"),
      feed("TechCrunch", "https://techcrunch.com/category/venture/feed/"),
      feed("Crunchbase News", "https://news.crunchbase.com/feed/"),
    ],
  },
  {
    id: "crypto",
    name: "Crypto",
    emoji: "🪙",
    group: "Money & industry",
    feeds: [
      feed("CoinDesk", "https://www.coindesk.com/arc/outboundfeeds/rss/"),
      feed("Cointelegraph", "https://cointelegraph.com/rss"),
      guardian("technology/cryptocurrencies"),
    ],
  },
  {
    id: "climate",
    name: "Climate & Energy",
    emoji: "🌍",
    group: "Money & industry",
    feeds: [guardian("environment"), guardian("environment/energy"), npr(1167)],
  },
  {
    id: "autos",
    name: "Cars & EVs",
    emoji: "🚗",
    group: "Money & industry",
    feeds: [
      feed("Electrek", "https://electrek.co/feed/"),
      guardian("business/automotive-industry"),
      guardian("environment/electric-cars"),
    ],
  },
  {
    id: "pharma",
    name: "Pharma & Biotech",
    emoji: "🧬",
    group: "Money & industry",
    feeds: [
      feed("STAT", "https://www.statnews.com/feed/"),
      feed("Fierce Pharma", "https://www.fiercepharma.com/rss/xml"),
      guardian("business/pharmaceuticals-industry"),
    ],
  },

  // --- World & knowledge ---
  {
    id: "world",
    name: "World & Politics",
    emoji: "🏛️",
    group: "World & knowledge",
    feeds: [bbc("news/world"), guardian("world"), npr(1004)],
  },
  {
    id: "health",
    name: "Health",
    emoji: "🩺",
    group: "World & knowledge",
    feeds: [bbc("news/health"), guardian("society/health"), npr(1128)],
  },
  {
    id: "science",
    name: "Science",
    emoji: "🔬",
    group: "World & knowledge",
    feeds: [bbc("news/science_and_environment"), guardian("science"), npr(1007)],
  },

  // --- Culture & fun ---
  {
    id: "anime",
    name: "Anime",
    emoji: "🎌",
    group: "Culture & fun",
    feeds: [
      feed("Anime News Network", "https://www.animenewsnetwork.com/all/rss.xml"),
      feed("MyAnimeList", "https://myanimelist.net/rss/news.xml"),
      feed("Crunchyroll", "https://cr-news-api-service.prd.crunchyrollsvc.com/v1/en-US/rss"),
    ],
  },
  {
    id: "kpop",
    name: "K-pop",
    emoji: "🎤",
    group: "Culture & fun",
    feeds: [
      feed("Soompi", "https://www.soompi.com/feed"),
      feed("allkpop", "https://www.allkpop.com/feed"),
      guardian("music/k-pop"),
    ],
  },
  {
    id: "music",
    name: "Music",
    emoji: "🎧",
    group: "Culture & fun",
    feeds: [
      guardian("music"),
      feed("Pitchfork", "https://pitchfork.com/feed/feed-news/rss"),
      feed("Rolling Stone", "https://www.rollingstone.com/music/music-news/feed/"),
      npr(1039),
    ],
  },
  {
    id: "entertainment",
    name: "Film & TV",
    emoji: "🎬",
    group: "Culture & fun",
    feeds: [
      bbc("news/entertainment_and_arts"),
      guardian("film"),
      guardian("tv-and-radio"),
      feed("Variety", "https://variety.com/feed/"),
    ],
  },
  {
    id: "gaming",
    name: "Gaming",
    emoji: "🎮",
    group: "Culture & fun",
    feeds: [
      guardian("games"),
      feed("Polygon", "https://www.polygon.com/rss/index.xml"),
      feed("Eurogamer", "https://www.eurogamer.net/feed"),
    ],
  },
  {
    id: "sport",
    name: "Sport",
    emoji: "⚽",
    group: "Culture & fun",
    feeds: [bbc("sport"), guardian("sport")],
  },
];

export const MAX_STORIES_PER_SECTOR = 10;
