/* =========================================================
   猫カフェからの脱出 - STEP12-C ads.js
   @capacitor-community/admob を使った
   バナー広告・ヒント用リワード広告。

   Webブラウザ直接閲覧時
   (native pluginが無い場合)は
   ゲーム本体を止めない。

   本番広告IDへの切替は
   ADMOB_CONFIG.isTesting を false にするだけで良いよう
   一箇所に集約している。

   App Store提出ビルドまでは
   必ずisTesting: trueのまま。
   ========================================================= */


/**
 * 広告設定の一元管理。
 *
 * isTesting: true の間は
 * 必ずテスト広告のみを使用する。
 *
 * 本番切替は
 * 「isTestingをfalseにする」
 * の1箇所のみ。
 */
const ADMOB_CONFIG = {

  // App Store提出直前までtrue
  isTesting: true,

  appId:
    "ca-app-pub-8174756915786797~8743963593",

  production: {

    banner:
      "ca-app-pub-8174756915786797/6480762332",

    rewardedHint:
      "ca-app-pub-8174756915786797/1036863968",
  },

  // Google公式 iOSテスト広告ID
  test: {

    banner:
      "ca-app-pub-3940256099942544/2934735716",

    rewardedHint:
      "ca-app-pub-3940256099942544/1712485313",
  },
};


function getBannerAdId() {

  return ADMOB_CONFIG.isTesting
    ? ADMOB_CONFIG.test.banner
    : ADMOB_CONFIG.production.banner;
}


function getRewardedHintAdId() {

  return ADMOB_CONFIG.isTesting
    ? ADMOB_CONFIG.test.rewardedHint
    : ADMOB_CONFIG.production.rewardedHint;
}


/**
 * Capacitorのnative実行環境かどうか。
 */
function isNativePlatform() {

  return !!(
    window.Capacitor &&
    typeof window.Capacitor.isNativePlatform ===
      "function" &&
    window.Capacitor.isNativePlatform()
  );
}


/**
 * AdMobプラグイン取得。
 */
function getAdMobPlugin() {

  if (!isNativePlatform()) {
    return null;
  }

  return (
    window.Capacitor.Plugins &&
    window.Capacitor.Plugins.AdMob
  ) || null;
}


/* =========================================================
   広告状態
   ========================================================= */

const adsState = {

  initialized: false,

  bannerVisible: false,

  bannerListenersRegistered: false,

  rewardedReady: false,

  rewardedPreparing: false,

  // 二重タップ対策
  rewardProcessing: false,
};


/*
 * ---------------------------------------------------------
 * バナー用固定予約サイズ
 * ---------------------------------------------------------
 *
 * GAME / ZOOMでは、
 * 広告が読み込み中・再表示中・サイズ通知待ちでも
 * 常に同じ高さを確保する。
 *
 * これにより、
 *
 * 0px
 * ↓
 * 広告実高さ
 * ↓
 * 0px
 *
 * という変化による
 * 壁画像・ZOOM画像・inventory・矢印の
 * レイアウトジャンプを防ぐ。
 *
 * 初期リリースはiPhone縦画面のみなので60px固定。
 */
const BANNER_LAYOUT_RESERVE_PX =
  60;


/**
 * GAME / ZOOMかどうか。
 */
function isBannerScreen(
  screenId
) {

  return (
    screenId === SCREEN.GAME ||
    screenId === SCREEN.ZOOM
  );
}


/**
 * 現在の画面に応じて
 * CSS側のバナー予約領域だけを同期する。
 */
function syncBannerReserveForScreen(
  screenId
) {

  const shouldReserve =
    isNativePlatform() &&
    isBannerScreen(screenId);


  setBannerReserve(
    shouldReserve
      ? BANNER_LAYOUT_RESERVE_PX
      : 0
  );
}


/* =========================================================
   AdMob初期化
   ========================================================= */

/**
 * アプリ起動時に一度だけ呼ぶ。
 *
 * ATT確認
 * ↓
 * AdMob initialize
 * ↓
 * UMP
 * ↓
 * リワード広告事前ロード
 */
