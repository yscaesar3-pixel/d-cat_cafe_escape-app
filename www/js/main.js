/* =========================================================
   猫カフェからの脱出 - STEP1 main.js
   イベント配線のみ。
   謎判定・アイテム処理はこのSTEPに含まない。
   ========================================================= */


// =========================================================
// AUDIO MENU
// =========================================================

function updateAudioMenuButtons() {

  const bgmBtn =
    document.getElementById(
      "btn-menu-bgm"
    );

  const seBtn =
    document.getElementById(
      "btn-menu-se"
    );


  if (bgmBtn) {
    bgmBtn.textContent =
      `BGM：${audioSettings.bgm ? "ON" : "OFF"}`;
  }


  if (seBtn) {
    seBtn.textContent =
      `効果音：${audioSettings.se ? "ON" : "OFF"}`;
  }
}


// =========================================================
// MEMO
// =========================================================

const MEMO_STORAGE_KEY =
  "nekocafeescape_memo";

let memoPreviousScreen =
  null;


function loadMemoText() {

  try {
    return (
      localStorage.getItem(
        MEMO_STORAGE_KEY
      ) || ""
    );

  } catch (e) {
    return "";
  }
}


function saveMemoText(text) {

  try {

    localStorage.setItem(
      MEMO_STORAGE_KEY,
      text
    );

  } catch (e) {

    console.warn(
      "Memo save failed",
      e
    );
  }
}


function openMemo() {

  memoPreviousScreen =
    state.screen;


  const textarea =
    document.getElementById(
      "memo-text"
    );


  if (textarea) {
    textarea.value =
      loadMemoText();
  }


  showScreen(
    SCREEN.MEMO
  );
}


function closeMemo() {

  const textarea =
    document.getElementById(
      "memo-text"
    );


  if (textarea) {

    saveMemoText(
      textarea.value
    );
  }


  const destination =
    memoPreviousScreen ||
    SCREEN.GAME;


  memoPreviousScreen =
    null;


  showScreen(
    destination
  );
}


