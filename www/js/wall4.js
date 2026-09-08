/* =========================================================
   猫カフェからの脱出 - STEP6 wall4.js
   WALL_4限定の実装 + STAFF ROOMへの正式遷移。
   対象: スタッフ専用扉(カードリーダー+3214キーパッド) / 掲示物 / 遊び場 / 緑ラグ / SORA

   【掲示物について】
   FINAL_v2の18章/19章画像一覧には「掲示物」専用のzoomファイルが無く、
   WALL_4の物体一覧に名前だけ挙げられている(3章)。追加謎を作らない指示でもあるため、
   このSTEPでは独立したHotspot/ZOOM対象を作らず、zoom_staff_door.png内の
   情景要素として扱う(将来、専用画像が指定されればHotspotを追加する)。
   ========================================================= */

// ---------------------------------------------------------
// 壁ステージのHotspot (WALL_4のみ)
// bg_wall_04.png (1122×1402) の実画像照合済み座標(STEP11.5-B)。
// wall4_soraはoverlay_sora_wall4.pngの実表示位置に厳密一致させる座標が
// 未指定のため、現状は従来の仮座標を維持している(要再照合)。
// ---------------------------------------------------------
WALL_HOTSPOTS.WALL_4 = [
  {
  id: "wall4_staff_door-top",

  rect: { x: 0.3808, y: 0.0550, w: 0.4026, h: 0.4861 },

  onTap: () => {
    openZoom("WALL4_STAFF_DOOR");

    setTimeout(() => {
      showZoomMessage("スタッフ専用のドアだ。カードリーダーと暗証パネルが付いている。");
    }, 0);
  },
},

{
  id: "wall4_staff_door-bottom",

  rect: { x: 0.3861, y: 0.5426, w: 0.3232, h: 0.1201 },

  onTap: () => {
    openZoom("WALL4_STAFF_DOOR");

    setTimeout(() => {
      showZoomMessage("スタッフ専用のドアだ。カードリーダーと暗証パネルが付いている。");
    }, 0);
  },
},
  {
    id: "wall4_sora",
    // SORA専用のZOOM画像はFINAL_v2に指定が無いため、専用ZOOMへは入らず観察メッセージのみ。
    // overlay_sora_wall4.pngの表示rect(WALL_OVERLAYS.WALL_4)を基準にした観察範囲。
    rect: { x: 0.4744, y: 0.6599, w: 0.2172, h: 0.1653 },
    onTap: () => showWallMessage("ソラだ。遊ぶのが好きみたい。"),
  },
  {
  id: "wall4_play_area",

  // 緑ラグ中心。右側の爪とぎ箱やピンククッションは含めない。
  rect: { x: 0.1671, y: 0.6825, w: 0.2984, h: 0.2289 },

  onTap: () => {
    openZoom("WALL4_PLAY_AREA");

    setTimeout(() => {
      showZoomMessage("猫たちの遊び場のようだ。");
    }, 0);
  },
},
];

// ---------------------------------------------------------
// 壁の常時表示overlay: SORA(移動なし、常時表示)
// ---------------------------------------------------------
WALL_OVERLAYS.WALL_4 = [
  {
    id: "wall4_sora_overlay",
    src: "overlay_sora_wall4.png",
    // 緑ラグ付近に座っているサイズ感。画像自体(透過処理)はこのSTEPでは加工しない。
    rect: { x: 0.49, y: 0.61, w: 0.18, h: 0.24 },
    visible: () => true,
  },
];

// ---------------------------------------------------------
// SORA (WALL_4固定配置。移動イベントなし)
// SORA専用のZOOM画像はFINAL_v2に指定が無いため、専用ZOOMは作らない。
// タップ時は壁レベルの観察メッセージのみを返す(wall4_soraのonTap参照)。
// 壁上ではoverlay_sora_wall4.pngを常時表示する(WALL_OVERLAYS.WALL_4)。
// ---------------------------------------------------------

// ---------------------------------------------------------
// 遊び場 / 緑ラグ (9.20)
// FLAG_STAFF_NOTE_READ === false の間は常に「ふかふかのラグだ。」で状態変化なし。
// 既読後にラグを実際にタップした時だけFLAG_PLAY_AREA_RUG_REVEALEDが立つ
// (メモを読んだ瞬間に自動でめくれることはない)。
// ---------------------------------------------------------
ZOOM_TARGETS.WALL4_PLAY_AREA = {
  getView() {
    const revealed = F("FLAG_PLAY_AREA_RUG_REVEALED");
    const keyTaken = F("FLAG_ENTRANCE_KEY_TAKEN");

    if (!revealed) {
      return {
        layers: ["zoom_play_area_wall4.png"],
        hotspots: [
          {
            id: "wall4_play_area_rug_slot",
            // ラグだけを対象(画像全面ではない)。
            rect: { x: 0.08, y: 0.34, w: 0.72, h: 0.43 },
            onTap: onPlayAreaRugTap,
          },
        ],
      };
    }

    const layers = ["zoom_play_area_wall4_revealed.png"];
    const hotspots = [];
    if (!keyTaken) {
      const displayRect = { x: 0.5123, y: 0.7481, w: 0.1987, h: 0.1336 };
      layers.push({ src: "overlay_entrance_key_under_rug.png", rect: displayRect });
      hotspots.push({
        id: "wall4_play_area_key_overlay",
        rect: { x: 0.5123, y: 0.7481, w: 0.1987, h: 0.1336 },
        onTap: onPlayAreaKeyTap,
      });
    }
    return { layers, hotspots };
  },
};

