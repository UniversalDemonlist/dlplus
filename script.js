let globalDemons = [];
let mainList = [];
let extendedList = [];
let legacyList = [];
let bannedPlayers = [];

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

  mainList = globalDemons.filter(d => d.position >= 1 && d.position <= 75);
  extendedList = globalDemons.filter(d => d.position >= 76 && d.position <= 150);
  legacyList = globalDemons.filter(d => d.position > 150);

  renderDemonCards();
  populateDropdowns();
  loadLeaderboard();
}

function renderDemonCards(listOverride) {
  stopAllVideos();
  const container = document.getElementById("demon-container");
  container.innerHTML = "";

  for (let i = 0; i < 6; i++) {
    container.appendChild(createPlaceholderCard());
  }

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

  if (mainSelect) {
    mainSelect.innerHTML = '<option value="">Select a demon</option>';
    mainList.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.position;
      opt.textContent = "#" + d.position + " — " + d.name;
      mainSelect.appendChild(opt);
    });
  }

  if (extSelect) {
    extSelect.innerHTML = '<option value="">Select a demon</option>';
    extendedList.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.position;
      opt.textContent = "#" + d.position + " — " + d.name;
      extSelect.appendChild(opt);
    });
  }

  if (legacySelect) {
    legacySelect.innerHTML = '<option value="">Select a demon</option>';
    legacyList.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.position;
      opt.textContent = "#" + d.position + " — " + d.name;
      legacySelect.appendChild(opt);
    });
  }
}

function setupDropdownSelects() {
  const mainSelect = document.getElementById("select-main");
  const extSelect = document.getElementById("select-extended");
  const legacySelect = document.getElementById("select-legacy");

  if (mainSelect) {
    mainSelect.addEventListener("change", () => {
      stopAllVideos();
      const pos = Number(mainSelect.value);
      if (!pos) return;
      const demon = mainList.find(d => d.position === pos);
      if (demon) openDemonPage(demon);
      mainSelect.value = "";
    });
  }

  if (extSelect) {
    extSelect.addEventListener("change", () => {
      stopAllVideos();
      const pos = Number(extSelect.value);
      if (!pos) return;
      const demon = extendedList.find(d => d.position === pos);
      if (demon) openDemonPage(demon);
      extSelect.value = "";
    });
  }

  if (legacySelect) {
    legacySelect.addEventListener("change", () => {
      stopAllVideos();
      const pos = Number(legacySelect.value);
      if (!pos) return;
      const demon = legacyList.find(d => d.position === pos);
      if (demon) openDemonPage(demon);
      legacySelect.value = "";
    });
  }
}

function getYoutubeId(url) {
  if (!url) return "";
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
  return match ? match[1] : "";
}

