let currentTab = "all";

// -------- 曲追加 --------
function addSong() {
  const title = document.getElementById("title").value.trim();
  const artist = document.getElementById("artist").value.trim();
  const category = document.getElementById("category").value;
  const url = document.getElementById("url").value.trim();

  if (!title) {
    alert("曲名を入力してください");
    return;
  }

  const song = {
    id: Date.now(),
    title,
    artist,
    category,
    url
  };

  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");
  list.push(song);
  localStorage.setItem("mySongs", JSON.stringify(list));

  loadSongs(currentTab);
}

// -------- 曲削除 --------
function deleteSong(id) {
  let list = JSON.parse(localStorage.getItem("mySongs") || "[]");
  list = list.filter(s => s.id !== id);
  localStorage.setItem("mySongs", JSON.stringify(list));

  loadSongs(currentTab);
}

// -------- YouTube サムネ生成 --------
function getThumbnail(url, title, artist) {
  if (!url) return "";

  const id = extractVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/0.jpg` : "";
}
function extractVideoId(url) {
  if (!url) return null;

  try {
    // よくあるサブドメインを正規化
    url = url.replace("music.youtube.com", "youtube.com");
    url = url.replace("m.youtube.com", "youtube.com");

    // Shorts
    if (url.includes("/shorts/")) {
      return url.split("/shorts/")[1].split("?")[0];
    }

    // youtu.be
    if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1].split("?")[0];
    }

    // embed
    if (url.includes("/embed/")) {
      return url.split("/embed/")[1].split("?")[0];
    }

    // watch?v=
    const obj = new URL(url);
    const v = obj.searchParams.get("v");
    if (v) return v;

  } catch (e) {
    return null;
  }

  return null;
}


// -------- 曲一覧表示 --------
function loadSongs(filter = "all") {
  currentTab = filter;

  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");
  const area = document.getElementById("songList");

  area.innerHTML = "";

  // タブの見た目更新
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => {
    if (t.innerText === (filter === "all" ? "全部" : filter))
      t.classList.add("active");
  });

  list
    .filter(s => filter === "all" || s.category === filter)
    .forEach(s => {
      const div = document.createElement("div");
      div.className = "song";
      div.dataset.id = s.id;   // ← 並べ替えに必要！

      const thumbnail = getThumbnail(s.url, s.title, s.artist);
      const link = s.url
        ? s.url
        : "https://www.youtube.com/results?search_query=" + encodeURIComponent(`${s.title} ${s.artist}`);

     div.innerHTML = `
  <div class="song-row">
    <div class="song-info">
      <a href="${link}" target="_blank">${s.title}</a><br>
      <span class="artist">${s.artist}</span>
      <span class="tag">${s.category}</span><br>
    </div>
    
    <div style="display:flex; gap:8px;">
      <button class="edit-btn" onclick="openEdit(${s.id})">✏️</button>
      <button class="delete-btn" onclick="deleteSong(${s.id})">🗑</button>
    </div>
  </div>
`;



      area.appendChild(div);
    });
}
updateCounts();
enableSort();

function changeTab(f) {
  loadSongs(f);
}

loadSongs();
let editingId = null;

// 編集モーダルを開く
function openEdit(id) {
  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");
  const song = list.find(s => s.id === id);

  if (!song) return;

  editingId = id;

  document.getElementById("editTitle").value = song.title;
  document.getElementById("editArtist").value = song.artist;
  document.getElementById("editUrl").value = song.url;
  document.getElementById("editCategory").value = song.category;

  document.getElementById("editModal").classList.remove("hidden");
}

// 編集保存
function saveEdit() {
  let list = JSON.parse(localStorage.getItem("mySongs") || "[]");

  const index = list.findIndex(s => s.id === editingId);

  list[index].title = document.getElementById("editTitle").value;
  list[index].artist = document.getElementById("editArtist").value;
  list[index].url = document.getElementById("editUrl").value;
  list[index].category = document.getElementById("editCategory").value;

  localStorage.setItem("mySongs", JSON.stringify(list));

  closeEdit();
  loadSongs(currentTab);
}

// 編集キャンセル
function closeEdit() {
  document.getElementById("editModal").classList.add("hidden");
}
function updateCounts() {
  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");

  const all = list.length;
  const fav = list.filter(s => s.category === "お気に入り").length;
  const karaoke = list.filter(s => s.category === "カラオケ").length;

  document.getElementById("tab-all").innerText = `全部（${all}）`;
  document.getElementById("tab-fav").innerText = `お気に入り（${fav}）`;
  document.getElementById("tab-karaoke").innerText = `カラオケ（${karaoke}）`;
}

// 並べ替え機能を有効化
function enableSort() {
  const area = document.getElementById("songList");

  Sortable.create(area, {
    animation: 150,
    ghostClass: "ghost",
    onEnd: function (evt) {
      saveNewOrder();
    }
  });
}
function saveNewOrder() {
  const area = document.getElementById("songList");
  const idsInOrder = Array.from(area.children).map(div => Number(div.dataset.id));

  let list = JSON.parse(localStorage.getItem("mySongs") || "[]");

  const newList = [];
  idsInOrder.forEach(id => {
    const found = list.find(item => item.id === id);
    if (found) newList.push(found);
  });

  localStorage.setItem("mySongs", JSON.stringify(newList));

  loadSongs(currentTab);
}

function searchSongs() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();

  const list = JSON.parse(localStorage.getItem("mySongs") || "[]");

  const filtered = list.filter(s => {
    const matchTitle = s.title.toLowerCase().includes(keyword);
    const matchArtist = s.artist.toLowerCase().includes(keyword);
    const matchCategory = currentTab === "all" || s.category === currentTab;

    return (matchTitle || matchArtist) && matchCategory;
  });

  displaySongs(filtered);
}
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
          <span class="tag">${s.category}</span>
        </div>
        
        <div style="display:flex; gap:8px;">
          <button class="edit-btn" onclick="openEdit(${s.id})">✏️</button>
          <button class="delete-btn" onclick="deleteSong(${s.id})">🗑</button>
        </div>
      </div>
    `;

    area.appendChild(div);
  });

  updateCounts();
  enableSort();
}