async function initAds() {

  const AdMob =
    getAdMobPlugin();


  if (!AdMob) {

    // Web環境
    return;
  }


  // -------------------------------------------------------
  // ATT
  // initialize()より前に実行
  // -------------------------------------------------------

  try {

    const attStatus =
      await AdMob
        .trackingAuthorizationStatus();


    if (
      attStatus &&
      attStatus.status ===
        "notDetermined"
    ) {

      await AdMob
        .requestTrackingAuthorization();
    }

  } catch (e) {

    console.warn(
      "[ads] ATT確認に失敗しました:",
      e
    );
  }


  // -------------------------------------------------------
  // AdMob initialize
  // -------------------------------------------------------

  try {

    await AdMob.initialize({

      initializeForTesting:
        ADMOB_CONFIG.isTesting,
    });


    adsState.initialized =
      true;

  } catch (e) {

    console.warn(
      "[ads] AdMob初期化に失敗しました:",
      e
    );

    return;
  }


  // -------------------------------------------------------
  // UMP
  // -------------------------------------------------------

  try {

    const consentInfo =
      await AdMob
        .requestConsentInfo();


    if (
      consentInfo
        .isConsentFormAvailable &&
      consentInfo.status ===
        "REQUIRED"
    ) {

      await AdMob
        .showConsentForm();
    }

  } catch (e) {

    console.warn(
      "[ads] UMP同意フローに失敗しました(広告なしで続行):",
      e
    );
  }


  // -------------------------------------------------------
  // ヒント用広告を事前ロード
  // -------------------------------------------------------

  prepareRewardedAd();
}


/* =========================================================
   バナー広告
   GAME / ZOOMのみ
   ========================================================= */

/**
 * 画面遷移のたびに呼ばれる。
 *
 * 重要:
 * showBanner完了を待つ前に
 * 固定予約領域を確保する。
 */
function updateBannerForScreen(
  screenId
) {

  const shouldShow =
    isBannerScreen(
      screenId
    );


  /*
   * 広告の表示・非表示処理より先に
   * レイアウト予約を同期する。
   *
   * ここが今回の画面揺れ対策の中心。
   */
  syncBannerReserveForScreen(
    screenId
  );


  if (shouldShow) {

    showBannerAd();

  } else {

    hideBannerAd();
  }
}


/**
 * バナー表示。
 */
async function showBannerAd() {

  const AdMob =
    getAdMobPlugin();


  // -------------------------------------------------------
  // Web
  // -------------------------------------------------------

  if (!AdMob) {

    setBannerReserve(0);

    return;
  }


  /*
   * Nativeでは広告の準備状況に関係なく
   * GAME / ZOOMの固定領域を維持する。
   */
  syncBannerReserveForScreen(
    state.screen
  );


  /*
   * AdMob初期化前でも
   * レイアウト予約だけは済んでいる。
   */
  if (!adsState.initialized) {

    return;
  }


  // -------------------------------------------------------
  // Listener登録
  // -------------------------------------------------------

  if (
    !adsState
      .bannerListenersRegistered
  ) {

    registerBannerListeners(
      AdMob
    );

    adsState
      .bannerListenersRegistered =
      true;
  }


  // -------------------------------------------------------
  // すでに表示済み
  // -------------------------------------------------------

  if (
    adsState.bannerVisible
  ) {

    try {

      await AdMob
        .resumeBanner();

    } catch (e) {

      // resume失敗でも
      // GAME / ZOOMの予約領域は維持
    }


    return;
  }


  // -------------------------------------------------------
  // 新規表示
  // -------------------------------------------------------

  try {

    await AdMob.showBanner({

      adId:
        getBannerAdId(),

      adSize:
        "ADAPTIVE_BANNER",

      position:
        "BOTTOM_CENTER",

      // Home Indicator /
      // Safe Areaと重ならないようにする
      margin:
        getSafeAreaBottomPx(),

      isTesting:
        ADMOB_CONFIG.isTesting,

      npa:
        false,
    });


    adsState.bannerVisible =
      true;

  } catch (e) {

    console.warn(
      "[ads] バナー表示に失敗しました:",
      e
    );


    adsState.bannerVisible =
      false;


    /*
     * 広告取得失敗時も、
     * GAME / ZOOMなら予約領域を維持。
     *
     * 空白が一時的に残ることより、
     * 後から広告が復帰した時に
     * ゲーム画面全体が動くことを防ぐ方を優先する。
     */
    syncBannerReserveForScreen(
      state.screen
    );
  }
}


