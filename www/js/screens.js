/* =========================================================
   猫カフェからの脱出 - screens.js
   画面のshow/hide、ROOM_CAFE/ROOM_STAFFの背景表示、
   inventory描画、ITEMDETAIL描画を扱う。
   Hotspot/ZOOMの実描画ロジックはzoom.jsに分離している。
   ========================================================= */

const SCREEN_ELEMENT_ID = {
  [SCREEN.TITLE]: "screen-title",
  [SCREEN.INTRO]: "screen-intro",
  [SCREEN.GAME]: "screen-game",
  [SCREEN.ZOOM]: "screen-zoom",
  [SCREEN.ITEMDETAIL]: "screen-itemdetail",
  [SCREEN.HINT]: "screen-hint",
  [SCREEN.MENU]: "screen-menu",
  [SCREEN.MEMO]: "screen-memo",
  [SCREEN.CLEARSEQ]: "screen-clearseq",
  [SCREEN.CLEARRESULT]: "screen-clearresult",
};

/**
 * 画面を切り替える。
 * モーダル的画面(ZOOM/ITEMDETAIL/HINT/MENU)へ入る前のscreenをprevScreenに保存しておくと、
 * 閉じるボタンから元の画面へ戻れる。
 */
function showScreen(screenId, opts = {}) {
  if (opts.rememberPrevious) {
    state.previousScreen = state.screen;
  }
  state.screen = screenId;

  Object.entries(SCREEN_ELEMENT_ID).forEach(([id, elId]) => {
    const el = document.getElementById(elId);
    if (!el) return;
    el.classList.toggle("active", id === screenId);
  });

  // STEP12-C: GAME/ZOOMでのみバナー広告を表示する。
  updateBannerForScreen(screenId);

  if (screenId === SCREEN.TITLE) {
    updateContinueButtonState();
  }
  if (screenId === SCREEN.GAME) {
    renderGameScreen();
  }
  if (screenId === SCREEN.ZOOM) {
    renderZoomScreen();
    renderInventory();
  }
  if (screenId === SCREEN.ITEMDETAIL) {
    renderItemDetailScreen();
  }
  if (screenId === SCREEN.HINT) {
    renderHintScreen();
  }
  if (screenId === SCREEN.CLEARRESULT) {
    renderClearResultScreen();
  }
}

/**
 * 同itemの再タップ(23章)で呼ばれる。ITEMDETAIL表示対象を設定して画面遷移する。
 */
function showItemDetail(id) {
  state.itemDetailTarget = id;
  showScreen(SCREEN.ITEMDETAIL, { rememberPrevious: true });
}

function renderItemDetailScreen() {
  const id = state.itemDetailTarget;
  const def = id ? ITEM_DEFS[id] : null;

  const nameEl = document.getElementById("itemdetail-name");
  const img = document.getElementById("itemdetail-img");
  const fallback = document.getElementById("itemdetail-fallback");

  nameEl.textContent = def ? def.name : "（未選択）";

  if (!def) {
    img.style.display = "none";
    fallback.classList.add("show");
    fallback.textContent = "";
    return;
  }

  fallback.classList.remove("show");
  img.style.display = "block";
  img.onerror = () => {
    img.style.display = "none";
    fallback.textContent = `${def.file} 未配置`;
    fallback.classList.add("show");
  };
  img.src = `assets/${def.file}`;
}

/**
 * HINT画面を表示するたびに、現在の進行状況から次の一手ヒントを1つ表示する。
 * STEP12-C: usedHintCountの加算はリワード広告の報酬獲得時(grantHintReward)のみで行う。
 * ここでは表示のみを行い、カウントは増やさない(何度開いても表示は同じ)。
 */
function renderHintScreen() {
  const el = document.getElementById("hint-text");
  if (el) {
    el.textContent = getCurrentHint();
  }
}

function closeToPreviousScreen() {
  const target = state.previousScreen || SCREEN.GAME;
  state.previousScreen = null;
  showScreen(target);
}

