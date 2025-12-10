let currentTab = "all";
let editingId = null;

/* -------------------------
  初期ロード
-------------------------*/
loadSongs();
updateCounts();
renderTagSelect();
renderEditTagSelect();
renderTabs();

/* -------------------------
  曲追加（複数タグ対応）
-------------------------*/
function addSong() {
  const title = document.getElementById("title").value.trim();
  const artist = document.getElementById("artist").value.trim();
  const url = document.getElementById("url").value.trim();

  const tags = [...document.querySelectorAll('#tagSelect input:checked')]
    .map(el => el.value);

  if (!title) {
    alert("曲名を入力してください");
    return;
  }

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

/* -------------------------
  曲削除
-------------------------*/
function deleteSong(id) {
  let list = JSON.parse(localStorage.getItem("mySongs") || "[]");
  list = list.filter(s => s.id !== id);
  localStorage.setItem("mySongs", JSON.stringify(list));

  loadSongs(currentTab);
  updateCounts();
}

/* -------------------------
  YouTube ID 抽出
-------------------------*/
function extractVideoId(url) {
  if (!url) return null;

  try {
    url = url.replace("music.youtube.com", "youtube.com");
    url = url.replace("m.youtube.com", "youtube.com");

    if (url.includes("/shorts/"))
      return url.split("/shorts/")[1].split("?")[0];

    if (url.includes("youtu.be/"))
      return url.split("youtu.be/")[1].split("?")[0];

    if (url.includes("/embed/"))
      return url.split("/embed/")[1].split("?")[0];

    const obj = new URL(url);
    return obj.searchParams.get("v");

  } catch {
    return null;
  }
}

/* -------------------------
  曲一覧（フィルタ：複数タグ対応）
-------------------------*/
function loadSongs(filter = "all") {
  currentTab = filter;
  renderTabs();

  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");

  const filtered = list.filter(s => {
    if (filter === "all") return true;
    return s.tags.includes(filter);
  });

  displaySongs(filtered);
}

/* -------------------------
  曲リスト描画
-------------------------*/
function displaySongs(songs) {
  const area = document.getElementById("songList");
  area.innerHTML = "";

  songs.forEach(s => {
    const div = document.createElement("div");
    div.className = "song";
    div.dataset.id = s.id;

    const link = s.url
      ? s.url
      : "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(`${s.title} ${s.artist}`);

    div.innerHTML = `
      <div class="song-row">
        <div class="song-info">
          <a href="${link}" target="_blank">${s.title}</a><br>
          <span class="artist">${s.artist}</span>
          <div class="tags">
            ${s.tags.map(t => `<span class="tag">${t}</span>`).join("")}
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="edit-btn" onclick="openEdit(${s.id})">✏️</button>
          <button class="delete-btn" onclick="deleteSong(${s.id})">🗑</button>
        </div>
      </div>
    `;

    area.appendChild(div);
  });

  enableSort();
  updateCounts();
}

/* -------------------------
  タブ切り替え
-------------------------*/
function changeTab(f) {
  loadSongs(f);
}

/* -------------------------
  編集モーダルを開く（複数タグ対応）
-------------------------*/
function openEdit(id) {
  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");
  const song = list.find(s => s.id === id);

  editingId = id;

  document.getElementById("editTitle").value = song.title;
  document.getElementById("editArtist").value = song.artist;
  document.getElementById("editUrl").value = song.url;

  renderEditTagSelect();

  document.querySelectorAll('#editTagSelect input').forEach(chk => {
    chk.checked = song.tags.includes(chk.value);
  });

  document.getElementById("editModal").classList.remove("hidden");
}

/* -------------------------
  編集保存
-------------------------*/
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

/* -------------------------
  編集閉じる
-------------------------*/
function closeEdit() {
  document.getElementById("editModal").classList.add("hidden");
}

/* -------------------------
  曲数更新
-------------------------*/
function updateCounts() {
  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");
  const tags = getTags();

  document.getElementById("tab-all").innerText = `全部（${list.length}）`;

  tags.forEach(tag => {
    const count = list.filter(s => s.tags.includes(tag)).length;
    const tab = document.getElementById(`tab-${tag}`);
    if (tab) tab.innerText = `${tag}（${count}）`;
  });
}

/* -------------------------
  並び替え（Sortable.js）
-------------------------*/
function enableSort() {
  const area = document.getElementById("songList");

  Sortable.create(area, {
    animation: 150,
    ghostClass: "ghost",
    onEnd: () => saveNewOrder()
  });
}

function saveNewOrder() {
  const ids = [...document.getElementById("songList").children]
    .map(div => Number(div.dataset.id));

  let list = JSON.parse(localStorage.getItem("mySongs") || "[]");

  const newList = ids.map(id => list.find(s => s.id === id));

  localStorage.setItem("mySongs", JSON.stringify(newList));
  loadSongs(currentTab);
}

/* -------------------------
  検索（複数タグ対応）
-------------------------*/
function searchSongs() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");

  const filtered = list.filter(s => {
    const matchTitle = s.title.toLowerCase().includes(keyword);
    const matchArtist = s.artist.toLowerCase().includes(keyword);
    const matchTags = s.tags.some(t => t.toLowerCase().includes(keyword));

    const matchTab = currentTab === "all" || s.tags.includes(currentTab);

    return (matchTitle || matchArtist || matchTags) && matchTab;
  });

  displaySongs(filtered);
}

