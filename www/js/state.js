/* =========================================================
   猫カフェからの脱出 - STEP1 state.js
   このSTEPで扱うのは「画面遷移」「部屋/壁の現在地」のみ。
   flags / inventory / puzzleInputs 等はSTEP2以降で追加する。
   ========================================================= */

// --- UI画面ID (22章) ---
const SCREEN = {
  TITLE: "TITLE",
  INTRO: "INTRO",
  GAME: "GAME",
  ZOOM: "ZOOM",
  ITEMDETAIL: "ITEMDETAIL",
  HINT: "HINT",
  MENU: "MENU",
  MEMO: "MEMO",
  CLEARSEQ: "CLEARSEQ",
  CLEARRESULT: "CLEARRESULT",
};

// --- 部屋ID ---
const ROOM = {
  CAFE: "ROOM_CAFE",
  STAFF: "ROOM_STAFF",
};

// --- ROOM_CAFEの壁循環順 (5章) ---
const WALL_ORDER = ["WALL_1", "WALL_2", "WALL_3", "WALL_4"];

// --- 壁ごとの背景ファイル (18章 背景) ---
const WALL_BG = {
  WALL_1: "assets/bg_wall_01.png",
  WALL_2: "assets/bg_wall_02.png",
  WALL_3: "assets/bg_wall_03.png",
  WALL_4: "assets/bg_wall_04.png",
};
const STAFF_ROOM_BG = "assets/bg_staff_room.png";

/**
 * ゲームの初期state(新規ゲーム用)を生成するファクトリ関数。
 * 「はじめる」(新規ゲーム)と、セーブ破損時のフォールバックの両方で使う。
 *
 * screen: 現在表示中の画面ID
 * currentRoom: ROOM_CAFE | ROOM_STAFF
 * currentWall: ROOM_CAFEにいる時のみ有効 (WALL_1〜4)
 * previousScreen: モーダル的画面(ZOOM/ITEMDETAIL/HINT/MENU)を閉じた時に戻る画面
 * inventory: 所持item id配列
 * selectedItem: 選択中item id
 * itemDetailTarget: ITEMDETAIL画面に表示中のitem id
 * puzzleInputs: 入力途中state(FINAL_v2 14章の正式構造)
 * flags: 全フラグ
 * zoomStack: ズーム階層スタック
 * hintState / usedHintCount / startTime / elapsedBeforePause / clearTimeStr / tutorialShown:
 *   STEP10時点では未実装機能だが、15章の保存構造と衝突しないよう初期値だけ用意する。
 */
function createDefaultState() {
  return {
    screen: SCREEN.TITLE,
    currentRoom: ROOM.CAFE,
    currentWall: "WALL_1",
    previousScreen: null,

    inventory: [],
    selectedItem: null,
    itemDetailTarget: null,

    puzzleInputs: {
      foodSelections: {
        tete: null,
        mona: null,
        milk: null,
        sora: null,
      },
      catLockerSequence: [],
      catTowerSequence: [],
      staffDoorDigits: "",
      healthCheckSequence: [],
      keyBoxDigits: "",
    },

    flags: {},
    zoomStack: [],

    // STEP10: 保存構造との整合のための予約フィールド(未実装機能の初期値)
    hintState: {},
    usedHintCount: 0,
    startTime: null,
    elapsedBeforePause: 0,
    clearTimeStr: null,
    tutorialShown: false,
  };
}

const state = createDefaultState();

/**
 * 壁を相対方向へ循環移動する。
 * @param {1|-1} direction
 */
function moveWall(direction) {
  if (state.currentRoom !== ROOM.CAFE) return;
  const idx = WALL_ORDER.indexOf(state.currentWall);
  const nextIdx = (idx + direction + WALL_ORDER.length) % WALL_ORDER.length;
  state.currentWall = WALL_ORDER[nextIdx];
  saveGame();
}

/**
 * ROOM_STAFFからROOM_CAFEへ戻る(正式導線)。戻り先の壁はWALL_4固定とする。
 * 入室にはFLAG_STAFF_DOOR_UNLOCKEDによる正式な条件があるが、
 * 退室はいつでも可能(鍵で施錠される仕様ではないため)。
 */
function exitStaffRoom() {
  state.currentRoom = ROOM.CAFE;
  state.currentWall = "WALL_4";
  saveGame();
}