/**
 * TITLE画面の「つづきから」を、セーブデータの有無に応じて有効/無効化する。
 * セーブが無い場合はdisabledにする(非表示でもよいが、ここでは無効化を採用)。
 */
function updateContinueButtonState() {
  const btn = document.getElementById("btn-title-continue");
  if (!btn) return;
  const exists = hasSaveData();
  btn.disabled = !exists;
}

/**
 * 現在のstate(currentRoom/currentWall)に応じて
 * GAME画面の背景・トップバー・矢印・デバッグ導線を更新する。
 */
function renderGameScreen() {
  const isCafe = state.currentRoom === ROOM.CAFE;

  // --- 背景画像 ---
  const bgSrc = isCafe ? WALL_BG[state.currentWall] : STAFF_ROOM_BG;
  setWallImage(bgSrc, isCafe ? state.currentWall : "ROOM_STAFF");

  // --- ルームラベル ---
  const label = document.getElementById("room-label");
  label.textContent = isCafe
    ? `CAT CAFE — ${state.currentWall.replace("WALL_", "WALL ")}`
    : "STAFF ROOM";

  // --- 左右矢印: ROOM_CAFEのみ表示 ---
  document.getElementById("nav-left").classList.toggle("hidden", !isCafe);
  document.getElementById("nav-right").classList.toggle("hidden", !isCafe);

  const exitStaffBtn = document.getElementById("btn-exit-staff-room");
  exitStaffBtn.style.display = !isCafe ? "inline-flex" : "none";

  renderWallOverlays();
  renderWallHotspots();

  renderInventory();
}

/**
 * GAME画面・ZOOM画面の両方にあるinventory-barへ、同じstate.inventoryを描画する。
 * 「共通化」= 同じstate.inventory/selectedItemを単一の描画関数から反映することで実現している。
 */
function renderInventory() {
  ["inventory-bar-game", "inventory-bar-zoom"].forEach((containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    renderInventoryInto(container);
  });
}

function renderInventoryInto(container) {
  container.innerHTML = "";

  if (state.inventory.length === 0) {
    const empty = document.createElement("div");
    empty.className = "inventory-empty";
    empty.textContent = "所持品はありません";
    container.appendChild(empty);
    return;
  }

  state.inventory.forEach((id) => {
    const def = ITEM_DEFS[id];
    if (!def) return;

    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "inventory-slot";
    slot.classList.toggle("selected", state.selectedItem === id);
    slot.dataset.itemId = id;
    slot.setAttribute("aria-label", def.name);

    const img = document.createElement("img");
    img.className = "inventory-slot-img";
    img.alt = def.name;
    img.src = `assets/${def.file}`;
    img.onerror = () => {
      img.style.display = "none";
      fallback.classList.add("show");
    };

    const fallback = document.createElement("div");
    fallback.className = "inventory-slot-fallback";
    fallback.textContent = def.name;

    slot.appendChild(img);
    slot.appendChild(fallback);

    slot.addEventListener("click", () => onItemTap(id));

    container.appendChild(slot);
  });
}

/**
 * 壁/スタッフルームの背景画像を表示する。
 * assets/にまだ実ファイルが無い場合は、わかりやすいプレースホルダー表示に切り替える
 * (実装確認用。実ファイル配置後は自動的に本画像が表示される)。
 */
function setWallImage(src, labelForFallback) {
  const img = document.getElementById("wall-bg-img");
  const fallback = document.getElementById("wall-bg-fallback");
  const frame = document.getElementById("wall-image-frame");
  const stage = document.getElementById("wall-stage");

  fallback.classList.remove("show");
  img.style.display = "block";
  img.onerror = () => {
    img.style.display = "none";
    fallback.textContent = `${labelForFallback}\n(${src.split("/").pop()} 未配置)`;
    fallback.classList.add("show");
  };

  const filename = src.split("/").pop();
  applyFrameAspectRatio(frame, img, filename, stage);

  img.src = src;
}