// =========================================================
// DOM READY
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {


    // -----------------------------------------------------
    // MEMO
    // -----------------------------------------------------

    document
      .getElementById(
        "btn-open-memo-game"
      )
      .addEventListener(
        "click",
        () => {
          openMemo();
        }
      );


    document
      .getElementById(
        "btn-open-memo-zoom"
      )
      .addEventListener(
        "click",
        () => {
          openMemo();
        }
      );


    document
      .getElementById(
        "btn-memo-close"
      )
      .addEventListener(
        "click",
        () => {
          closeMemo();
        }
      );


    document
      .getElementById(
        "memo-text"
      )
      .addEventListener(
        "input",
        (e) => {
          saveMemoText(
            e.target.value
          );
        }
      );


    // -----------------------------------------------------
    // TITLE
    // -----------------------------------------------------

    document
      .getElementById(
        "btn-title-start"
      )
      .addEventListener(
        "click",
        () => {

          // 既存セーブがあっても
          // 新規ゲームへ引き継がない。
          startNewGame();

          showScreen(
            SCREEN.INTRO
          );
        }
      );


    document
      .getElementById(
        "btn-title-continue"
      )
      .addEventListener(
        "click",
        () => {

          if (!hasSaveData()) {
            return;
          }


          const restored =
            continueGame();


          if (restored) {

            // 通常セーブはGAMEへ正規化済み。
            // CLEARRESULT等の場合は
            // continueGame()が設定したscreenを尊重する。
            if (
              state.screen ===
              SCREEN.GAME
            ) {
              playBGM();
            }


            showScreen(
              state.screen
            );

          } else {

            showScreen(
              SCREEN.INTRO
            );
          }
        }
      );


    // -----------------------------------------------------
    // INTRO
    // -----------------------------------------------------

    document
      .getElementById(
        "btn-intro-start"
      )
      .addEventListener(
        "click",
        () => {

          playBGM();

          showScreen(
            SCREEN.GAME
          );
        }
      );


    // -----------------------------------------------------
    // GAME: 壁移動
    // -----------------------------------------------------

    document
      .getElementById(
        "nav-left"
      )
      .addEventListener(
        "click",
        () => {

          moveWall(-1);

          renderGameScreen();
        }
      );


    document
      .getElementById(
        "nav-right"
      )
      .addEventListener(
        "click",
        () => {

          moveWall(1);

          renderGameScreen();
        }
      );


    // -----------------------------------------------------
    // STAFF ROOM 退室
    // -----------------------------------------------------

    document
      .getElementById(
        "btn-exit-staff-room"
      )
      .addEventListener(
        "click",
        () => {

          exitStaffRoom();

          renderGameScreen();
        }
      );


    // -----------------------------------------------------
    // GAME: MENU
    // -----------------------------------------------------

    document
      .getElementById(
        "btn-open-menu"
      )
      .addEventListener(
        "click",
        () => {

          showScreen(
            SCREEN.MENU,
            {
              rememberPrevious:
                true,
            }
          );

          updateAudioMenuButtons();
        }
      );


    // -----------------------------------------------------
    // ZOOM
    // -----------------------------------------------------

    document
      .getElementById(
        "btn-zoom-close"
      )
      .addEventListener(
        "click",
        () => {

          closeZoom();
        }
      );


    // -----------------------------------------------------
    // ITEM DETAIL
    // -----------------------------------------------------

    document
      .getElementById(
        "btn-itemdetail-close"
      )
      .addEventListener(
        "click",
        () => {

          closeToPreviousScreen();
        }
      );


    // -----------------------------------------------------
    // HINT: 閉じる
    // -----------------------------------------------------

    document
      .getElementById(
        "btn-hint-close"
      )
      .addEventListener(
        "click",
        () => {

          closeToPreviousScreen();
        }
      );


    // -----------------------------------------------------
    // HINT: 次の段階
    // -----------------------------------------------------

    document
      .getElementById(
        "btn-hint-next"
      )
      .addEventListener(
        "click",
        () => {

          // 新しい段階を開放するときだけ
          // リワード広告を表示する。
          if (
            !canUnlockNextHintForCurrentStep()
          ) {
            return;
          }

          requestHintViaRewardedAd(
            grantHintReward
          );
        }
      );


    // -----------------------------------------------------
    // MENU: ゲームへ戻る
    // -----------------------------------------------------

    document
      .getElementById(
        "btn-menu-resume"
      )
      .addEventListener(
        "click",
        () => {

          closeToPreviousScreen();
        }
      );


    // -----------------------------------------------------
    // MENU: BGM
    // -----------------------------------------------------

    document
      .getElementById(
        "btn-menu-bgm"
      )
      .addEventListener(
        "click",
        () => {

          setBGMEnabled(
            !audioSettings.bgm
          );

          updateAudioMenuButtons();
        }
      );


    // -----------------------------------------------------
    // MENU: SE
    // -----------------------------------------------------

    document
      .getElementById(
        "btn-menu-se"
      )
      .addEventListener(
        "click",
        () => {

          setSEEnabled(
            !audioSettings.se
          );

          updateAudioMenuButtons();
        }
      );


    // -----------------------------------------------------
    // MENU: HINT
    // -----------------------------------------------------

    document
      .getElementById(
        "btn-menu-hint"
      )
      .addEventListener(
        "click",
        () => {

          // 今の進行段階について
          // すでにヒント1以上が開放済みなら、
          // 広告なしでHINT画面へ。
          if (
            hasUnlockedHintForCurrentStep()
          ) {

            showScreen(
              SCREEN.HINT,
              {
                rememberPrevious:
                  true,
              }
            );

            return;
          }


          // 今の進行段階のヒントが
          // まだ1つも開放されていない場合のみ
          // 広告を表示する。
          requestHintViaRewardedAd(
            grantHintReward
          );
        }
      );


    // -----------------------------------------------------
    // MENU: TITLE
    // -----------------------------------------------------

    document
      .getElementById(
        "btn-menu-title"
      )
      .addEventListener(
        "click",
        () => {

          const confirmed =
            window.confirm(
              "タイトルに戻りますか？\n進行状況は保存されています。"
            );


          if (!confirmed) {
            return;
          }


          stopBGM();

          state.previousScreen =
            null;

          showScreen(
            SCREEN.TITLE
          );
        }
      );


    // -----------------------------------------------------
    // CLEAR RESULT
    // -----------------------------------------------------

    document
      .getElementById(
        "btn-clearresult-title"
      )
      .addEventListener(
        "click",
        () => {

          showScreen(
            SCREEN.TITLE
          );
        }
      );


    // -----------------------------------------------------
    // 初期画面
    // -----------------------------------------------------

    showScreen(
      SCREEN.TITLE
    );


    // -----------------------------------------------------
    // AdMob
    // -----------------------------------------------------

    // ゲーム起動をブロックしないよう
    // 非同期で初期化。
    // Web環境ではinitAds()内部でno-op。
    initAds();
  }
);