/* -------------------------
  タグ管理：タグ取得・保存
-------------------------*/
function getTags() {
  return JSON.parse(localStorage.getItem("myTags") ||
    `["お気に入り","カラオケ"]`);
}

function saveTags(tags) {
  localStorage.setItem("myTags", JSON.stringify(tags));
}

/* -------------------------
  タグ管理モーダル
-------------------------*/
function openTagModal() {
  loadTagList();
  document.getElementById("tagModal").classList.remove("hidden");
}

function closeTagModal() {
  document.getElementById("tagModal").classList.add("hidden");
}

function loadTagList() {
  const tags = getTags();
  const area = document.getElementById("tagListArea");

  area.innerHTML = tags
    .map(tag => `
      <div class="tag-item">
        ${tag}
        <button class="tag-delete-btn" onclick="deleteTag('${tag}')">✕</button>
      </div>
    `)
    .join("");
}

function addTag() {
  const input = document.getElementById("newTagInput");
  const newTag = input.value.trim();

  if (!newTag) return alert("タグ名を入力してください");

  const tags = getTags();
  if (tags.includes(newTag)) return alert("すでに存在します");

  tags.push(newTag);
  saveTags(tags);

  input.value = "";
  loadTagList();
  renderTabs();
  renderTagSelect();
  renderEditTagSelect();
}

function deleteTag(tagName) {
  if (!confirm(`「${tagName}」を削除しますか？`)) return;

  let tags = getTags().filter(t => t !== tagName);
  saveTags(tags);

  let list = JSON.parse(localStorage.getItem("mySongs") || "[]");
  list = list.map(s => ({
    ...s,
    tags: s.tags.filter(t => t !== tagName)
  }));

  localStorage.setItem("mySongs", JSON.stringify(list));

  loadTagList();
  renderTabs();
  loadSongs(currentTab);
  updateCounts();
}

/* -------------------------
  タブ自動生成
-------------------------*/
function renderTabs() {
  const area = document.getElementById("tabArea");
  const tags = getTags();

  area.innerHTML = `
    <div id="tab-all" class="tab ${currentTab === "all" ? "active" : ""}"
      onclick="changeTab('all')">全部</div>
  `;

  tags.forEach(tag => {
    const safeId = tag.replace(/\s/g, "-");
    area.innerHTML += `
      <div id="tab-${tag}" class="tab ${currentTab === tag ? "active" : ""}"
        onclick="changeTab('${tag}')">${tag}</div>
    `;
  });
}

/* -------------------------
  タグ選択画面（追加用）
-------------------------*/
function renderTagSelect() {
  const tags = getTags();
  const area = document.getElementById("tagSelect");

  area.innerHTML = tags
    .map(t => `<label><input type="checkbox" value="${t}"> ${t}</label>`)
    .join("<br>");
}

/* -------------------------
  編集用タグ選択
-------------------------*/
function renderEditTagSelect() {
  const tags = getTags();
  const area = document.getElementById("editTagSelect");

  area.innerHTML = tags
    .map(t => `<label><input type="checkbox" value="${t}"> ${t}</label>`)
    .join("<br>");
}
