/* =========================================================
   猫カフェからの脱出 - STEP7 staffroom1.js
   ROOM_STAFF前半の実装。対象:
   健康管理表 / HEALTH CHECK / UVライト / Family写真 / KEY BOX / 緑タグ取得
   緑キャリー・MONAロッカー・デスク引き出し・スタッフメモはSTEP8以降。
   ========================================================= */

// ---------------------------------------------------------
// ROOM_STAFFのHotspot
// bg_staff_room.png (1024×1536) の実画像照合済み座標(STEP11.5-B)。
// STEP8でstaff_green_carrier/staff_lockers/staff_deskが追加される。
// ---------------------------------------------------------
WALL_HOTSPOTS.ROOM_STAFF = [
  {
  id: "staff_health_chart",

  rect: { x: 0.53, y: 0.06, w: 0.29, h: 0.21 },

  onTap: () => {
    openZoom("STAFF_HEALTH_CHART");

    setTimeout(() => {
      showZoomMessage("猫たちの健康管理表だ。体重などが記録されている。");
    }, 0);
  },
},
  {
  id: "staff_health_check_case",

  rect: { x: 0.53, y: 0.29, w: 0.12, h: 0.14 },

  onTap: () => {
    openZoom("STAFF_HEALTH_CHECK_CASE");

    setTimeout(() => {
      showZoomMessage("猫たちの健康チェックに使うケースだ。");
    }, 0);
  },
},
  {
  id: "staff_family_photo",

  rect: { x: 0.65, y: 0.28, w: 0.17, h: 0.13 },

  onTap: () => {
    openZoom("STAFF_FAMILY_PHOTO");

    setTimeout(() => {
      showZoomMessage("スタッフルームに飾られた猫たちの写真だ。");
    }, 0);
  },
},
  {
  id: "staff_key_box",

  rect: { x: 0.65, y: 0.40, w: 0.15, h: 0.11 },

  onTap: () => {
    openZoom("STAFF_KEY_BOX");

    setTimeout(() => {
      showZoomMessage("鍵を保管するためのボックスだ。");
    }, 0);
  },
},
  {
  id: "staff_exit_to_wall4",
  // STAFF ROOM左側の扉。進行フラグ条件なしで常時、既存の正式退室処理(exitStaffRoom)を
  // そのまま呼ぶ。btn-exit-staff-roomと役割が重複するが、どちらからでも退室できてよい。
  rect: { x: 0.0048, y: 0.0000, w: 0.1757, h: 0.4021 },
  onTap: () => {
    exitStaffRoom();
    renderGameScreen();
  },
},
];

// ---------------------------------------------------------
// 健康管理表 (体重の情報表示のみ。判定ロジックはHEALTH CHECK側)
// ---------------------------------------------------------
ZOOM_TARGETS.STAFF_HEALTH_CHART = {
  getView() {
    return { layers: ["zoom_health_chart.png"], hotspots: [] };
  },
};

// ---------------------------------------------------------
// HEALTH CHECK (9.12)
// 配置: 左上=MILK 右上=TETE 左下=SORA 右下=MONA
// 正解順: MILK→TETE→SORA→MONA (=軽い順)
// state.puzzleInputs.healthCheckSequence(14章の正式構造)を使用する。
// ---------------------------------------------------------
const HEALTH_CHECK_ANSWER = ["MILK", "TETE", "SORA", "MONA"];
const HEALTH_CHECK_BUTTONS = [
  { catKey: "MILK", label: "左上" },
  { catKey: "TETE", label: "右上" },
  { catKey: "SORA", label: "左下" },
  { catKey: "MONA", label: "右下" },
];
// レイアウトに合わせた実画像照合済み座標(左上/右上/左下/右下)
const HEALTH_CHECK_RECTS = {
  MILK: { x: 0.2488, y: 0.2670, w: 0.1993, h: 0.1328 },
  TETE: { x: 0.5456, y: 0.2628, w: 0.1950, h: 0.1385 },
  SORA: { x: 0.2424, y: 0.4578, w: 0.2099, h: 0.1427 },
  MONA: { x: 0.5413, y: 0.4620, w: 0.1993, h: 0.1399 },
};

ZOOM_TARGETS.STAFF_HEALTH_CHECK_CASE = {
  getView() {
    const solved = F("FLAG_HEALTH_CHECK_SOLVED");
    const taken = F("FLAG_UV_LIGHT_TAKEN");

    if (!solved) {
      const hotspots = HEALTH_CHECK_BUTTONS.map((btn) => ({
        id: `staff_health_check_${btn.catKey.toLowerCase()}`,
        rect: HEALTH_CHECK_RECTS[btn.catKey],
        onTap: () => onHealthCheckTap(btn.catKey),
      }));
      return { layers: ["zoom_health_check_case.png"], hotspots };
    }

    const layers = ["zoom_health_check_case_open.png"];
    const hotspots = [];
    if (!taken) {
      // overlay_uv_light_in_case.png/item_uv_light.pngは現状透過素材ではないため画像加工はしない。
      // 表示位置だけ正式化する(後日asset差し替え予定)。
      const displayRect = { x: 0.3894, y: 0.6780, w: 0.2578, h: 0.1437 };
      layers.push({ src: "overlay_uv_light_in_case.png", rect: displayRect });
      hotspots.push({
        id: "staff_health_check_uv_overlay",
        rect: expandRect(displayRect),
        onTap: onHealthCheckUvTap,
      });
    }
    return { layers, hotspots };
  },
};

