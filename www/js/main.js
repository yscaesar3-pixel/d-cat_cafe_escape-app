/* =========================================================
   猫カフェからの脱出 - STEP1 main.js
   イベント配線のみ。謎判定・アイテム処理はこのSTEPに含まない。
   ========================================================= */

function updateAudioMenuButtons() {
  const bgmBtn =
    document.getElementById("btn-menu-bgm");

  const seBtn =
    document.getElementById("btn-menu-se");

  if (bgmBtn) {
    bgmBtn.textContent =
      `BGM：${audioSettings.bgm ? "ON" : "OFF"}`;
  }

  if (seBtn) {
    seBtn.textContent =
      `効果音：${audioSettings.se ? "ON" : "OFF"}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {

  // --- TITLE ---
  document.getElementById("btn-title-start").addEventListener("click", () => {
    startNewGame(); // 既存セーブがあっても引き継がない
    showScreen(SCREEN.INTRO);
  });
  document.getElementById("btn-title-continue").addEventListener("click", () => {
    if (!hasSaveData()) return; // 念のための二重ガード(通常はdisabledで防ぐ)
    const restored = continueGame();
    if (restored) {
      // 通常のセーブはstate.screen=GAMEへ正規化済み。
      // クリア直前セーブの場合はstate.screen=CLEARRESULTになっているため、
      // ここで一律GAMEへ上書きせず、continueGame()が設定したscreenを尊重する。
      if (state.screen === SCREEN.GAME) {
        playBGM();
      }
      showScreen(state.screen);
    } else {
      // セーブ破損等でstartNewGame()にフォールバックした場合はINTROから始める。
      showScreen(SCREEN.INTRO);
    }
  });

  // --- INTRO ---
  document.getElementById("btn-intro-start").addEventListener("click", () => {
    playBGM();
    showScreen(SCREEN.GAME);
  });

  // --- GAME: 壁移動 ---
  document.getElementById("nav-left").addEventListener("click", () => {
    moveWall(-1);
    renderGameScreen();
  });
  document.getElementById("nav-right").addEventListener("click", () => {
    moveWall(1);
    renderGameScreen();
  });

  // --- GAME: STAFF ROOMからの正式退室導線 ---
  // 入室はWALL_4のスタッフ扉(FLAG_STAFF_DOOR_UNLOCKED)経由のみ。ここは退室専用。
  document.getElementById("btn-exit-staff-room").addEventListener("click", () => {
    exitStaffRoom();
    renderGameScreen();
  });

 // --- GAME: メニューを開く ---
document.getElementById("btn-open-menu").addEventListener("click", () => {
  showScreen(SCREEN.MENU, { rememberPrevious: true });
  updateAudioMenuButtons();
});

  // --- ZOOM ---
  document.getElementById("btn-zoom-close").addEventListener("click", () => {
    closeZoom();
  });

  // --- ITEMDETAIL (骨格のみ) ---
  document.getElementById("btn-itemdetail-close").addEventListener("click", () => {
    closeToPreviousScreen();
  });

  // --- HINT ---
  document.getElementById("btn-hint-close").addEventListener("click", () => {
    closeToPreviousScreen();
  });

  // --- MENU ---
  document.getElementById("btn-menu-resume").addEventListener("click", () => {
    closeToPreviousScreen();
  });
  
document.getElementById("btn-menu-bgm").addEventListener("click", () => {
  setBGMEnabled(!audioSettings.bgm);
  updateAudioMenuButtons();
});

document.getElementById("btn-menu-se").addEventListener("click", () => {
  setSEEnabled(!audioSettings.se);
  updateAudioMenuButtons();
});
  
  document.getElementById("btn-menu-hint").addEventListener("click", () => {
    // STEP12-C: 「広告を見てヒント」。報酬を実際に獲得できた場合のみHINTを表示する
    // (usedHintCount加算・HINT表示はgrantHintReward側の責務。ads.js参照)。
    requestHintViaRewardedAd(grantHintReward);
  });
  document.getElementById("btn-menu-title").addEventListener("click", () => {
  const confirmed = window.confirm("タイトルに戻りますか？\n進行状況は保存されています。");
  if (!confirmed) return;

  stopBGM();

  state.previousScreen = null;
  showScreen(SCREEN.TITLE);
});
  // --- CLEARRESULT ---
  document.getElementById("btn-clearresult-title").addEventListener("click", () => {
    showScreen(SCREEN.TITLE);
  });

  // --- 初期画面 ---
  showScreen(SCREEN.TITLE);

  // STEP12-C: AdMob初期化はゲーム起動をブロックしないよう非同期で開始する。
  // Web環境ではinitAds()内部でno-opになる(isNativePlatform()がfalse)。
  initAds();
});