/**
 * バナー非表示。
 */
async function hideBannerAd() {

  const AdMob =
    getAdMobPlugin();


  if (
    !AdMob ||
    !adsState.bannerVisible
  ) {

    /*
     * 非表示対象画面なら0。
     *
     * 万一GAME / ZOOM中に呼ばれても
     * 固定領域を維持する。
     */
    syncBannerReserveForScreen(
      state.screen
    );

    return;
  }


  try {

    await AdMob
      .hideBanner();

  } catch (e) {

    // 広告非表示失敗でも
    // ゲーム本体は続行
  }


  adsState.bannerVisible =
    false;


  syncBannerReserveForScreen(
    state.screen
  );
}


/**
 * バナーイベント。
 */
function registerBannerListeners(
  AdMob
) {

  AdMob.addListener(
    "bannerAdSizeChanged",
    (info) => {

      /*
       * 以前はここで
       *
       * setBannerReserve(info.height)
       *
       * を実行していた。
       *
       * しかしiOS側から
       *
       * 0
       * ↓
       * 実高さ
       *
       * と複数回通知される場合があり、
       * そのたびにゲーム画面全体が上下していた。
       *
       * 今回は実測値を
       * レイアウトには反映しない。
       */


      /*
       * 万一固定予約60pxより
       * 大きい広告が返った場合だけ
       * 開発時に確認できるよう警告。
       *
       * 初期リリースは
       * iPhone縦画面のみ。
       */
      if (
        info &&
        info.height > 0 &&
        info.height >
          BANNER_LAYOUT_RESERVE_PX
      ) {

        console.warn(
          `[ads] バナー実高さ(${info.height}px)が固定予約(${BANNER_LAYOUT_RESERVE_PX}px)を超えています。`
        );
      }
    }
  );


  AdMob.addListener(
    "bannerAdFailedToLoad",
    () => {

      adsState.bannerVisible =
        false;


      /*
       * 失敗しても
       * GAME / ZOOMでは固定予約を維持。
       *
       * MENU等なら0。
       */
      syncBannerReserveForScreen(
        state.screen
      );
    }
  );
}


/**
 * iOS Safe Area下端(px)取得。
 */
function getSafeAreaBottomPx() {

  const raw =
    getComputedStyle(
      document.documentElement
    )
      .getPropertyValue(
        "--safe-bottom"
      );


  const n =
    parseFloat(raw);


  return Number.isNaN(n)
    ? 0
    : n;
}


/**
 * CSSの
 * --banner-reserve
 * を更新する。
 */
function setBannerReserve(px) {

  document
    .documentElement
    .style
    .setProperty(
      "--banner-reserve",
      `${Math.max(0, px)}px`
    );
}


/* =========================================================
   ヒント用リワード広告
   ========================================================= */


/**
 * ヒント用広告を事前ロード。
 */
function prepareRewardedAd() {

  const AdMob =
    getAdMobPlugin();


  if (
    !AdMob ||
    adsState.rewardedPreparing
  ) {

    return;
  }


  adsState.rewardedReady =
    false;

  adsState.rewardedPreparing =
    true;


  AdMob
    .prepareRewardVideoAd({

      adId:
        getRewardedHintAdId(),

      isTesting:
        ADMOB_CONFIG.isTesting,

      npa:
        false,
    })

    .then(() => {

      adsState.rewardedReady =
        true;
    })

    .catch((e) => {

      console.warn(
        "[ads] リワード広告の事前ロードに失敗しました:",
        e
      );

      adsState.rewardedReady =
        false;
    })

    .finally(() => {

      adsState.rewardedPreparing =
        false;
    });
}