function onPlayAreaRugTap() {
  if (!F("FLAG_STAFF_NOTE_READ")) {
    showZoomMessage("ふかふかのラグだ。");
    return; // 画像状態は変えない
  }
  if (F("FLAG_PLAY_AREA_RUG_REVEALED")) return;
  setF("FLAG_PLAY_AREA_RUG_REVEALED", true);
  renderZoomScreen();
}

function onPlayAreaKeyTap() {
  if (F("FLAG_ENTRANCE_KEY_TAKEN")) return;
  addItem("ITEM_ENTRANCE_KEY");
  setF("FLAG_ENTRANCE_KEY_TAKEN", true);
  renderZoomScreen();
  renderInventory();
}

// ---------------------------------------------------------
// スタッフ専用扉: 二重認証 (9.9合成は既実装 / 9.10導出は固定 / 9.11本体)
// ---------------------------------------------------------
ZOOM_TARGETS.WALL4_STAFF_DOOR = {
  getView() {
    if (F("FLAG_STAFF_DOOR_UNLOCKED")) {
      return {
        layers: ["zoom_staff_door_open.png"],
        hotspots: [
          {
            id: "wall4_staff_door_enter",
            // 開いた通路/ドア領域
            rect: { x: 0.28, y: 0.10, w: 0.48, h: 0.75 },
            onTap: onStaffDoorEnterTap,
          },
        ],
      };
    }

    return {
      layers: ["zoom_staff_door.png"],
      hotspots: [
        {
          id: "wall4_staff_door_card_reader",
          // 実画像では扉右側の小さなカードリーダー部分。
          rect: { x: 0.77, y: 0.30, w: 0.11, h: 0.12 },
          onTap: onStaffCardReaderTap,
        },
        {
          id: "wall4_staff_door_keypad_open",
          // 実画像では扉右側、カードリーダーの下にあるキーパッド部分。
          rect: { x: 0.77, y: 0.45, w: 0.11, h: 0.12 },
          onTap: () => pushZoom("WALL4_STAFF_DOOR_KEYPAD"),
        },
      ],
    };
  },
};

function onStaffCardReaderTap() {
  if (F("FLAG_STAFF_CARD_AUTHENTICATED")) return;

  if (state.selectedItem === "ITEM_STAFF_CARD_REPAIRED") {
    setF("FLAG_STAFF_CARD_AUTHENTICATED", true);
    removeItem("ITEM_STAFF_CARD_REPAIRED");
    deselectItem();
    checkStaffDoorUnlock();
    renderZoomScreen();
    renderInventory();
    return;
  }

  if (state.selectedItem === null) {
  showZoomMessage("スタッフ専用のカードリーダーだ。");
} else {
  showZoomMessage("このカードリーダーでは使えないみたい。");
}
}

function onStaffDoorEnterTap() {
  if (!F("FLAG_STAFF_DOOR_UNLOCKED")) return;
  state.zoomStack = [];
  state.currentRoom = ROOM.STAFF;
  saveGame();
  showScreen(SCREEN.GAME);
}

/** 条件A・Bが両方成立していればFLAG_STAFF_DOOR_UNLOCKEDを立てる(9.11)。 */

function checkStaffDoorUnlock() {

  if (
    F("FLAG_STAFF_CARD_AUTHENTICATED") &&
    F("FLAG_STAFF_DOOR_KEYPAD_SOLVED") &&
    !F("FLAG_STAFF_DOOR_UNLOCKED")
  ) {

    playSE("door_open");

    setF("FLAG_STAFF_DOOR_UNLOCKED", true);

  }
}

// ---------------------------------------------------------
// スタッフルーム扉 キーパッド
// ---------------------------------------------------------

const STAFF_DOOR_CODE = "3214";


// ---------------------------------------------------------
// キーパッド画像内の数字ボタンHotspot
//
// ※ここはHotspot Editorで実測した値を入れる。
// 数値はまだ仮置きしない。
// ---------------------------------------------------------

