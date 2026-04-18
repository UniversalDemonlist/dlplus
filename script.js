document.body.classList.add("dark");

let globalDemons = [];
let mainList = [];
let extendedList = [];
let legacyList = [];
let bannedPlayers = [];
window._leaderboardScores = {};

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupThemeToggle();
  loadEverything();
  setupSearchBar();
  setupDropdownSelects();
});

function setupThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });
}

async function loadEverything() {
  bannedPlayers = await fetch("data/banned.json").then(r => r.json()).catch(() => []);
  await loadDemonList();
}

function stopAllVideos() {
  document.querySelectorAll("iframe").forEach(f => {
    const old = f.src;
    f.src = "";
    f.src = old;
  });
}

function setupTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      stopAllVideos();
      const tab = btn.getAttribute("data-tab");

      buttons.forEach(b => b.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(tab).classList.add("active");
    });
  });
}

async function loadDemonList() {
  const list = await fetch("data/list.json").then(r => r.json());
  const demonFiles = await Promise.all(
    list.map(id =>
      fetch(`data/demons/${id}.json`)
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );

  globalDemons = demonFiles
    .map((d, i) => (d ? { ...d, position: i + 1 } : null))
    .filter(Boolean);

  mainList = globalDemons.filter(d => d.position <= 75);
  extendedList = globalDemons.filter(d => d.position > 75 && d.position <= 150);
  legacyList = globalDemons.filter(d => d.position > 150);

  renderDemonCards();
  populateDropdowns();
  loadLeaderboard();
}

function renderDemonCards(listOverride) {
  stopAllVideos();
  const container = document.getElementById("demon-container");
  container.innerHTML = "";

  for (let i = 0; i < 6; i++) container.appendChild(createPlaceholderCard());

  setTimeout(() => {
    const list = listOverride || globalDemons.filter(d => d.position <= 150);
    container.innerHTML = "";
    list.forEach(d => container.appendChild(createDemonCard(d)));
  }, 600);
}

function populateDropdowns() {
  const mainSelect = document.getElementById("select-main");
  const extSelect = document.getElementById("select-extended");
  const legacySelect = document.getElementById("select-legacy");

  function fill(select, list) {
    if (!select) return;
    select.innerHTML = '<option value="">Select a demon</option>';
    list.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.position;
      opt.textContent = `#${d.position} — ${d.name}`;
      select.appendChild(opt);
    });
  }

  fill(mainSelect, mainList);
  fill(extSelect, extendedList);
  fill(legacySelect, legacyList);
}

function setupDropdownSelects() {
  function attach(select, list) {
    if (!select) return;
    select.addEventListener("change", () => {
      stopAllVideos();
      const pos = Number(select.value);
      if (!pos) return;
      const demon = list.find(d => d.position === pos);
      if (demon) openDemonPage(demon);
      select.value = "";
    });
  }

  attach(document.getElementById("select-main"), mainList);
  attach(document.getElementById("select-extended"), extendedList);
  attach(document.getElementById("select-legacy"), legacyList);
}

function getYoutubeId(url) {
  if (!url) return "";
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
  return match ? match[1] : "";
}

function getYoutubeThumbnail(url) {
  const id = getYoutubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

function getTier(pos) {
  if (pos <= 10) return 39;
  if (pos <= 20) return 38;
  if (pos <= 30) return 37;
  if (pos <= 40) return 36;
  if (pos <= 50) return 35;
  return 34;
}

function createDemonCard(demon) {
  const card = document.createElement("div");
  card.className = "demon-card";

  const img = document.createElement("img");
  img.src =
    demon.thumbnail?.trim() ||
    getYoutubeThumbnail(demon.verification) ||
    "https://via.placeholder.com/300x170?text=No+Preview";

  const info = document.createElement("div");
  info.className = "demon-info";

  const creators = Array.isArray(demon.creators)
    ? demon.creators.join(", ")
    : demon.creators || "Unknown";

  const score = demon.position <= 150 ? 350 / Math.sqrt(demon.position) : 0;

  info.innerHTML = `
    <h2>#${demon.position} — ${demon.name}</h2>
    <p><strong>Author:</strong> ${demon.author}</p>
    <p><strong>Creators:</strong> ${creators}</p>
    <p><strong>Verifier:</strong> ${demon.verifier}</p>
    <p><strong>GDDL Tier:</strong> ${getTier(demon.position)}</p>
    <p><strong>Score Value:</strong> ${score.toFixed(2)}</p>
  `;

  card.appendChild(img);
  card.appendChild(info);

  card.addEventListener("click", () => openDemonPage(demon));

  return card;
}

function createPlaceholderCard() {
  const card = document.createElement("div");
  card.className = "placeholder-card";

  const thumb = document.createElement("div");
  thumb.className = "placeholder-thumb";

  const info = document.createElement("div");
  info.className = "placeholder-info";

  for (let i = 0; i < 5; i++) {
    const line = document.createElement("div");
    line.className = "placeholder-line";
    info.appendChild(line);
  }

  card.appendChild(thumb);
  card.appendChild(info);

  return card;
}

function openDemonPage(demon) {
  stopAllVideos();
  const container = document.getElementById("demon-page-container");

  const thumb =
    demon.thumbnail?.trim() ||
    getYoutubeThumbnail(demon.verification) ||
    "https://via.placeholder.com/300x170?text=No+Preview";

  const creators = Array.isArray(demon.creators)
    ? demon.creators.join(", ")
    : demon.creators || "Unknown";

  const score = demon.position <= 150 ? 350 / Math.sqrt(demon.position) : 0;

  const videoId = getYoutubeId(demon.verification);
  const iframeSrc = videoId ? `https://www.youtube.com/embed/${videoId}` : "";

  const videoBlock = iframeSrc
    ? `<div class="fancy-video-wrap"><iframe src="${iframeSrc}" allowfullscreen></iframe></div>`
    : `<div class="fancy-video-wrap"><img src="${thumb}"></div>`;

  const validRecords = demon.records
    .map(r =>
      typeof r === "string"
        ? { user: r, percent: 100 }
        : { user: r.user, percent: r.percent || 100, link: r.link || "" }
    )
    .filter(r => r.user && r.user !== "Not beaten yet" && !bannedPlayers.includes(r.user))
    .sort((a, b) => b.percent - a.percent)
    .map(r => {
      const vid = r.link ? `<a href="${r.link}" target="_blank">Video</a>` : "No video";
      return `<p><strong>${r.user}</strong> — ${r.percent}% (${vid})</p>`;
    })
    .join("");

  container.innerHTML = `
    <div class="fancy-demon-header">
      <h1>#${demon.position} — ${demon.name}</h1>
      ${demon.description ? `<p class="fancy-desc">${demon.description}</p>` : ""}
      <div class="fancy-meta-box">
        <p><strong>Author:</strong> ${demon.author}</p>
        <p><strong>Creators:</strong> ${creators}</p>
        <p><strong>Verifier:</strong> ${demon.verifier}</p>
        <p><strong>Tier:</strong> ${getTier(demon.position)}</p>
        <p><strong>Score Value:</strong> ${score.toFixed(2)}</p>
      </div>
    </div>

    ${videoBlock}

    <h2 class="fancy-records-title">Records</h2>
    <div class="fancy-records-box">${validRecords || "<p>No records yet.</p>"}</div>
  `;

  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.getElementById("demon-page").classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupSearchBar() {
  const input = document.getElementById("search-bar");
  input.addEventListener("input", () => {
    stopAllVideos();
    const
