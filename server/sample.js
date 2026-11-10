// Made-up stories shown only when no live news feed is reachable.
// They are placeholders for trying the app, not real news, and the UI labels them as samples.
const now = Date.now();
const hoursAgo = (h) => now - h * 3600000;

const raw = [
  {
    sectorId: "tech",
    title: "Chipmaker unveils processor designed to run AI models on laptops without the cloud",
    body: "A semiconductor company has announced a processor with a dedicated neural processing unit that it says can run large language models locally, with on-device inference cutting latency and keeping user data off remote servers. The company claims a 40% efficiency gain over its previous generation. Analysts say the move reflects an industry shift toward edge computing as cloud inference costs rise.",
    plain: "A chip company has made a new computer brain for laptops. Its party trick: it can run AI chatbots right on your laptop, instead of sending your questions over the internet to giant computer warehouses.\n\nThat means answers come back faster, and what you type stays on your own machine. The company says the chip does the same work using about 40% less power than its last one.\n\nWhy it matters: AI tools on your laptop could soon work offline, respond quicker and keep your information private.",
    genz: "POV: your laptop just got its own brain 🧠💻\n\nSo a chip company dropped a new processor and it runs AI on your actual laptop. No cloud. No sending your 2am questions to some server farm in the middle of nowhere.\n\nFaster replies ✅ your data stays home ✅ 40% more efficient than the last one ✅\n\nExperts are saying the whole industry is moving this way because cloud AI is getting expensive fr. Offline AI era loading… ⏳",
  },
  {
    sectorId: "tech",
    title: "Regulators propose rules requiring labels on AI-generated images and video",
    body: "A draft regulatory framework would mandate provenance metadata and visible disclosure on synthetic media produced by generative models. Platforms would be obliged to detect and flag unlabelled content, with penalties scaled to global turnover. Industry groups have raised concerns about the technical feasibility of watermark detection at scale.",
    plain: "Officials have drafted new rules about pictures and videos made by AI. Under the plan, anything created by an AI tool would need a clear label saying so, plus hidden information inside the file recording where it came from.\n\nSocial media sites would have to spot and flag unlabelled AI content. Companies that ignore the rules could face fines based on how much money they make worldwide. Tech companies say reliably spotting AI content across billions of posts is very hard.\n\nWhy it matters: it could become much easier to tell whether a photo or video you see online is real.",
    genz: "Fake pics are about to get exposed 👀\n\nRegulators just drafted rules saying AI-made images and videos need a label. Like a \"this is AI\" tag, plus hidden info baked into the file.\n\nPlatforms would have to catch the unlabelled stuff too, or pay fines based on their global revenue 💸\n\nTech companies are already like \"detecting this at scale is really hard tho.\" Stay tuned.",
  },
  {
    sectorId: "business",
    title: "Central bank holds interest rates steady, signals cuts may come later in the year",
    body: "The central bank left its benchmark rate unchanged, citing persistent core inflation and a resilient labour market. Policymakers indicated that monetary easing could begin once disinflation is firmly established. Bond yields fell and equities rallied on the dovish forward guidance.",
    plain: "The central bank, which sets the basic cost of borrowing money in the country, has decided not to change interest rates for now. It says prices are still rising a bit too fast and plenty of people have jobs, so there is no rush.\n\nBut it hinted that it might lower rates later this year if price rises keep slowing down. Investors liked that hint, and share prices went up.\n\nWhy it matters: interest rates affect what you pay on loans and mortgages and what you earn on savings, so a future cut could make borrowing cheaper.",
    genz: "The central bank said \"no changes today\" and the stock market still threw a party 🎉\n\nInterest rates = staying put. Why? Prices are still climbing a little too fast and the job market is holding strong.\n\nBUT they hinted cuts could come later this year. Investors heard that and stocks went up 📈\n\nTranslation: loans might get cheaper eventually. Not yet. Patience bestie.",
  },
  {
    sectorId: "business",
    title: "Retail giant to close 60 stores as shoppers shift online",
    body: "The retailer announced a restructuring plan including the closure of 60 underperforming locations and increased capital expenditure on fulfilment infrastructure. Same-store sales declined for a third consecutive quarter while e-commerce revenue grew by double digits.",
    plain: "A big chain of shops is closing 60 of its stores that weren't making enough money. Instead, it will spend more on the warehouses and delivery systems that handle online orders.\n\nSales in its physical shops have fallen for nine months in a row, while its online sales have grown quickly.\n\nWhy it matters: more shopping is moving online, which changes high streets and the jobs that go with them.",
    genz: "Another one bites the dust… x60 🏬💔\n\nA huge retailer is closing 60 stores because, let's be real, we're all ordering from the couch.\n\nIn-store sales: down three quarters straight 📉\nOnline sales: up double digits 📈\n\nSo the money's going into warehouses and delivery instead. The mall era is not malling.",
  },
  {
    sectorId: "health",
    title: "Trial finds weekly injection reduces migraine days by half in adults with chronic migraine",
    body: "A phase 3 randomised controlled trial reported that a monoclonal antibody targeting the CGRP pathway reduced monthly migraine days by 50% versus placebo. Adverse events were mild, predominantly injection-site reactions. Researchers caution that long-term efficacy data are still needed.",
    plain: "A large medical study tested a once-a-week injection for adults who get migraines very often. People who got the real medicine had about half as many migraine days each month as people who got a dummy injection.\n\nThe drug works by blocking a substance in the body that helps trigger migraine pain. Side effects were mild, mostly soreness where the needle went in. Researchers say they still need to check how well it works over a longer time.\n\nWhy it matters: frequent migraines can wreck daily life, and this could become a new way to prevent them.",
    genz: "Migraine girlies (and guys) this one's for you 🙌\n\nA big study tested a weekly shot for people with chronic migraines and it cut their migraine days IN HALF vs a fake shot.\n\nSide effects? Mostly a sore spot where the needle went in.\n\nScientists still want long-term data before anyone celebrates too hard. But the early results? Promising.",
  },
  {
    sectorId: "health",
    title: "Study links regular walking to lower risk of heart disease, even at modest step counts",
    body: "An observational cohort study found a dose-response relationship between daily step count and cardiovascular outcomes, with risk reductions observed from around 4,000 steps per day. The authors note that causality cannot be established from observational data.",
    plain: "Researchers followed a large group of people and compared how much they walked with how their hearts fared. People who walked more had fewer heart problems, and the benefit showed up from about 4,000 steps a day, well below the famous 10,000.\n\nThe researchers point out that this kind of study can show a link but cannot prove that walking itself was the cause.\n\nWhy it matters: even a modest daily walk may be good for your heart.",
    genz: "You don't need 10k steps. I repeat. You do NOT need 10k steps 🚶‍♀️\n\nA study found heart benefits start showing up around 4,000 steps a day. More steps = lower risk.\n\nSmall print: this type of study shows a link, it can't prove walking is the cause.\n\nStill… hot girl walk stays winning 💅",
  },
  {
    sectorId: "science",
    title: "Telescope detects water vapour in atmosphere of rocky planet 40 light-years away",
    body: "Spectroscopic observations during planetary transits revealed absorption features consistent with water vapour on a terrestrial exoplanet in its star's habitable zone. Astronomers stress that stellar contamination cannot yet be ruled out as the source of the signal.",
    plain: "Astronomers studied a rocky, Earth-like planet circling a distant star, about 40 light-years away. By examining the starlight that passes around the planet, they found signs of water vapour in its air.\n\nThe planet sits at a distance from its star where it is neither too hot nor too cold for liquid water. The scientists warn that the signal might actually be coming from the star itself, so more checks are needed.\n\nWhy it matters: water is one of the main things scientists look for when searching for places where life could exist.",
    genz: "Scientists may have found water on another planet and I need everyone to stay calm 🪐💧\n\nIt's a rocky planet 40 light-years away, sitting in the \"not too hot, not too cold\" zone. A telescope picked up signs of water vapour in its atmosphere.\n\nPlot twist: the signal might be coming from the star, not the planet. They're double-checking.\n\nAliens: unconfirmed. Vibes: immaculate.",
  },
  {
    sectorId: "science",
    title: "Researchers grow functional heart tissue from stem cells that beats in sync",
    body: "Using induced pluripotent stem cells and a bioengineered scaffold, a team produced cardiac tissue exhibiting synchronised contraction and electrical conduction. The work is at a preclinical stage and has not been tested in humans.",
    plain: "Scientists took ordinary cells, reprogrammed them so they could become any type of cell, and grew them into heart muscle on a tiny supporting frame. The lab-grown tissue beat in rhythm and carried electrical signals the way real heart muscle does.\n\nThis is early laboratory work and has not been tried in people.\n\nWhy it matters: one day, tissue like this might help repair hearts damaged by heart attacks.",
    genz: "Scientists grew heart tissue in a lab and it's literally BEATING 🫀\n\nThey took regular cells, reprogrammed them, and grew heart muscle on a tiny scaffold. It beats in sync and carries electrical signals like the real thing.\n\nBefore you ask: no, it hasn't been tested in humans. Still early lab stuff.\n\nBut the potential for fixing damaged hearts someday? Kind of huge.",
  },
  {
    sectorId: "climate",
    title: "Solar and wind supply record share of electricity as battery storage capacity doubles",
    body: "Renewable generation reached a record share of the grid mix over the quarter, supported by a doubling of utility-scale battery storage that reduced curtailment during peak output. Grid operators say transmission bottlenecks remain the main constraint on further growth.",
    plain: "Over the last three months, solar panels and wind turbines produced a bigger share of the electricity supply than ever before. A big reason: the amount of giant battery storage doubled, so extra power made on sunny or windy days could be saved instead of wasted.\n\nThe people who run the power network say the main thing holding back more growth is a shortage of power lines to move electricity to where it is needed.\n\nWhy it matters: more clean power on the grid means less pollution from burning coal and gas.",
    genz: "Solar and wind just hit a new high score ☀️💨\n\nRecord share of electricity this quarter. The secret sauce? Battery storage DOUBLED, so extra power gets saved instead of wasted 🔋\n\nThe bottleneck now: not enough power lines to move it all around.\n\nClean energy is cooking. The grid just needs to catch up.",
  },
  {
    sectorId: "climate",
    title: "City trials reflective road coating to cut street temperatures during heatwaves",
    body: "A municipal pilot applied a high-albedo surface treatment to several kilometres of road to mitigate the urban heat island effect. Initial measurements showed surface temperatures several degrees lower than untreated asphalt.",
    plain: "A city is testing a special light-coloured coating on some of its roads. Dark roads soak up sunlight and make cities hotter than the countryside around them. The coating bounces more sunlight away.\n\nEarly measurements show the coated roads are several degrees cooler than ordinary ones.\n\nWhy it matters: cooler streets could make heatwaves in cities more bearable and safer.",
    genz: "This city is putting sunscreen on its roads. Kind of. 🧴🛣️\n\nDark asphalt soaks up heat and turns cities into ovens. So they're testing a reflective coating that bounces sunlight away.\n\nEarly results: road surfaces several degrees cooler.\n\nHeatwave survival strategy unlocked 🔓",
  },
  {
    sectorId: "world",
    title: "Leaders agree framework for trade talks after two-day summit",
    body: "Following bilateral negotiations, the two governments issued a joint communiqué outlining a framework for tariff reductions and regulatory alignment. Negotiators will reconvene next quarter; no binding commitments have been made.",
    plain: "After two days of meetings, the leaders of two countries have agreed on a rough plan for future trade talks. The plan covers lowering the taxes each charges on goods from the other, and making their product rules more alike.\n\nNothing is final. Their teams will meet again in a few months, and neither side has made a firm promise yet.\n\nWhy it matters: trade deals can change the price and availability of everyday goods.",
    genz: "Two world leaders met for two days and came out with… a plan to make a plan 📝\n\nThe framework covers lower tariffs and lining up their rules for products.\n\nNothing binding yet. Negotiators link up again next quarter.\n\nSo basically they're in the talking stage. We'll see if it goes anywhere 👀",
  },
  {
    sectorId: "world",
    title: "Parliament passes bill expanding paid parental leave to 26 weeks",
    body: "Lawmakers approved legislation extending statutory paid parental leave from 18 to 26 weeks, with a portion reserved for each parent on a use-it-or-lose-it basis. The measure takes effect next fiscal year.",
    plain: "Lawmakers have passed a new law giving new parents more paid time off work: 26 weeks, up from 18. Part of the leave is set aside for each parent, and it cannot be handed over to the other one. If a parent doesn't use their share, it is lost.\n\nThe change starts in the next budget year.\n\nWhy it matters: families get more paid time with a new baby, and both parents are encouraged to take leave.",
    genz: "New parents just got a W 👶\n\nParliament passed a bill bumping paid parental leave from 18 weeks to 26.\n\nAnd part of it is reserved for each parent. Use it or lose it. No handing it all to one person.\n\nKicks in next fiscal year. Big if you're planning a tiny human.",
  },
  {
    sectorId: "entertainment",
    title: "Streaming service to add cheaper ad-supported tier and limit password sharing",
    body: "The platform will launch an advertising-supported subscription tier at a lower price point while introducing household verification to curb account sharing. Executives said the changes target subscriber growth and average revenue per user.",
    plain: "A streaming service is launching a cheaper plan that shows adverts. At the same time, it will start checking that everyone using an account lives in the same home, to stop people sharing passwords with friends and family elsewhere.\n\nThe company says the changes are meant to bring in more subscribers and earn more money from each one.\n\nWhy it matters: you may pay less if you accept adverts, but borrowing someone else's login is getting harder.",
    genz: "Bad news for everyone still on their ex's account 😬\n\nA streaming service is cracking down on password sharing with household checks.\n\nThe consolation prize: a cheaper plan… with ads 📺\n\nThey want more subscribers and more money per subscriber. Shocking. Truly.",
  },
  {
    sectorId: "entertainment",
    title: "Indie film made for under $1m wins top prize at international festival",
    body: "A low-budget independent feature shot over 18 days took the festival's highest award, beating several studio-backed entries. The director said distribution negotiations are under way.",
    plain: "A small film made with less than $1 million, filmed in just 18 days, has won the top award at a major international film festival. It beat several films backed by big studios.\n\nThe director says talks are under way with companies that could bring the film to cinemas or streaming.\n\nWhy it matters: it shows a film doesn't need a giant budget to be recognised as the best.",
    genz: "A movie made for under $1M just beat the big studios 🎬🏆\n\nShot in 18 days. Tiny budget. Took the TOP prize at a major international festival.\n\nThe director says distribution talks are happening, so it might hit a screen near you.\n\nUnderdog era. We love to see it.",
  },
  {
    sectorId: "sport",
    title: "Underdogs reach cup final after penalty shootout win",
    body: "The lower-division side advanced to the final after a 1-1 draw was settled 5-4 on penalties, with their goalkeeper saving the decisive spot-kick. It is the club's first final in more than three decades.",
    plain: "A team from a lower league has reached the cup final. The match ended 1-1, so it was decided by penalty kicks, which they won 5-4. Their goalkeeper saved the last penalty to win it.\n\nIt is the first time the club has reached a final in more than 30 years.\n\nWhy it matters: it's a classic underdog story, with a small club one game away from a trophy.",
    genz: "THE UNDERDOGS DID IT 🚨⚽\n\n1-1 after full time. Goes to penalties. They win 5-4 and the keeper SAVES the last one 🧤\n\nA lower-division club. In the final. First time in 30+ years.\n\nIf you're not emotional you're not paying attention.",
  },
  {
    sectorId: "sport",
    title: "League approves trial of automated offside technology for next season",
    body: "Clubs voted to adopt semi-automated offside detection using limb-tracking cameras, aiming to reduce the duration of video assistant referee reviews. The system will be evaluated over a full season.",
    plain: "Football clubs have voted to try out a camera system that tracks players' arms and legs to help decide whether a player is offside, meaning too far forward when the ball is passed to them. The goal is to make video replay checks quicker.\n\nThe system will be tested for a whole season before a final decision.\n\nWhy it matters: fans could spend less time waiting for referees to check replays.",
    genz: "No more 4-minute offside checks?? 🙏\n\nThe league voted to trial automated offside tech next season. Cameras track players' limbs and help make the call faster.\n\nIt's a full-season test, so we'll see how it holds up.\n\nVAR drama may never be the same.",
  },
];

export const SAMPLE_STORIES = raw.map((s, i) => ({
  id: `sample-${i + 1}`,
  sectorId: s.sectorId,
  title: s.title,
  body: s.body,
  url: null,
  source: "Sample story",
  publishedAt: hoursAgo(1 + i * 1.5),
  sample: true,
  versions: { plain: s.plain, genz: s.genz },
}));
