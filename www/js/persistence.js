/* =========================================================
   猫カフェからの脱出 - STEP10 persistence.js
   FINAL_v2 15〜17章に基づくlocalStorage保存/復元。
   ゲームロジック・謎は一切変更しない。
   ========================================================= */

// このアプリ専用の固定キー。他アプリと衝突しない名前にする。
const SAVE_KEY = "nekocafe_escape_save_v1";

/**
 * 現在のstateをlocalStorageへ保存する。
 * 失敗しても(容量オーバー/プライベートモード等)アプリを止めない。
 */
function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("[persistence] 保存に失敗しました:", e);
  }
}

/**
 * セーブデータが存在するかどうかを安全に判定する。
 */
function hasSaveData() {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch (e) {
    return false;
  }
}

/**
 * localStorageからセーブデータを読み込み、デフォルトstateとマージして返す。
 * 存在しない/JSON.parse失敗/形式異常の場合はnullを返す(呼び出し側で新規ゲームにフォールバックする)。
 */
function loadSave() {
  let raw;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch (e) {
    return null;
  }
  if (!raw) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.warn("[persistence] セーブデータのJSON解析に失敗しました:", e);
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;

  return mergeWithDefaults(parsed);
}

/**
 * 保存データの一部欠損・古い形式・型不正に耐えるため、デフォルトstateを土台にして
 * 保存データを上書きマージする。JSON.parseに成功していても値の型が壊れている
 * ケース(例: catTowerSequence:"broken", currentWall:null)に備え、
 * フィールドごとに型を検証し、不正であればデフォルト値にフォールバックする。
 */
function mergeWithDefaults(saved) {
  const def = createDefaultState();
  const merged = { ...def, ...saved };

  // --- currentRoom: ROOM.CAFE / ROOM.STAFF以外はdefault ---
  merged.currentRoom =
    saved.currentRoom === ROOM.CAFE || saved.currentRoom === ROOM.STAFF
      ? saved.currentRoom
      : def.currentRoom;

  // --- currentWall: WALL_1〜WALL_4以外はdefault ---
  merged.currentWall = WALL_ORDER.includes(saved.currentWall)
    ? saved.currentWall
    : def.currentWall;

  // --- inventory: Array以外はdefault ---
  merged.inventory = Array.isArray(saved.inventory) ? saved.inventory : def.inventory;

  // --- selectedItem: stringまたはnull以外はdefault ---
  merged.selectedItem =
    typeof saved.selectedItem === "string" || saved.selectedItem === null
      ? saved.selectedItem
      : def.selectedItem;

  // --- zoomStack: Array以外はdefault ---
  merged.zoomStack = Array.isArray(saved.zoomStack) ? saved.zoomStack : def.zoomStack;

  // --- flags: object以外はdefault ---
  merged.flags =
    saved.flags && typeof saved.flags === "object" && !Array.isArray(saved.flags)
      ? { ...def.flags, ...saved.flags }
      : def.flags;

  // --- puzzleInputs: フィールドごとに個別検証 ---
  const savedPI = saved.puzzleInputs && typeof saved.puzzleInputs === "object" ? saved.puzzleInputs : {};

  merged.puzzleInputs = {
    foodSelections:
      savedPI.foodSelections &&
      typeof savedPI.foodSelections === "object" &&
      !Array.isArray(savedPI.foodSelections)
        ? { ...def.puzzleInputs.foodSelections, ...savedPI.foodSelections }
        : def.puzzleInputs.foodSelections,

    catLockerSequence: Array.isArray(savedPI.catLockerSequence)
      ? savedPI.catLockerSequence
      : def.puzzleInputs.catLockerSequence,

    catTowerSequence: Array.isArray(savedPI.catTowerSequence)
      ? savedPI.catTowerSequence
      : def.puzzleInputs.catTowerSequence,

    staffDoorDigits:
      typeof savedPI.staffDoorDigits === "string"
        ? savedPI.staffDoorDigits
        : def.puzzleInputs.staffDoorDigits,

    healthCheckSequence: Array.isArray(savedPI.healthCheckSequence)
      ? savedPI.healthCheckSequence
      : def.puzzleInputs.healthCheckSequence,

    keyBoxDigits:
      typeof savedPI.keyBoxDigits === "string" ? savedPI.keyBoxDigits : def.puzzleInputs.keyBoxDigits,
  };

  merged.hintState =
    saved.hintState && typeof saved.hintState === "object" && !Array.isArray(saved.hintState)
      ? saved.hintState
      : def.hintState;

  // --- STEP12-B: クリアタイム/ヒント回数の軽微な型検証 ---
  merged.startTime = typeof saved.startTime === "number" ? saved.startTime : def.startTime;
  merged.clearTimeStr = typeof saved.clearTimeStr === "string" ? saved.clearTimeStr : def.clearTimeStr;
  merged.usedHintCount = typeof saved.usedHintCount === "number" ? saved.usedHintCount : def.usedHintCount;

  return merged;
}

/**
 * 既存のstateオブジェクト参照を保ったまま、中身をsnapshotで丸ごと置き換える。
 * 他モジュールがconst state = ...で取得した同じ参照を使い続けられるようにするため、
 * state自体を再代入せず、プロパティを入れ替える。
 */
function applyStateSnapshot(snapshot) {
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, snapshot);
}

/**
 * セーブデータを削除する(STEP12-B)。
 * CLEARRESULT到達時に呼び、クリア済みセーブからの「つづきから」を
 * 以後無効化するために使う。localStorageが例外を投げてもクラッシュしない。
 */
function clearSaveData() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.warn("[persistence] セーブ削除に失敗しました:", e);
  }
}

/**
 * 新規ゲームを開始する。既存セーブがあっても古い進行は引き継がない。
 * 開始直後にセーブし、セーブスロットも新規状態で上書きしておく。
 */
function startNewGame() {
  applyStateSnapshot(createDefaultState());
  state.startTime = Date.now(); // クリアタイム計測の起点(STEP12-B)
  saveGame();
}

/**
 * 「つづきから」。セーブデータを読み込みstateへ適用する。
 * 破損/存在しない場合は新規ゲームへフォールバックする。
 * screenはGAMEへ正規化する(MENU/ZOOM等を開いたまま保存されていた場合の対策)。
 * @returns {boolean} 復元に成功したかどうか
 */
function continueGame() {
  const loaded = loadSave();
  if (!loaded) {
    startNewGame();
    return false;
  }
  applyStateSnapshot(loaded);

  // クリア直前(玄関鍵使用済み)のセーブだった場合、通常のGAME復帰はしない。
  // CLEARSEQ中にアプリが終了した可能性があるため、CLEARSEQをやり直すのではなく、
  // 安全にCLEARRESULTへ直接復帰させる(玄関鍵は既に消費済みで再取得できないため、
  // GAMEへ戻しても再度CLEARSEQへ入る手段が無くなってしまう)。
  if (state.flags.FLAG_ENTRANCE_KEY_USED === true) {
    state.zoomStack = [];
    state.previousScreen = null;
    state.itemDetailTarget = null;
    state.screen = SCREEN.CLEARRESULT;
    return true;
  }

  // 通常のセーブ: 保存時に開いていたZOOM/モーダル的画面の情報は引き継がない。
  // 古いzoomStackが残ると、次にZOOMを開いて閉じた際に無関係な過去のZOOMへ
  // 戻ってしまう可能性があるため、GAMEへ正規化する際にまとめてクリアする。
  state.screen = SCREEN.GAME;
  state.zoomStack = [];
  state.previousScreen = null;
  state.itemDetailTarget = null;
  return true;
}
