/* =========================================================
   猫カフェからの脱出 - STEP12-B clear.js
   CLEARSEQの短い自動演出、CLEARRESULTの表示、クリアタイム計測を扱う。
   新規画像asset・効果音・BGM・大規模アニメーションは使わない。
   ========================================================= */

/**
 * ミリ秒を "mm:ss" 形式へ整形する。
 */
function formatClearTime(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/**
 * 玄関でITEM_ENTRANCE_KEYを明示使用した瞬間に呼ばれる(wall1.js)。
 * クリアタイムを計算・保存してからCLEARSEQへ遷移し、自動演出を開始する。
 * 既存の「玄関鍵明示使用→FLAG_ENTRANCE_KEY_USED→CLEARSEQ」導線自体は変更しない。
 */
function enterClearSequence() {
  stopBGM();
  playSE("clear");

  if (typeof state.startTime === "number" && !Number.isNaN(state.startTime)) {
    state.clearTimeStr = formatClearTime(Date.now() - state.startTime);
  } else {
    state.clearTimeStr = null;
  }

  saveGame();

  showScreen(SCREEN.CLEARSEQ);
  runClearSeqAnimation();
}

/**
 * CLEARSEQの短い自動演出。ユーザー入力は一切受け付けず、
 * 約2秒後に自動でCLEARRESULTへ遷移する。
 */
function runClearSeqAnimation() {
  const el = document.getElementById("clearseq-text");
  if (!el) return;

  el.textContent = "カチャ…";

  clearTimeout(runClearSeqAnimation._t1);
  clearTimeout(runClearSeqAnimation._t2);

  runClearSeqAnimation._t1 = setTimeout(() => {
    playSE("door_open");
    el.textContent = "ドアが開いた！";
  }, 800);

  runClearSeqAnimation._t2 = setTimeout(() => {
    showScreen(SCREEN.CLEARRESULT);
  }, 2000);
}

/**
 * CLEARRESULT画面の表示内容を更新する。
 * クリアタイムが正常に計測できていない場合は時間表示自体を隠す。
 * 到達した時点でセーブデータを削除し、以後「つづきから」を無効化する
 * (クリア済みセーブからのcontinueは仕様上不要なため)。
 */
function renderClearResultScreen() {
  const timeEl = document.getElementById("clearresult-time");
  if (timeEl) {
    if (state.clearTimeStr) {
      timeEl.textContent = `クリアタイム ${state.clearTimeStr}`;
      timeEl.style.display = "";
    } else {
      timeEl.textContent = "";
      timeEl.style.display = "none";
    }
  }

  clearSaveData();
}