function onHealthCheckTap(catKey) {
  if (F("FLAG_HEALTH_CHECK_SOLVED")) return;

  const seq = state.puzzleInputs.healthCheckSequence;
  const expected = HEALTH_CHECK_ANSWER[seq.length];

  if (catKey !== expected) {
    state.puzzleInputs.healthCheckSequence = [];
    saveGame();
    showZoomMessage("違うみたい…もう一度。");
    renderZoomScreen();
    return;
  }

  seq.push(catKey);

  if (seq.length === HEALTH_CHECK_ANSWER.length) {
    setF("FLAG_HEALTH_CHECK_SOLVED", true); // setF内でsaveGame()される
    state.puzzleInputs.healthCheckSequence = [];
    saveGame();
  } else {
    saveGame();
  }
  renderZoomScreen();
}

function onHealthCheckUvTap() {
  if (F("FLAG_UV_LIGHT_TAKEN")) return;
  addItem("ITEM_UV_LIGHT");
  setF("FLAG_UV_LIGHT_TAKEN", true);
  renderZoomScreen();
  renderInventory();
}

// ---------------------------------------------------------
// Family写真 + UV (9.13)
// UVライトは使用後もinventoryから削除しない(消費しない)。
// ---------------------------------------------------------
ZOOM_TARGETS.STAFF_FAMILY_PHOTO = {
  getView() {
    const revealed = F("FLAG_FAMILY_PHOTO_UV_REVEALED");

    if (revealed) {
      return { layers: ["zoom_family_photo_uv.png"], hotspots: [] };
    }

    return {
      layers: ["zoom_family_photo.png"],
      hotspots: [
        {
          id: "staff_family_photo_uv_slot",
          rect: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
          onTap: onFamilyPhotoUvTap,
        },
      ],
    };
  },
};

function onFamilyPhotoUvTap() {
  if (F("FLAG_FAMILY_PHOTO_UV_REVEALED")) return;

  if (state.selectedItem === "ITEM_UV_LIGHT") {
    setF("FLAG_FAMILY_PHOTO_UV_REVEALED", true);
    deselectItem(); // UVライトは消費しない。選択状態だけ解除する。
    renderZoomScreen();
    renderInventory();
    return;
  }

  if (state.selectedItem === null) {
  showZoomMessage("普通の写真に見えるけど、何か隠されているのかな。");
} else {
  showZoomMessage("それを使っても、写真に変化はなさそうだ。");
}
}

// ---------------------------------------------------------
// KEY BOX (9.14)
// 4681を4桁入力で自動判定。Cでクリア。
// 別パネルは使わず、zoom_key_box.png画像内の数字を直接押す。
// 液晶表示も画像内に直接重ねる。
// ---------------------------------------------------------

const KEY_BOX_CODE = "4681";


// ---------------------------------------------------------
// KEY BOX画像内の数字ボタンHotspot
// ※ここはHotspot Editorで実測した値に置き換える
// ---------------------------------------------------------

const KEY_BOX_BUTTON_RECTS = {
  "1": { x: 0.2350, y: 0.4301, w: 0.1590, h: 0.0799 },
  "2": { x: 0.4217, y: 0.4255, w: 0.1613, h: 0.0799 },
  "3": { x: 0.6083, y: 0.4240, w: 0.1475, h: 0.0860 },

  "4": { x: 0.2373, y: 0.5284, w: 0.1498, h: 0.0799 },
  "5": { x: 0.4263, y: 0.5253, w: 0.1544, h: 0.0829 },
  "6": { x: 0.6037, y: 0.5269, w: 0.1613, h: 0.0829 },

  "7": { x: 0.2419, y: 0.6298, w: 0.1475, h: 0.0845 },
  "8": { x: 0.4240, y: 0.6313, w: 0.1613, h: 0.0783 },
  "9": { x: 0.6037, y: 0.6252, w: 0.1521, h: 0.0906 },

  "C": { x: 0.2396, y: 0.7266, w: 0.1567, h: 0.0829 },
  "0": { x: 0.4263, y: 0.7296, w: 0.1544, h: 0.0845 },
};


// ---------------------------------------------------------
// 画像内の「戻る」を使いたい場合だけ使う
// 不要ならこの定数も、後述のhotspots.pushも消してOK
// ---------------------------------------------------------