const STAFF_KEYPAD_BUTTON_RECTS = {
  "1": { x: 0.3301, y: 0.5119, w: 0.0935, h: 0.0561 },
  "2": { x: 0.4571, y: 0.5108, w: 0.0905, h: 0.0548 },
  "3": { x: 0.5814, y: 0.5102, w: 0.0835, h: 0.0594 },

  "4": { x: 0.3307, y: 0.5854, w: 0.0877, h: 0.0566 },
  "5": { x: 0.4532, y: 0.5863, w: 0.0919, h: 0.0548 },
  "6": { x: 0.5760, y: 0.5868, w: 0.0945, h: 0.0553 },

  "7": { x: 0.3349, y: 0.6578, w: 0.0849, h: 0.0603 },
  "8": { x: 0.4560, y: 0.6597, w: 0.0822, h: 0.0548 },
  "9": { x: 0.5786, y: 0.6597, w: 0.0863, h: 0.0576 },

  "C": { x: 0.3335, y: 0.7330, w: 0.0808, h: 0.0538 },
  "0": { x: 0.4560, y: 0.7327, w: 0.0891, h: 0.0538 },
};

const STAFF_KEYPAD_BACK_RECT = {
  x: 0.5814,
  y: 0.7294,
  w: 0.0919,
  h: 0.0594
};

const STAFF_KEYPAD_CHAR_RECTS = [
  { x: 0.35, y: 0.42, w: 0.05, h: 0.05 },
  { x: 0.43, y: 0.42, w: 0.05, h: 0.05 },
  { x: 0.51, y: 0.42, w: 0.05, h: 0.05 },
  { x: 0.59, y: 0.42, w: 0.05, h: 0.05 },
];


// ---------------------------------------------------------
// キーパッド
// ---------------------------------------------------------

ZOOM_TARGETS.WALL4_STAFF_DOOR_KEYPAD = {
  getView() {

    const hotspots = [];

    Object.entries(STAFF_KEYPAD_BUTTON_RECTS)
      .forEach(([key, rect]) => {

        if (!rect) return;

        hotspots.push({
          id:
            `wall4_staff_keypad_${key === "C" ? "clear" : key}`,

          rect,

          onTap: () => {
            if (key === "C") {
              onStaffDoorClearTap();
            } else {
              onStaffDoorDigitTap(key);
            }
          },
        });
      });


    // 画像内の「戻る」
    hotspots.push({
      id: "wall4_staff_keypad_back",

      rect: STAFF_KEYPAD_BACK_RECT,

      onTap: () => {
        closeZoomOneLevel();
      },
    });


    return {
      layers: [
        "zoom_staff_door_keypad.png"
      ],

      hotspots,

      renderExtra:
        renderStaffDoorKeypadDisplay,
    };
  },
};


// ---------------------------------------------------------
// 画像内の液晶表示
// ---------------------------------------------------------

function renderStaffDoorKeypadDisplay(frameEl) {

  const digits =
    state.puzzleInputs.staffDoorDigits || "";

  STAFF_KEYPAD_CHAR_RECTS.forEach(
    (rect, index) => {

      // まだ入力されていない桁は何も重ねない
      // → 背景画像に描かれている「-」がそのまま見える
      if (!digits[index]) {
        return;
      }

      const charEl =
        document.createElement("div");

      charEl.className =
        "staff-keypad-image-char";

      charEl.textContent =
        digits[index];

      charEl.style.left =
        `${rect.x * 100}%`;

      charEl.style.top =
        `${rect.y * 100}%`;

      charEl.style.width =
        `${rect.w * 100}%`;

      charEl.style.height =
        `${rect.h * 100}%`;

      frameEl.appendChild(charEl);
    }
  );
}

function onStaffDoorDigitTap(digit) {
  if (!F("FLAG_STAFF_CARD_AUTHENTICATED")) {
    showZoomMessage("先にスタッフカードが必要みたいだ");
    return;
  }

  if (F("FLAG_STAFF_DOOR_KEYPAD_SOLVED")) return;

  // 有効な数字入力時だけボタン音
  playSE("button");

  state.puzzleInputs.staffDoorDigits += digit;

  if (state.puzzleInputs.staffDoorDigits.length >= 4) {
    const entered = state.puzzleInputs.staffDoorDigits.slice(0, 4);
    state.puzzleInputs.staffDoorDigits = "";

    if (entered === STAFF_DOOR_CODE) {

      playSE("puzzle_correct");

      setF("FLAG_STAFF_DOOR_KEYPAD_SOLVED", true);
      checkStaffDoorUnlock();

      // 解錠が成立したら、キーパッド画面から扉画面(open)へ自動的に戻す。
      if (
        F("FLAG_STAFF_DOOR_UNLOCKED") &&
        state.zoomStack[state.zoomStack.length - 1] === "WALL4_STAFF_DOOR_KEYPAD"
      ) {
        state.zoomStack.pop();
        saveGame();
      }

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

function onStaffDoorClearTap() {
  if (!F("FLAG_STAFF_CARD_AUTHENTICATED")) {
    showZoomMessage("先にスタッフカードが必要みたいだ");
    return;
  }

  if (F("FLAG_STAFF_DOOR_KEYPAD_SOLVED")) return;

  // 有効なC入力時だけボタン音
  playSE("button");

  state.puzzleInputs.staffDoorDigits = "";
  saveGame();
  renderZoomScreen();
}