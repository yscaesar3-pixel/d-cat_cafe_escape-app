/* =========================================================
   猫カフェからの脱出 - STEP3 zoom.js
   壁のHotspot管理と、ZOOM画面の汎用レンダリング(21章「ズーム深度」準拠)。
   個々の壁/謎のHotspot定義・正解判定はwallN.jsに書き、
   ここでは「登録されたものをどう描画・遷移させるか」だけを扱う。
   ========================================================= */

/**
 * 壁ごとのHotspot定義を登録するレジストリ。
 * WALL_ID -> [{ id, rect:{x,y,w,h}(0〜1相対), visible?(), onTap() }]
 * 各wallN.jsがここへ追加する。
 */
const WALL_HOTSPOTS = {};

/**
 * 壁ごとの「常時表示overlay」を登録するレジストリ(STEP4〜)。
 * WALL_ID -> [{ id, src, visible?() }]
 * MONAのように、Hotspotではなく壁の見た目そのものを状態で切り替える場合に使う。
 * 背景(wall-bg)とHotspot(hotspot-layer)の間にフルフレームで重ねて描画する。
 */
const WALL_OVERLAYS = {};

/**
 * ZOOM対象の定義を登録するレジストリ。
 * targetId -> { getView(): { layers: [src,...], hotspots: [...], renderExtra?(frameEl) } }
 * layers: 下から順に重ねるimage srcの配列(背景1枚 or 背景+overlay)。
 * hotspots内のrectもZOOMステージに対する0〜1相対座標。
 * renderExtra: 矢印選択UIなど、画像Hotspotだけでは表現できないUIをframeElへ追加したい場合に使う(STEP4〜)。
 */
const ZOOM_TARGETS = {};

/**
 * 壁のHotspotをタップしてZOOMへ入る(ズーム階層1段目)。
 */
function openZoom(targetId) {
  state.zoomStack.push(targetId);
  showScreen(SCREEN.ZOOM, { rememberPrevious: true });
}

/**
 * ZOOM内からさらに別ターゲットへ入る場合に使う(21章: 最大2階層程度)。
 * STEP3時点のWALL_1では未使用だが、将来のSTAFF ROOM等のために用意する。
 */
function pushZoom(targetId) {
  state.zoomStack.push(targetId);
  renderZoomScreen();
}

/**
 * ZOOMを閉じる。zoomStackが残っていれば1つ前のズームへ、
 * 空ならGAME(またはprevious screen)へ戻る。
 */
function closeZoom() {
  const closingTarget =
    state.zoomStack[state.zoomStack.length - 1];

  state.zoomStack.pop();

  // キャットタワーは閉じるたびに
  // 次回 zoom_cat_tower_closed から始める
  if (
    closingTarget === "WALL2_CAT_TOWER" &&
    typeof wall2UiState !== "undefined"
  ) {
    wall2UiState.catTowerRevealed = false;
  }

  if (state.zoomStack.length > 0) {
    renderZoomScreen();
    return;
  }

  closeToPreviousScreen();
}

/**
 * 画像ファイル名 -> 実縦横比(width/height)の既知テーブル(STEP11.5-B)。
 * 実画像未配置の開発時でも、frameの縦横比だけは正しく見えるようにするための
 * フォールバック値。実画像を読み込めた場合は、この値に関わらず
 * naturalWidth/naturalHeightから動的に上書きする。
 */
const KNOWN_ASPECT_RATIOS = {
  "bg_wall_01.png": 1122 / 1402,
  "bg_wall_02.png": 1122 / 1402,
  "bg_wall_03.png": 1122 / 1402,
  "bg_wall_04.png": 1122 / 1402,
  "bg_staff_room.png": 1024 / 1536,
  "zoom_cat_locker_closed.png": 1086 / 1448,
  "zoom_cat_locker_open.png": 1086 / 1448,
};

/**
 * containerEl のpaddingを除いた実使用可能領域(content領域)を返す。
 * clientWidth/clientHeightはpaddingを含むため、そのままframeサイズ算出に使うと
 * zoom-stageのpadding(左右20px、下 safe-bottom+90px 等)へframeがはみ出す恐れがある。
 */