const KEY_BOX_BACK_RECT = {
  x: 0.00,
  y: 0.00,
  w: 0.00,
  h: 0.00
};


// ---------------------------------------------------------
// 4桁の液晶表示位置
// 背景画像に "----" が描かれている前提。
// 未入力部分は空欄にして、背景の "-" を見せる。
// ---------------------------------------------------------

const KEY_BOX_CHAR_RECTS = [
  { x: 0.2811, y: 0.3041, w: 0.0806, h: 0.1056 },
  { x: 0.3986, y: 0.3041, w: 0.0899, h: 0.1056 },
  { x: 0.5184, y: 0.3041, w: 0.0853, h: 0.1056 },
  { x: 0.6382, y: 0.3041, w: 0.0853, h: 0.1056 },
];


// ---------------------------------------------------------
// KEY BOX
// ---------------------------------------------------------

ZOOM_TARGETS.STAFF_KEY_BOX = {
  getView() {
    const solved = F("FLAG_KEY_BOX_SOLVED");
    const taken = F("FLAG_GREEN_TAG_TAKEN");

    if (!solved) {
      const hotspots = [];

      Object.entries(KEY_BOX_BUTTON_RECTS).forEach(([key, rect]) => {
        hotspots.push({
          id: `staff_key_box_${key === "C" ? "clear" : key}`,
          rect,
          onTap: () => {
            if (key === "C") {
              onKeyBoxClearTap();
            } else {
              onKeyBoxDigitTap(key);
            }
          },
        });
      });

      // 画像内の「戻る」を使う場合だけ有効にする
      hotspots.push({
        id: "staff_key_box_back",
        rect: KEY_BOX_BACK_RECT,
        onTap: () => {
          closeZoomOneLevel();
        },
      });

      return {
        layers: ["zoom_key_box.png"],
        hotspots,
        renderExtra: renderKeyBoxImageDisplay,
      };
    }

    const layers = ["zoom_key_box_open.png"];
    const hotspots = [];

    if (!taken) {
      const displayRect = { x: 0.4947, y: 0.6033, w: 0.3116, h: 0.1922 };
      layers.push({
        src: "overlay_key_tag_green.png",
        rect: displayRect
      });
      hotspots.push({
        id: "staff_key_box_tag_overlay",
        rect: expandRect(displayRect),
        onTap: onKeyBoxTagTap,
      });
    }

    return { layers, hotspots };
  },
};


// ---------------------------------------------------------
// 画像内の液晶表示
// ---------------------------------------------------------

function renderKeyBoxImageDisplay(frameEl) {
  const digits = state.puzzleInputs.keyBoxDigits || "";

  KEY_BOX_CHAR_RECTS.forEach((rect, index) => {
    const charEl = document.createElement("div");
    charEl.className = "keybox-image-char";

    charEl.style.left = `${rect.x * 100}%`;
    charEl.style.top = `${rect.y * 100}%`;
    charEl.style.width = `${rect.w * 100}%`;
    charEl.style.height = `${rect.h * 100}%`;

    // 未入力なら空欄にして背景の ---- を見せる
    charEl.textContent = digits[index] ? digits[index] : "";

    frameEl.appendChild(charEl);
  });
}


// ---------------------------------------------------------
// 数字入力
// ---------------------------------------------------------

function onKeyBoxDigitTap(digit) {
  if (F("FLAG_KEY_BOX_SOLVED")) return;

  // 有効な数字入力時だけボタン音
  playSE("button");

  state.puzzleInputs.keyBoxDigits += digit;

  if (state.puzzleInputs.keyBoxDigits.length >= 4) {
    const entered = state.puzzleInputs.keyBoxDigits.slice(0, 4);
    state.puzzleInputs.keyBoxDigits = "";

    if (entered === KEY_BOX_CODE) {

      playSE("puzzle_correct");

      setF("FLAG_KEY_BOX_SOLVED", true);

    } else {

      playSE("puzzle_wrong");

      saveGame();
      showZoomMessage("違うみたい…もう一度。");
    }

  } else {
    saveGame();
  }

  renderZoomScreen();
}


// ---------------------------------------------------------
// クリア
// ---------------------------------------------------------

function onKeyBoxClearTap() {
  if (F("FLAG_KEY_BOX_SOLVED")) return;

  // 有効なC入力時だけボタン音
  playSE("button");

  state.puzzleInputs.keyBoxDigits = "";
  saveGame();
  renderZoomScreen();
}


// ---------------------------------------------------------
// 緑タグ取得
// ---------------------------------------------------------

function onKeyBoxTagTap() {
  if (F("FLAG_GREEN_TAG_TAKEN")) return;

  addItem("ITEM_GREEN_TAG");
  setF("FLAG_GREEN_TAG_TAKEN", true);
  renderZoomScreen();
  renderInventory();
}