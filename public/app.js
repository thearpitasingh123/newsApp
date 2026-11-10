const view = document.getElementById("view");
const tabs = document.getElementById("tabs");
const picker = document.getElementById("picker");
const pickerChips = document.getElementById("picker-chips");
const pickerDone = document.getElementById("picker-done");

const STORAGE_KEY = "tenfold.sectors";
let config = { sectors: [], maxStoriesPerSector: 10 };
let mySectors = loadMySectors();

function loadMySectors() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}
function saveMySectors() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mySectors));
  } catch {
    // private browsing: the choice just lasts for this visit
  }
}

async function api(path) {
  const res = await fetch(path);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const sectorById = (id) => config.sectors.find((s) => s.id === id);

function timeAgo(ms) {
  const mins = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function skeleton(lines = 5) {
  return `<div class="skeleton" aria-label="Loading">${"<span></span>".repeat(lines)}</div>`;
}

function card(story, rank) {
  const sources = story.sample
    ? '<span class="badge">Sample</span>'
    : esc(story.sources.map((s) => s.name).join(" · "));
  return `<a class="card" href="#/story/${esc(story.sectorId)}/${esc(story.id)}">
    ${rank ? `<span class="rank">${rank}</span>` : ""}
    <div>
      <h3>${esc(story.title)}</h3>
      <p class="meta">${sources} · ${timeAgo(story.publishedAt)}</p>
    </div>
  </a>`;
}

function sampleNotice(stories) {
  return stories.some((s) => s.sample)
    ? '<p class="notice">Live news feeds can\'t be reached right now, so these are made-up sample stories for trying the app.</p>'
    : "";
}

function renderTabs(activeId) {
  // Tabs for the sectors you follow, plus the one you're looking at if it isn't one of them.
  const ids = mySectors.includes(activeId) || activeId === "overview" ? mySectors : [...mySectors, activeId];
  tabs.innerHTML =
    `<a class="tab" href="#/" ${activeId === "overview" ? 'aria-current="page"' : ""}>Overview</a>` +
    ids
      .map(sectorById)
      .filter(Boolean)
      .map(
        (s) =>
          `<a class="tab" href="#/sector/${s.id}" ${activeId === s.id ? 'aria-current="page"' : ""}>${s.emoji} ${esc(s.name)}</a>`,
      )
      .join("") +
    `<button class="tab tab-add" type="button" id="tab-add">+ More</button>`;
  document.getElementById("tab-add").addEventListener("click", openPicker);
  tabs.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "center" });
}

async function showOverview() {
  renderTabs("overview");
  view.innerHTML = skeleton(8);
  const { sections } = await api(`/api/overview?sectors=${mySectors.join(",")}`);
  const all = sections.flatMap((s) => s.stories);
  view.innerHTML =
    `<h1 class="page-title">Your overview</h1>
     <p class="muted">The top stories from the sectors you follow, in your order.</p>
     ${sampleNotice(all)}` +
    sections
      .map(({ sectorId, stories }) => {
        const s = sectorById(sectorId);
        return `<div class="section-head">
            <h2>${s.emoji} ${esc(s.name)}</h2>
            <a href="#/sector/${s.id}">Deep dive →</a>
          </div>
          ${stories.map((st) => card(st)).join("") || '<p class="muted">Nothing new here right now.</p>'}`;
      })
      .join("");
}

async function showSector(id) {
  const sector = sectorById(id);
  if (!sector) return showOverview();
  renderTabs(id);
  view.innerHTML = skeleton(8);
  const { stories } = await api(`/api/sectors/${id}/stories`);
  view.innerHTML =
    `<h1 class="page-title">${sector.emoji} ${esc(sector.name)}</h1>
     <p class="muted">The ${stories.length} stories that matter most right now. Never more than ${config.maxStoriesPerSector}.</p>
     ${sampleNotice(stories)}
     <div style="margin-top:16px">${stories.map((st, i) => card(st, i + 1)).join("") || '<p class="empty">Nothing new here right now.</p>'}</div>`;
}

const TABS = [
  { id: "full", label: "Full story" },
  { id: "plain", label: "Plain English" },
  { id: "genz", label: "Gen Z" },
];

const paragraphs = (text) =>
  text
    .split(/\n\s*\n/)
    .filter((p) => p.trim())
    .map((p) => `<p>${esc(p.trim())}</p>`)
    .join("");

// The Plain English tab: the 5-stage knowledge framework.
function plainHtml(plain) {
  const stage = (n, name, question, body, note = "") =>
    body
      ? `<section class="stage">
          <p class="stage-label"><span class="stage-num">${n}</span> ${name}</p>
          <h2>${question}</h2>
          ${body}
          ${note ? `<p class="stage-note">${note}</p>` : ""}
        </section>`
      : "";
  const background = "Background added by AI. It can be out of date, so treat it as context, not news.";
  const quiz = plain.quiz.length
    ? `<div class="quiz"><p class="quiz-title">Quick quiz - answer in your head, then tap to check</p>${plain.quiz
        .map((q) => `<details><summary>${esc(q.question)}</summary><p>${esc(q.answer)}</p></details>`)
        .join("")}</div>`
    : "";
  const retain = (plain.takeaway ? `<p class="takeaway">${esc(plain.takeaway)}</p>` : "") + quiz;
  const apply =
    (plain.care ? paragraphs(plain.care) : "") +
    (plain.discuss ? `<p><strong>Talk about it:</strong> ${esc(plain.discuss)}</p>` : "") +
    (plain.watch ? `<p><strong>Watch next:</strong> ${esc(plain.watch)}</p>` : "");
  return (
    stage("01", "Read", "What happened?", plain.read && paragraphs(plain.read)) +
    stage("02", "Understand", "Why did it happen?", plain.understand && paragraphs(plain.understand), background) +
    stage("03", "Connect", "What does it connect to?", plain.connect && paragraphs(plain.connect), background) +
    stage("04", "Retain", "What will I remember?", retain) +
    stage("05", "Apply", "Why should I care?", apply)
  );
}

