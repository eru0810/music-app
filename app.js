let currentTab = "artist";
let editingId = null;

// -------------------------
// タグ管理（存在しない場合は自動生成）
// -------------------------
function getTags() {
  return JSON.parse(localStorage.getItem("myTags") || `["お気に入り","カラオケ"]`);
}

function saveTags(tags) {
  localStorage.setItem("myTags", JSON.stringify(tags));
}

// タグ UI を安全に生成（tagSelect が存在しなくてもエラーにならない）
function renderTagSelect() {
  const area = document.getElementById("tagSelect");
  if (!area) return; // ← 安全対策

  const tags = getTags();
  area.innerHTML = `
    <h3 style="margin:5px 0 10px;">タグを選択</h3>
    ${tags
      .map(
        (t) => `
      <label style="margin-right:10px;">
        <input type="checkbox" value="${t}"> ${t}
      </label>
    `
      )
      .join("")}
  `;
}

function renderEditTagSelect() {
  const area = document.getElementById("editTagSelect");
  if (!area) return;

  const tags = getTags();
  area.innerHTML = `
    <h3 style="margin:5px 0 10px;">タグ</h3>
    ${tags
      .map(
        (t) => `
      <label style="margin-right:10px;">
        <input type="checkbox" value="${t}"> ${t}
      </label>
    `
      )
      .join("")}
  `;
}

// -------------------------
// 曲追加（タグがなくても追加できるように修正）
// -------------------------
function addSong() {
  const title = document.getElementById("title").value.trim();
  const artist = document.getElementById("artist").value.trim();
  const url = document.getElementById("url").value.trim();

  let tags = [];

  const tagSelect = document.querySelectorAll("#tagSelect input:checked");
  if (tagSelect.length > 0) {
    tags = [...tagSelect].map((el) => el.value);
  }

  if (!title) return alert("曲名を入力してください");

  const song = {
    id: Date.now(),
    title,
    artist,
    url,
    tags
  };

  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");
  list.push(song);
  localStorage.setItem("mySongs", JSON.stringify(list));

  loadSongs(currentTab);
  updateCounts();
}

// -------------------------
// 曲削除
// -------------------------
function deleteSong(id) {
  let list = JSON.parse(localStorage.getItem("mySongs") || "[]");
  list = list.filter((s) => s.id !== id);
  localStorage.setItem("mySongs", JSON.stringify(list));

  loadSongs(currentTab);
  updateCounts();
}

// -------------------------
// タブ表示
// -------------------------
function renderTabs() {
  const area = document.getElementById("tabArea");
  if (!area) return;

  const tags = getTags();

  area.innerHTML = `
    <div class="tab ${currentTab === "all" ? "active" : ""}" onclick="changeTab('all')">全部</div>
    <div class="tab ${currentTab === "artist" ? "active" : ""}" onclick="changeTab('artist')">アーティスト</div>
  `;

  tags.forEach((t) => {
    area.innerHTML += `
      <div class="tab ${currentTab === t ? "active" : ""}" onclick="changeTab('${t}')">${t}</div>
    `;
  });
}

// -------------------------
// 曲読み込み
// -------------------------
function loadSongs(filter = "artist") {
  currentTab = filter;
  renderTabs();

  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");

  if (filter === "artist") return displaySongsByArtist(list);

  const filtered =
    filter === "all" ? list : list.filter((s) => s.tags.includes(filter));

  displaySongs(filtered);
}

// -------------------------
// アーティスト別表示
// -------------------------
function displaySongsByArtist(list) {
  const area = document.getElementById("songList");
  area.innerHTML = "";

  const groups = {};

  list.forEach((s) => {
    const key = s.artist || "不明なアーティスト";
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });

  Object.keys(groups)
    .sort()
    .forEach((artist) => {
      const block = document.createElement("div");
      block.innerHTML = `<h2 style="margin:10px 0;">🎤 ${artist}</h2>`;

      groups[artist].forEach((s) => {
        block.innerHTML += songToHTML(s);
      });

      area.appendChild(block);
    });
}

// -------------------------
function songToHTML(s) {
  const link = s.url
    ? s.url
    : "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(`${s.title} ${s.artist}`);

  return `
    <div class="song" data-id="${s.id}">
      <div class="song-row">
        <div class="song-info">
          <a href="${link}" target="_blank">${s.title}</a><br>
          <span class="artist">${s.artist}</span>
          <div class="tags">
            ${s.tags.map((t) => `<span class="tag">${t}</span>`).join(" ")}
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="edit-btn" onclick="openEdit(${s.id})">✏️</button>
          <button class="delete-btn" onclick="deleteSong(${s.id})">🗑</button>
        </div>
      </div>
    </div>
  `;
}

// -------------------------
// 初期表示
// -------------------------
renderTagSelect();
renderEditTagSelect();
renderTabs();
loadSongs("artist");
updateCounts();