function getContainerContentSize(containerEl) {
  const style = getComputedStyle(containerEl);
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const paddingRight = parseFloat(style.paddingRight) || 0;
  const paddingTop = parseFloat(style.paddingTop) || 0;
  const paddingBottom = parseFloat(style.paddingBottom) || 0;

  return {
    width: Math.max(0, containerEl.clientWidth - paddingLeft - paddingRight),
    height: Math.max(0, containerEl.clientHeight - paddingTop - paddingBottom),
  };
}

/**
 * frameEl(wall-image-frame または zoom-image-frame)を、
 * containerEl(親要素)のpaddingを除いたcontent領域とaspectRatioから、
 * containを維持したままwidth/heightを明示的なpx値として算出・設定する(FIX-1)。
 * aspect-ratio CSSプロパティだけでは、絶対配置の子要素が多い構造で
 * frame自身のサイズが安定して決まらない場合があるための対策。
 * wall-stageのようにpaddingが無いcontainerでも同じ処理を使ってよい
 * (getContainerContentSizeはpadding=0なら単にclientWidth/clientHeightを返す)。
 */
function fitFrameToContainer(frameEl, containerEl, aspectRatio) {
  if (!frameEl || !containerEl || !aspectRatio) return;

  const { width: availableWidth, height: availableHeight } = getContainerContentSize(containerEl);
  if (!availableWidth || !availableHeight) return;

  let width = availableWidth;
  let height = width / aspectRatio;

  if (height > availableHeight) {
    height = availableHeight;
    width = height * aspectRatio;
  }

  frameEl.style.width = `${width}px`;
  frameEl.style.height = `${height}px`;
}

/**
 * frameEl(wall-image-frame または zoom-image-frame)の縦横比を、
 * 表示するimgファイルの実サイズに合わせる。
 * 1) 既知テーブルにあれば即座にそれを適用(プレースホルダー表示時も正しい比率にするため)
 * 2) 画像読み込みに成功したら、naturalWidth/naturalHeightで確定値に上書きする
 * どちらの場合もfitFrameToContainer()でframeの実px幅/高さを再計算する(FIX-1)。
 */
function applyFrameAspectRatio(frameEl, imgEl, filename, containerEl) {
  const known = KNOWN_ASPECT_RATIOS[filename] || DEFAULT_ASPECT_RATIO;
  setFrameAspectRatio(frameEl, containerEl, known);

  imgEl.addEventListener(
    "load",
    () => {
      if (imgEl.naturalWidth && imgEl.naturalHeight) {
        setFrameAspectRatio(frameEl, containerEl, imgEl.naturalWidth / imgEl.naturalHeight);
      }
    },
    { once: true }
  );
}

const DEFAULT_ASPECT_RATIO = 3 / 4;

function setFrameAspectRatio(frameEl, containerEl, ratio) {
  frameEl.style.aspectRatio = String(ratio);
  frameEl.dataset.aspectRatio = String(ratio);
  fitFrameToContainer(frameEl, containerEl, ratio);
}

/**
 * 画面回転・リサイズ時に、現在表示中のframe(wall/zoom)を再計算する(FIX-1)。
 * 直前にsetFrameAspectRatio()で保存したdataset.aspectRatioを再利用する。
 */
function refitAllFrames() {
  const wallFrame = document.getElementById("wall-image-frame");
  const wallStage = document.getElementById("wall-stage");
  if (wallFrame && wallStage && wallFrame.dataset.aspectRatio) {
    fitFrameToContainer(wallFrame, wallStage, parseFloat(wallFrame.dataset.aspectRatio));
  }

  const zoomFrame = document.querySelector(".zoom-image-frame");
  const zoomStage = document.getElementById("zoom-stage");
  if (zoomFrame && zoomStage && zoomFrame.dataset.aspectRatio) {
    fitFrameToContainer(zoomFrame, zoomStage, parseFloat(zoomFrame.dataset.aspectRatio));
  }
}

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("resize", refitAllFrames);
  window.addEventListener("orientationchange", refitAllFrames);
}