/**
 * 「広告を見てヒント」または
 * 「次のヒントを見る（広告）」
 * から呼ばれる。
 *
 * 実際に報酬を獲得した場合のみ
 * onReward()を実行する。
 */
function requestHintViaRewardedAd(
  onReward
) {

  const AdMob =
    getAdMobPlugin();


  // -------------------------------------------------------
  // Web fallback
  // -------------------------------------------------------

  if (!AdMob) {

    window.alert(
      "ヒント機能はアプリ版でのみご利用いただけます。"
    );

    return;
  }


  // 二重タップ防止
  if (
    adsState.rewardProcessing
  ) {

    return;
  }


  adsState.rewardProcessing =
    true;


  setHintButtonEnabled(
    false
  );


  let rewardEarned =
    false;

  let listenerHandles =
    [];


  // -------------------------------------------------------
  // cleanup
  // -------------------------------------------------------

  const cleanup = () => {

    listenerHandles
      .forEach((h) => {

        try {

          h.remove();

        } catch (e) {

          // noop
        }
      });


    listenerHandles =
      [];


    adsState.rewardProcessing =
      false;


    setHintButtonEnabled(
      true
    );
  };


  // -------------------------------------------------------
  // failure
  // -------------------------------------------------------

  const finishFailure =
    (message) => {

      cleanup();


      if (message) {

        window.alert(
          message
        );
      }


      // 次回のため再ロード
      prepareRewardedAd();
    };


  // -------------------------------------------------------
  // success
  // -------------------------------------------------------

  const finishSuccess =
    () => {

      cleanup();

      onReward();

      // 次回のため再ロード
      prepareRewardedAd();
    };


  // -------------------------------------------------------
  // Listeners
  // -------------------------------------------------------

  Promise
    .all([

      AdMob.addListener(
        "onRewardedVideoAdReward",
        () => {

          rewardEarned =
            true;
        }
      ),


      AdMob.addListener(
        "onRewardedVideoAdDismissed",
        () => {

          if (rewardEarned) {

            finishSuccess();

          } else {

            // 途中離脱
            finishFailure(
              null
            );
          }
        }
      ),


      AdMob.addListener(
        "onRewardedVideoAdFailedToShow",
        () => {

          finishFailure(
            "広告を読み込めませんでした。\n通信環境を確認して、もう一度お試しください。"
          );
        }
      ),
    ])

    .then(
      (handles) => {

        listenerHandles =
          handles;


        const showAd =
          () =>
            AdMob
              .showRewardVideoAd({

                adId:
                  getRewardedHintAdId(),
              });


        // -------------------------------------------------
        // 事前ロード済み
        // -------------------------------------------------

        if (
          adsState.rewardedReady
        ) {

          adsState.rewardedReady =
            false;


          showAd()
            .catch(() => {

              finishFailure(
                "広告を読み込めませんでした。\n通信環境を確認して、もう一度お試しください。"
              );
            });


          return;
        }


        // -------------------------------------------------
        // 未ロード
        // その場で一度だけprepare
        // -------------------------------------------------

        AdMob
          .prepareRewardVideoAd({

            adId:
              getRewardedHintAdId(),

            isTesting:
              ADMOB_CONFIG.isTesting,

            npa:
              false,
          })

          .then(
            () => showAd()
          )

          .catch(() => {

            finishFailure(
              "広告を読み込めませんでした。\n通信環境を確認して、もう一度お試しください。"
            );
          });
      }
    );
}


/**
 * ヒントボタンの二重タップ防止。
 *
 * MENU側とHINT側の両方を対象にする。
 */
function setHintButtonEnabled(
  enabled
) {

  const menuBtn =
    document.getElementById(
      "btn-menu-hint"
    );


  const nextBtn =
    document.getElementById(
      "btn-hint-next"
    );


  if (menuBtn) {

    menuBtn.disabled =
      !enabled;
  }


  if (nextBtn) {

    nextBtn.disabled =
      !enabled;
  }
}