function getYoutubeThumbnail(url) {
  const id = getYoutubeId(url);
  if (!id) return "";
  return "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
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
  const customThumb = demon.thumbnail && String(demon.thumbnail).trim();
  const verificationThumb = getYoutubeThumbnail(demon.verification);
  img.src = customThumb || verificationThumb || "https://via.placeholder.com/300x170?text=No+Preview";

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
    ${demon.position <= 150 ? `<p><strong>GDDL Tier:</strong> ${getTier(demon.position)}</p>` : ""}
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

  const customThumb = demon.thumbnail && String(demon.thumbnail).trim();
  const verificationThumb = getYoutubeThumbnail(demon.verification);
  const thumb = customThumb || verificationThumb || "https://via.placeholder.com/300x170?text=No+Preview";

  const creators = Array.isArray(demon.creators)
    ? demon.creators.join(", ")
    : demon.creators || "Unknown";

  const score = demon.position <= 150 ? 350 / Math.sqrt(demon.position) : 0;

  const videoId = getYoutubeId(demon.verification);
  const iframeSrc = videoId ? "https://www.youtube.com/embed/" + videoId : "";

  const videoBlock = iframeSrc
    ? `<div class="demon-page-video fancy-video"><iframe src="${iframeSrc}" allowfullscreen></iframe></div>`
    : `<img src="${thumb}" class="demon-page-video fancy-video">`;

  const validRecords = demon.records.map(r => {
    if (typeof r === "string") {
      return {
        user: r,
        percent: 100,
        link: "",
        hz: null
      };
    }
    return {
      user: r.user,
      percent: r.percent || 100,
      link: r.link || "",
      hz: r.hz || null
    };
  }).filter(r =>
    r.user &&
    r.user !== "Not beaten yet" &&
    !bannedPlayers.includes(r.user)
  );

  const recordList = validRecords
    .sort((a, b) => (b.percent || 0) - (a.percent || 0))
    .map(r => {
      const vid = r.link ? `<a href="${r.link}" target="_blank">Video</a>` : "No video";
      return `<p><strong>${r.user}</strong> — ${r.percent}% (${vid})</p>`;
    })
    .join("");

  const finalRecords = recordList || "<p>No records yet.</p>";

  container.innerHTML = `
    <div class="demon-page-header fancy-header">
      <h2>#${demon.position} — ${demon.name}</h2>
      ${demon.description ? `<p class="demon-description">${demon.description}</p>` : ""}
      <div class="demon-page-meta fancy-meta">
        <p><strong>Author:</strong> ${demon.author}</p>
        <p><strong>Creators:</strong> ${creators}</p>
        <p><strong>Verifier:</strong> ${demon.verifier}</p>
        ${demon.position <= 150 ? `<p><strong>GDDL Tier:</strong> ${getTier(demon.position)}</p>` : ""}
        <p><strong>Score Value:</strong> ${score.toFixed(2)}</p>
        ${demon.pointercrate ? `<p><a href="${demon.pointercrate}" target="_blank">Pointercrate</a></p>` : ""}
        ${demon.aredl ? `<p><a href="${demon.aredl}" target="_blank">AREDL</a></p>` : ""}
      </div>
    </div>

    ${videoBlock}

    <h3 class="fancy-records-title">Records</h3>
    <div class="fancy-records-box">${finalRecords}</div>
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
    const q = input.value.toLowerCase();
    const combined = [...mainList, ...extendedList];
    const filtered = combined.filter(d =>
      d.name.toLowerCase().includes(q) ||
      String(d.position).includes(q)
    );
    renderDemonCards(filtered);
  });
}

function loadLeaderboard() {
  stopAllVideos();

  const container = document.getElementById("leaderboard-container");
  container.innerHTML = "";

  for (let i = 0; i < 6; i++) {
    container.appendChild(createPlaceholderPlayer());
  }

  setTimeout(() => {
    const scores = {};
    const playerSet = new Set();

    globalDemons.forEach(demon => {
      if (demon.verifier && !bannedPlayers.includes(demon.verifier)) playerSet.add(demon.verifier);
      demon.records.forEach(r => {
        const record = typeof r === "string"
          ? { user: r, percent: 100 }
          : { user: r.user, percent: r.percent || 100 };

        if (record.user && record.user !== "Not beaten yet" && !bannedPlayers.includes(record.user)) {
          playerSet.add(record.user);
        }
      });
    });

    const allPlayers = Array.from(playerSet);

    allPlayers.forEach(name => scores[name] = 0);

    globalDemons.forEach(demon => {
      if (demon.position > 150) return;

      const baseScore = 350 / Math.sqrt(demon.position);

      demon.records.forEach(r => {
        const record = typeof r === "string"
          ? { user: r, percent: 100 }
          : { user: r.user, percent: r.percent || 100 };

        const p = record.user;
        if (!p || p === "Not beaten yet" || bannedPlayers.includes(p)) return;

        if (record.percent >= demon.percentToQualify) {
          const earned = record.percent === 100 ? baseScore : baseScore * (record.percent / 100);
          scores[p] += earned;
        }
      });

      const verifier = demon.verifier;
      if (verifier && !bannedPlayers.includes(verifier)) {
        scores[verifier] += baseScore;
      }
    });

    const leaderboard = allPlayers
      .map(name => ({ name, score: scores[name] || 0 }))
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score);

    container.innerHTML = "";
    leaderboard.forEach((p, i) => {
      container.appendChild(createPlayerCard(p.name, p.score, i + 1));
    });
  }, 600);
}

function createPlayerCard(name, score, rank) {
  const card = document.createElement("div");
  card.className = "player-card";

  const img = document.createElement("img");
  img.src = "https://via.placeholder.com/300x170?text=Player";

  const info = document.createElement("div");
  info.className = "player-info";
  info.innerHTML = `
    <h2>#${rank} — ${name}</h2>
    <p><strong>Score:</strong> ${score.toFixed(2)}</p>
  `;

  card.appendChild(img);
  card.appendChild(info);

  return card;
}

function createPlaceholderPlayer() {
  const card = document.createElement("div");
  card.className = "placeholder-player";

  const thumb = document.createElement("div");
  thumb.className = "placeholder-thumb";

  const info = document.createElement("div");
  info.className = "placeholder-info";

  for (let i = 0; i < 3; i++) {
    const line = document.createElement("div");
    line.className = "placeholder-line";
    info.appendChild(line);
  }

  card.appendChild(thumb);
  card.appendChild(info);

  return card;
}