/**
 * rectを0〜1相対座標のマージン分だけ外周へ広げる(取得Hotspotを表示rectより
 * 少し広く取りたい場合の共通ヘルパー)。marginは面積比ではなく辺の比率。
 */
function expandRect(rect, margin = 0.08) {
  const dw = rect.w * margin;
  const dh = rect.h * margin;
  const x = Math.max(0, rect.x - dw / 2);
  const y = Math.max(0, rect.y - dh / 2);
  const w = Math.min(1 - x, rect.w + dw);
  const h = Math.min(1 - y, rect.h + dh);
  return { x, y, w, h };
}

/**
 * 現在のエリアキーを返す。
 * ROOM_CAFEでは壁ID(WALL_1〜4)、ROOM_STAFFでは"ROOM_STAFF"を使う。
 * WALL_HOTSPOTS/WALL_OVERLAYSのどちらもこのキーで登録する。
 */
function getCurrentAreaKey() {
  return state.currentRoom === ROOM.CAFE ? state.currentWall : "ROOM_STAFF";
}

/**
 * 現在のstate(currentWall または ROOM_STAFF)に応じたHotspotを壁ステージへ描画する。
 */
function renderWallHotspots() {
  const layer = document.getElementById("hotspot-layer");
  layer.innerHTML = "";

  const hotspots = WALL_HOTSPOTS[getCurrentAreaKey()] || [];
  hotspots.forEach((hs) => {
    if (hs.visible && !hs.visible()) return;
    layer.appendChild(buildHotspotEl(hs));
  });
}

/**
 * 現在の壁/ROOM_STAFFに登録された「常時表示overlay」を描画する(MONA/MILK/SORA等)。
 * ov.rectがあれば壁frame内の指定位置だけへ、無ければ従来通りframe全面へ表示する(後方互換)。
 */
function renderWallOverlays() {
  const layer = document.getElementById("wall-overlay-layer");
  layer.innerHTML = "";

  const overlays = WALL_OVERLAYS[getCurrentAreaKey()] || [];
  overlays.forEach((ov) => {
    if (ov.visible && !ov.visible()) return;
    layer.appendChild(buildPositionedImg(ov.src, ov.rect || null));
  });
}

/**
 * 現在のズームターゲットをZOOM画面へ描画する。
 */
function renderZoomScreen() {
  const targetId = state.zoomStack[state.zoomStack.length - 1];
  const stage = document.getElementById("zoom-stage");
  stage.innerHTML = "";

  const target = targetId ? ZOOM_TARGETS[targetId] : null;
  if (!target) {
    const fallback = document.createElement("div");
    fallback.className = "zoom-placeholder";
    fallback.textContent = "この対象はまだ実装されていません。";
    stage.appendChild(fallback);
    return;
  }

  const view = target.getView();

  const frame = document.createElement("div");
  frame.className = "zoom-image-frame";

  (view.layers || []).forEach((layer, index) => {
    const layerEl = buildZoomLayerImg(layer);
    frame.appendChild(layerEl);
    if (index === 0) {
      // ベース(最下層)画像の実縦横比をframeへ反映する。
      // overlay層は常にbase画像と同じframeに重ねる前提のため、baseの比率だけを使う。
      const baseSrc = typeof layer === "object" && layer !== null ? layer.src : layer;
      const baseImg = layerEl.querySelector("img");
      applyFrameAspectRatio(frame, baseImg, baseSrc, stage);
    }
  });

  const hotspotLayer = document.createElement("div");
  hotspotLayer.className = "zoom-hotspot-layer";
  (view.hotspots || []).forEach((hs) => {
    if (hs.visible && !hs.visible()) return;
    hotspotLayer.appendChild(buildHotspotEl(hs));
  });
  frame.appendChild(hotspotLayer);

  if (typeof view.renderExtra === "function") {
    view.renderExtra(frame);
  }

  stage.appendChild(frame);

  const msg = document.createElement("div");
  msg.className = "zoom-message";
  msg.id = "zoom-message";
  stage.appendChild(msg);
}

