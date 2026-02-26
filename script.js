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

function setupThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  btn.addEventListener("click", () => {
    document.body.classList.toggle("light");
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
  extendedList = globalDemons.filter(d => d.position >= 76 && d.position <= 200);
  legacyList = globalDemons.filter(d => d.position > 200);

  renderDemonCards();
  populateDropdowns();
  loadLeaderboard();
}

function renderDemonCards(listOverride) {
  stopAllVideos();
  const container = document.getElementById("demon-container");
  const list = listOverride || [...mainList, ...extendedList];
  container.innerHTML = "";
  list.forEach(d => container.appendChild(createDemonCard(d)));
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

  const score = demon.position <= 200 ? 350 / Math.sqrt(demon.position) : 0;
  const posLabel = demon.position > 200 ? "Legacy" : "#" + demon.position;

  info.innerHTML = `
    <h2>${posLabel} — ${demon.name}</h2>
    <p><strong>Author:</strong> ${demon.author}</p>
    <p><strong>Creators:</strong> ${creators}</p>
    <p><strong>Verifier:</strong> ${demon.verifier}</p>
    <p><strong>Percent to Qualify:</strong> ${demon.percentToQualify}%</p>
    <p><strong>Score Value:</strong> ${score.toFixed(2)}</p>
  `;

  card.appendChild(img);
  card.appendChild(info);

  card.addEventListener("click", () => openDemonPage(demon));

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

  const score = demon.position <= 200 ? 350 / Math.sqrt(demon.position) : 0;
  const posLabel = demon.position > 200 ? "Legacy" : "#" + demon.position;

  const videoId = getYoutubeId(demon.verification);
  const iframeSrc = videoId ? "https://www.youtube.com/embed/" + videoId : "";

  const videoBlock = iframeSrc
    ? `<div class="demon-page-video"><iframe src="${iframeSrc}" allowfullscreen></iframe></div>`
    : `<img src="${thumb}" class="demon-page-video">`;

  const validRecords = demon.records.filter(r =>
    r.user &&
    r.user !== "Not beaten yet" &&
    !bannedPlayers.includes(r.user)
  );

  const recordList = validRecords
    .sort((a, b) => (b.percent || 0) - (a.percent || 0))
    .map(r => {
      const player = r.user;
      const progress = typeof r.percent === "number" ? r.percent : 0;
      const vid = r.link ? `<a href="${r.link}" target="_blank">Video</a>` : "No video";
      return `<p><strong>${player}</strong> — ${progress}% (${vid})</p>`;
    })
    .join("");

  const finalRecords = recordList || "<p>No records yet.</p>";

  container.innerHTML = `
    <div class="demon-page-header">
      <h2>${posLabel} — ${demon.name}</h2>
      <div class="demon-page-meta">
        <p><strong>Author:</strong> ${demon.author}</p>
        <p><strong>Creators:</strong> ${creators}</p>
        <p><strong>Verifier:</strong> ${demon.verifier}</p>
        <p><strong>Percent to Qualify:</strong> ${demon.percentToQualify}%</p>
        <p><strong>Score Value:</strong> ${score.toFixed(2)}</p>
      </div>
    </div>
    ${videoBlock}
    <h3>Records</h3>
    ${finalRecords}
  `;

  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.getElementById("demon-page").classList.add("active");
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
  const scores = {};
  const playerSet = new Set();

  globalDemons.forEach(demon => {
    if (demon.verifier && !bannedPlayers.includes(demon.verifier)) playerSet.add(demon.verifier);
    demon.records.forEach(record => {
      if (
        record.user &&
        record.user !== "Not beaten yet" &&
        !bannedPlayers.includes(record.user)
      ) {
        playerSet.add(record.user);
      }
    });
  });

  const allPlayers = Array.from(playerSet);

  allPlayers.forEach(name => {
    scores[name] = 0;
  });

  globalDemons.forEach(demon => {
    if (demon.position > 200) return;

    const baseScore = 350 / Math.sqrt(demon.position);

    demon.records.forEach(record => {
      const p = record.user;
      const progress = Number(record.percent);
      if (!p || p === "Not beaten yet" || bannedPlayers.includes(p)) return;
      if (progress >= demon.percentToQualify) {
        const earned = progress === 100 ? baseScore : baseScore * (progress / 100);
        scores[p] += earned;
      }
    });

    const verifier = demon.verifier;
    if (verifier && !bannedPlayers.includes(verifier)) {
      scores[verifier] += baseScore;
    }
  });

  const leaderboard = allPlayers
    .map(name => ({
      name,
      score: scores[name] || 0
    }))
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score);

  renderLeaderboard(leaderboard, scores);
}

function renderLeaderboard(list, scores) {
  const container = document.getElementById("leaderboard-container");
  container.innerHTML = "";

  list.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    row.innerHTML = `
      <span>#${i + 1} ${p.name}</span>
      <span>${p.score.toFixed(2)}</span>
    `;
    row.addEventListener("click", () => openPlayerPage(p.name, scores));
    container.appendChild(row);
  });
}

function openPlayerPage(playerName, scores) {
  stopAllVideos();
  if (bannedPlayers.includes(playerName)) return;

  const container = document.getElementById("leaderboard-container");
  container.innerHTML = "";

  const back = document.createElement("div");
  back.className = "player-back";
  back.textContent = "← Back to Leaderboard";
  back.addEventListener("click", loadLeaderboard);
  container.appendChild(back);

  const title = document.createElement("h2");
  title.textContent = playerName + " — " + scores[playerName].toFixed(2) + " points";
  container.appendChild(title);

  const recordContainer = document.createElement("div");
  recordContainer.className = "player-records";

  globalDemons.forEach(demon => {
    demon.records.forEach(record => {
      if (record.user === playerName) {
        const card = createDemonCard(demon);
        const baseScore = demon.position <= 200 ? 350 / Math.sqrt(demon.position) : 0;
        const earned = record.percent === 100
          ? baseScore
          : baseScore * (record.percent / 100);

        const info = card.querySelector(".demon-info");
        info.innerHTML += `<p><strong>Progress:</strong> ${record.percent}%</p>`;
        info.innerHTML += `<p><strong>Points Earned:</strong> ${earned.toFixed(2)}</p>`;

        recordContainer.appendChild(card);
      }
    });

    if (demon.verifier === playerName) {
      const card = createDemonCard(demon);
      const baseScore = demon.position <= 200 ? 350 / Math.sqrt(demon.position) : 0;

      const info = card.querySelector(".demon-info");
      info.innerHTML += `<p><strong>Progress:</strong> 100% (Verifier)</p>`;
      info.innerHTML += `<p><strong>Points Earned:</strong> ${baseScore.toFixed(2)}</p>`;

      recordContainer.appendChild(card);
    }
  });

  container.appendChild(recordContainer);
}
