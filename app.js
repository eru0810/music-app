let currentTab = "artist";  // ← デフォルトを「アーティスト」にする
let editingId = null;

// -------------------------
// タグ管理
// -------------------------
function getTags() {
  return JSON.parse(localStorage.getItem("myTags") || `["お気に入り","カラオケ"]`);
}
function saveTags(tags) {
  localStorage.setItem("myTags", JSON.stringify(tags));
}

// タグ選択UI生成
function renderTagSelect() {
  const tags = getTags();
  const area = document.getElementById("tagSelect");
  area.innerHTML = `
    <h3 style="margin:5px 0 10px;">タグを選択</h3>
    ${tags.map(t => `
      <label style="margin-right:10px;">
        <input type="checkbox" value="${t}"> ${t}
      </label>
    `).join("")}
  `;
}

// 編集モーダル用タグ
function renderEditTagSelect() {
  const tags = getTags();
  const area = document.getElementById("editTagSelect");

  area.innerHTML = `
    <h3 style="margin:5px 0 10px;">タグ</h3>
    ${tags.map(t => `
      <label style="margin-right:10px;">
        <input type="checkbox" value="${t}"> ${t}
      </label>
    `).join("")}
  `;
}

// -------------------------
// 曲追加（複数タグ）
// -------------------------
function addSong() {
  const title = document.getElementById("title").value.trim();
  const artist = document.getElementById("artist").value.trim();
  const url = document.getElementById("url").value.trim();

  const tags = [...document.querySelectorAll('#tagSelect input:checked')]
    .map(el => el.value);

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
  list = list.filter(s => s.id !== id);
  localStorage.setItem("mySongs", JSON.stringify(list));

  loadSongs(currentTab);
  updateCounts();
}

// -------------------------
// タブ表示
// -------------------------
function renderTabs() {
  const area = document.getElementById("tabArea");
  const tags = getTags();

  area.innerHTML = `
    <div class="tab ${currentTab === "all" ? "active" : ""}" onclick="changeTab('all')">全部</div>
    <div class="tab ${currentTab === "artist" ? "active" : ""}" onclick="changeTab('artist')">アーティスト</div>
  `;

  tags.forEach(t => {
    area.innerHTML += `
      <div class="tab ${currentTab === t ? "active" : ""}" onclick="changeTab('${t}')">${t}</div>
    `;
  });
}

// -------------------------
// 曲一覧読み込み
// -------------------------
function loadSongs(filter = "artist") {
  currentTab = filter;
  renderTabs();

  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");

  if (filter === "artist") {
    return displaySongsByArtist(list);
  }

  const filtered = filter === "all"
    ? list
    : list.filter(s => s.tags.includes(filter));

  displaySongs(filtered);
}

// -------------------------
// アーティスト別グループ表示
// -------------------------
function displaySongsByArtist(list) {
  const area = document.getElementById("songList");
  area.innerHTML = "";

  const groups = {};

  list.forEach(s => {
    if (!groups[s.artist]) groups[s.artist] = [];
    groups[s.artist].push(s);
  });

  Object.keys(groups).sort().forEach(artist => {
    const block = document.createElement("div");
    block.innerHTML = `
      <h2 style="margin:10px 0;">🎤 ${artist}</h2>
    `;
    groups[artist].forEach(s => {
      block.innerHTML += songToHTML(s);
    });
    area.appendChild(block);
  });
}

// -------------------------
// 曲をHTML化
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
            ${s.tags.map(t => `<span class="tag">${t}</span>`).join(" ")}
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
// 編集モーダル
// -------------------------
function openEdit(id) {
  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");
  const song = list.find(s => s.id === id);

  editingId = id;

  document.getElementById("editTitle").value = song.title;
  document.getElementById("editArtist").value = song.artist;
  document.getElementById("editUrl").value = song.url;

  // タグ反映
  document.querySelectorAll("#editTagSelect input").forEach(chk => {
    chk.checked = song.tags.includes(chk.value);
  });

  document.getElementById("editModal").classList.remove("hidden");
}

function saveEdit() {
  let list = JSON.parse(localStorage.getItem("mySongs") || "[]");
  const index = list.findIndex(s => s.id === editingId);

  const tags = [...document.querySelectorAll('#editTagSelect input:checked')]
    .map(el => el.value);

  list[index].title = document.getElementById("editTitle").value;
  list[index].artist = document.getElementById("editArtist").value;
  list[index].url = document.getElementById("editUrl").value;
  list[index].tags = tags;

  localStorage.setItem("mySongs", JSON.stringify(list));

  closeEdit();
  loadSongs(currentTab);
}

function closeEdit() {
  document.getElementById("editModal").classList.add("hidden");
}

// -------------------------
// 曲数更新
// -------------------------
function updateCounts() {
  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");
  const tags = getTags();

  document.getElementById("tab-all").innerText = `全部（${list.length}）`;
}

// -------------------------
// 並べ替え
// -------------------------
function enableSort() {
  const area = document.getElementById("songList");

  Sortable.create(area, {
    animation: 150,
    ghostClass: "ghost",
    onEnd: saveNewOrder
  });
}

function saveNewOrder() {
  const ids = [...document.querySelectorAll("#songList .song")]
    .map(el => Number(el.dataset.id));

  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");

  const newList = ids.map(id => list.find(s => s.id === id));

  localStorage.setItem("mySongs", JSON.stringify(newList));
}

// -------------------------
// 検索
// -------------------------
function searchSongs() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();

  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");

  const filtered = list.filter(s =>
    s.title.toLowerCase().includes(keyword) ||
    s.artist.toLowerCase().includes(keyword) ||
    s.tags.some(t => t.toLowerCase().includes(keyword))
  );

  if (currentTab === "artist") {
    return displaySongsByArtist(filtered);
  }

  displaySongs(filtered);
}

// -------------------------
// 初期実行
// -------------------------
renderTabs();
renderTagSelect();
renderEditTagSelect();
loadSongs("artist");
updateCounts();