async function showStory(sectorId, id) {
  view.innerHTML = skeleton(6);
  let story;
  try {
    ({ story } = await api(`/api/stories/${id}`));
  } catch {
    // The server only remembers stories it has listed; reload that sector's list once and retry.
    await api(`/api/sectors/${sectorId}/stories`);
    ({ story } = await api(`/api/stories/${id}`));
  }
  const sector = sectorById(story.sectorId);
  renderTabs(story.sectorId);

  const others = story.sources.filter((s) => s.url && s.url !== story.url);
  view.innerHTML = `<article class="story">
      <a class="back" href="#/sector/${sector.id}">← ${sector.emoji} ${esc(sector.name)}</a>
      <p class="meta" style="margin:0 0 8px">${story.sample ? '<span class="badge">Sample</span>' : esc(story.source)} · ${timeAgo(story.publishedAt)}</p>
      <h1>${esc(story.title)}</h1>
      <div class="styles" role="tablist" aria-label="Reading style">
        ${TABS.map((t, i) => `<button role="tab" type="button" data-style="${t.id}" aria-selected="${i === 0}">${t.label}</button>`).join("")}
      </div>
      <div class="story-text" id="story-text" role="tabpanel" aria-live="polite"></div>
      ${story.url ? `<a class="read-more" href="${esc(story.url)}" target="_blank" rel="noopener">Read the original at ${esc(story.source)} ↗</a>` : ""}
      ${others.length ? `<p class="also">Also covered by ${others.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join(", ")}</p>` : ""}
    </article>`;

  const textEl = document.getElementById("story-text");
  const teaser = story.body ? paragraphs(story.body) : "";
  let current = "full";
  let reading = null;
  let failure = null;

  function render() {
    for (const b of view.querySelectorAll(".styles button")) b.setAttribute("aria-selected", String(b.dataset.style === current));
    textEl.className = `story-text ${current}`;
    if (reading) {
      const note =
        reading.basedOn === "summary"
          ? '<p class="notice">The full article couldn\'t be read, so this is based on the publisher\'s short summary.</p>'
          : "";
      textEl.innerHTML = note + (current === "plain" ? plainHtml(reading.plain) : paragraphs(reading[current]));
    } else if (failure) {
      // Keep the publisher's summary readable on the first tab even when writing failed.
      textEl.innerHTML = `<p class="notice">${esc(failure)}</p>` + (current === "full" ? teaser : "");
    } else {
      textEl.innerHTML =
        (current === "full" ? teaser : "") +
        `<p class="writing">Reading the full article and writing your version…</p>${skeleton(6)}`;
    }
  }

  view.querySelector(".styles").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-style]");
    if (!btn) return;
    current = btn.dataset.style;
    render();
  });
  render();

  try {
    ({ reading } = await api(`/api/stories/${story.id}/reading`));
  } catch (error) {
    failure = error.message;
  }
  // Only update the page if the reader is still on this story.
  if (textEl.isConnected) render();
}

/* Sector picker */
function renderPicker() {
  const groups = [...new Set(config.sectors.map((s) => s.group))];
  pickerChips.innerHTML = groups
    .map(
      (group) =>
        `<h3 class="chip-group">${esc(group)}</h3><div class="chips">${config.sectors
          .filter((s) => s.group === group)
          .map((s) => {
            const pos = mySectors.indexOf(s.id);
            return `<button type="button" class="chip" data-id="${s.id}" aria-pressed="${pos >= 0}">
              ${pos >= 0 ? `<span class="order">${pos + 1}</span>` : ""}${s.emoji} ${esc(s.name)}
            </button>`;
          })
          .join("")}</div>`,
    )
    .join("");
  pickerDone.disabled = mySectors.length === 0;
}
pickerChips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  const id = chip.dataset.id;
  mySectors = mySectors.includes(id) ? mySectors.filter((x) => x !== id) : [...mySectors, id];
  renderPicker();
});
picker.addEventListener("cancel", (e) => {
  if (mySectors.length === 0) e.preventDefault();
});
picker.addEventListener("close", () => {
  saveMySectors();
  route();
});
document.getElementById("edit-sectors").addEventListener("click", openPicker);
function openPicker() {
  renderPicker();
  picker.showModal();
}

/* Routing */
async function route() {
  const [, kind, a, b] = location.hash.split("/");
  try {
    if (kind === "sector") await showSector(a);
    else if (kind === "story") await showStory(a, b);
    else await showOverview();
  } catch (error) {
    view.innerHTML = `<p class="empty">${esc(error.message)}</p>`;
  }
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

(async function start() {
  try {
    config = await api("/api/sectors");
  } catch (error) {
    view.innerHTML = `<p class="empty">${esc(error.message)}</p>`;
    return;
  }
  mySectors = mySectors.filter(sectorById);
  if (mySectors.length === 0) openPicker();
  else route();
})();