/**
 * layer(base画像用の文字列 "xxx.png"、またはoverlay用の{src, rect})から
 * ズームレイヤーのDOMを作る。
 * - 文字列 → frame全面表示(base画像。従来どおり)
 * - {src, rect} → rect(0〜1相対)の位置・サイズだけに表示(取得アイテム等のoverlay)
 * どちらの形式もこの関数だけで扱えるようにし、旧string形式との互換性を保つ。
 */
function buildZoomLayerImg(layer) {
  const isPositioned = typeof layer === "object" && layer !== null;
  const src = isPositioned ? layer.src : layer;
  const rect = isPositioned ? layer.rect : null;
  return buildPositionedImg(src, rect);
}

/**
 * srcの画像を、rectが指定されていればその位置・サイズだけに、
 * 無ければ親要素(frame)全面に表示するDOMを作る。
 * 壁の常時overlay(renderWallOverlays)とZOOMのoverlay(buildZoomLayerImg)の
 * 両方から共通で使う。
 */
function buildPositionedImg(src, rect) {
  const wrap = document.createElement("div");
  wrap.className = "zoom-layer";
  if (rect) {
    wrap.classList.add("zoom-layer-positioned");
    wrap.style.left = `${rect.x * 100}%`;
    wrap.style.top = `${rect.y * 100}%`;
    wrap.style.width = `${rect.w * 100}%`;
    wrap.style.height = `${rect.h * 100}%`;
  }

  const img = document.createElement("img");
  img.className = "zoom-layer-img";
  img.alt = "";
  img.src = `assets/${src}`;

  const fallback = document.createElement("div");
  fallback.className = "zoom-layer-fallback";
  fallback.textContent = `${src} 未配置`;

  img.onerror = () => {
    img.style.display = "none";
    fallback.classList.add("show");
  };

  wrap.appendChild(img);
  wrap.appendChild(fallback);
  return wrap;
}

/**
 * Hotspotの共通DOM生成(壁用/ズーム用どちらでも使う)。
 * rectは0〜1の相対座標。
 */
function buildHotspotEl(hs) { 
  const el = document.createElement("button"); 
  el.type = "button"; 
  el.className = "hotspot"; 

  // Hotspot個別のclassNameが指定されていれば追加
  if (hs.className) {
    el.classList.add(...hs.className.split(" "));
  }

  if (hs.pressOffset) {
  el.style.setProperty(
    "--press-offset-x",
    `${hs.pressOffset.x}px`
  );

  el.style.setProperty(
    "--press-offset-y",
    `${hs.pressOffset.y}px`
  );
}

  el.dataset.hotspotId = hs.id;

  el.style.left = `${hs.rect.x * 100}%`; 
  el.style.top = `${hs.rect.y * 100}%`; 
  el.style.width = `${hs.rect.w * 100}%`; 
  el.style.height = `${hs.rect.h * 100}%`; 

  el.setAttribute("aria-label", hs.id); 

  el.addEventListener("click", (e) => { 
    e.stopPropagation(); 
    hs.onTap(); 
  }); 

  return el; 
}

/**
 * ZOOM画面内で短いメッセージを表示する(例: 「アイテムを選んでから使ってみよう」)。
 * dlg()相当の簡易実装。
 */
function showZoomMessage(text) {
  const msg = document.getElementById("zoom-message");
  if (!msg) return;
  msg.textContent = text;
  msg.classList.add("show");
  clearTimeout(showZoomMessage._t);
  showZoomMessage._t = setTimeout(() => {
    msg.classList.remove("show");
  }, 1800);
}

/**
 * GAME画面(壁レベル)で短いメッセージを表示する。
 * TETE/MILK/SORAのような「観察のみ」対象で、
 * 専用ZOOMを持たずメッセージだけ返したい場合に使う。
 */
function showWallMessage(text) {
  const msg = document.getElementById("wall-message");
  if (!msg) return;
  msg.textContent = text;
  msg.classList.add("show");
  clearTimeout(showWallMessage._t);
  showWallMessage._t = setTimeout(() => {
    msg.classList.remove("show");
  }, 1800);
}
