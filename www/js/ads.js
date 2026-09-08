/* =========================================================
   猫カフェからの脱出 - STEP12-C ads.js
   @capacitor-community/admob を使ったバナー広告・ヒント用リワード広告。
   Webブラウザ直接閲覧時(native pluginが無い場合)はゲーム本体を止めない。

   本番広告IDへの切替は ADMOB_CONFIG.isTesting を false にするだけで良いよう
   一箇所に集約している。App Store提出ビルドまでは必ずisTesting: trueのまま。
   ========================================================= */

/**
 * 広告設定の一元管理。
 * isTesting: true の間は必ずテスト広告のみを使用する(本番IDへ絶対にリクエストしない)。
 * 本番切替は「isTestingをfalseにする」の1箇所のみで完結する。
 */
const ADMOB_CONFIG = {
  // STEP12-C時点では必ずtrue。App Store提出ビルドの直前に手動でfalseへ切り替える。
  isTesting: true,

  appId: "ca-app-pub-8174756915786797~8743963593",

  production: {
    banner: "ca-app-pub-8174756915786797/6480762332", // nekocafeescape_ios_banner
    rewardedHint: "ca-app-pub-8174756915786797/1036863968", // nekocafeescape_ios_hint_rewarded
  },

  // Googleが公式に配布しているiOS用テスト広告ユニットID(固定値)。
  test: {
    banner: "ca-app-pub-3940256099942544/2934735716",
    rewardedHint: "ca-app-pub-3940256099942544/1712485313",
  },
};

function getBannerAdId() {
  return ADMOB_CONFIG.isTesting ? ADMOB_CONFIG.test.banner : ADMOB_CONFIG.production.banner;
}
function getRewardedHintAdId() {
  return ADMOB_CONFIG.isTesting ? ADMOB_CONFIG.test.rewardedHint : ADMOB_CONFIG.production.rewardedHint;
}

/**
 * Capacitorのnative実行環境かどうか。
 * ブラウザでindex.htmlを直接開いた場合はfalseになり、AdMob関連は一切呼ばれない。
 */
function isNativePlatform() {
  return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform());
}

/**
 * AdMobプラグイン本体を取得する。Web環境やplugin未登録時はnullを返す。
 */
function getAdMobPlugin() {
  if (!isNativePlatform()) return null;
  return (window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) || null;
}

const adsState = {
  initialized: false,
  bannerVisible: false,
  bannerListenersRegistered: false,
  rewardedReady: false,
  rewardedPreparing: false,
  rewardProcessing: false, // 二重タップ対策
};

/**
 * アプリ起動時に一度だけ呼ぶ。
 * ATT確認 → 初期化 → UMP同意確認 → (必要なら)同意フォーム → リワード広告の事前ロード。
 *
 * 重要: ATT(trackingAuthorizationStatus/requestTrackingAuthorization)は
 * 必ずinitialize()より前に呼ぶこと。過去アプリでの実績上、この順序を守らないと
 * IDFAが正しく反映されない問題が起きたことがあるため、既存の動作実績のある
 * 順序をそのまま踏襲する。
 * ここで失敗してもゲーム自体は継続できるようにする(すべてtry/catchで保護)。
 */
async function initAds() {
  const AdMob = getAdMobPlugin();
  if (!AdMob) return; // Web環境: 何もしない

  // --- ATT(App Tracking Transparency)。initialize()より先に、1回だけ要求する ---
  try {
    const attStatus = await AdMob.trackingAuthorizationStatus();
    if (attStatus && attStatus.status === "notDetermined") {
      await AdMob.requestTrackingAuthorization();
    }
  } catch (e) {
    console.warn("[ads] ATT確認に失敗しました:", e);
  }

  try {
    await AdMob.initialize({ initializeForTesting: ADMOB_CONFIG.isTesting });
    adsState.initialized = true;
  } catch (e) {
    console.warn("[ads] AdMob初期化に失敗しました:", e);
    return;
  }

  // --- UMP同意フロー(Google公式フローに沿う。複雑な自作同意UIは作らない) ---
  try {
    const consentInfo = await AdMob.requestConsentInfo();
    if (consentInfo.isConsentFormAvailable && consentInfo.status === "REQUIRED") {
      await AdMob.showConsentForm();
    }
  } catch (e) {
    console.warn("[ads] UMP同意フローに失敗しました(広告なしで続行):", e);
  }

  // ヒント用リワード広告を事前ロードしておく(ゲーム起動はブロックしない)。
  prepareRewardedAd();
}

/* =========================================================
   バナー広告 (GAME / ZOOM画面でのみ表示)
   ========================================================= */

/**
 * 画面遷移のたびに呼ぶ。GAME/ZOOMなら表示、それ以外は非表示にする。
 */
function updateBannerForScreen(screenId) {
  const shouldShow = screenId === SCREEN.GAME || screenId === SCREEN.ZOOM;
  if (shouldShow) {
    showBannerAd();
  } else {
    hideBannerAd();
  }
}

async function showBannerAd() {
  const AdMob = getAdMobPlugin();
  if (!AdMob || !adsState.initialized) return; // Web/初期化失敗時は何もしない(予約領域も0のまま)

  if (!adsState.bannerListenersRegistered) {
    registerBannerListeners(AdMob);
    adsState.bannerListenersRegistered = true;
  }

  if (adsState.bannerVisible) {
    // 既に表示中なら再表示のみ(resumeBanner)で十分。
    try {
      await AdMob.resumeBanner();
    } catch (e) {
      /* noop */
    }
    return;
  }

  try {
    await AdMob.showBanner({
      adId: getBannerAdId(),
      adSize: "ADAPTIVE_BANNER",
      position: "BOTTOM_CENTER",
      // Home Indicator/Safe Areaとバナーが重ならないよう、下マージンとして確保する。
      margin: getSafeAreaBottomPx(),
      isTesting: ADMOB_CONFIG.isTesting,
      npa: false,
    });
    adsState.bannerVisible = true;
  } catch (e) {
    console.warn("[ads] バナー表示に失敗しました:", e);
    // 失敗時は予約領域を確実に解放する(空白を残さない)。
    setBannerReserve(0);
  }
}

async function hideBannerAd() {
  const AdMob = getAdMobPlugin();
  if (!AdMob || !adsState.bannerVisible) {
    setBannerReserve(0);
    return;
  }
  try {
    await AdMob.hideBanner();
  } catch (e) {
    /* noop */
  }
  adsState.bannerVisible = false;
  setBannerReserve(0);
}

function registerBannerListeners(AdMob) {
  AdMob.addListener("bannerAdSizeChanged", (info) => {
    // 実際に表示されたバナー高さをそのままCSSの予約領域へ反映する。
    // (0x0は非表示/失敗を意味するため予約しない)
    if (info && info.height > 0) {
      setBannerReserve(info.height);
    } else {
      setBannerReserve(0);
    }
  });
  AdMob.addListener("bannerAdFailedToLoad", () => {
    adsState.bannerVisible = false;
    setBannerReserve(0);
  });
}

/** iOS Safe Area下端(px)を取得する。取得できない場合は0扱い。 */
function getSafeAreaBottomPx() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--safe-bottom");
  const n = parseFloat(raw);
    return Number.isNaN(n) ? 0 : n;
}

/** バナー分のレイアウト予約(--banner-reserve)を更新する。 */
function setBannerReserve(px) {
  document.documentElement.style.setProperty("--banner-reserve", `${Math.max(0, px)}px`);
}

/* =========================================================
   ヒント用リワード広告
   ========================================================= */

function prepareRewardedAd() {
  const AdMob = getAdMobPlugin();
  if (!AdMob || adsState.rewardedPreparing) return;

  adsState.rewardedReady = false;
  adsState.rewardedPreparing = true;

  AdMob.prepareRewardVideoAd({
    adId: getRewardedHintAdId(),
    isTesting: ADMOB_CONFIG.isTesting,
    npa: false,
  })
    .then(() => {
      adsState.rewardedReady = true;
    })
    .catch((e) => {
      console.warn("[ads] リワード広告の事前ロードに失敗しました:", e);
      adsState.rewardedReady = false;
    })
    .finally(() => {
      adsState.rewardedPreparing = false;
    });
}

/**
 * MENUの「広告を見てヒント」ボタンから呼ばれる。
 * 実際に報酬を獲得できた場合のみonReward()を呼ぶ(HINT表示・usedHintCount加算はonReward側の責務)。
 * 広告ロード失敗・表示失敗・視聴途中離脱・報酬未獲得では一切ヒントを表示しない。
 */
function requestHintViaRewardedAd(onReward) {
  const AdMob = getAdMobPlugin();

  if (!AdMob) {
    // Webブラウザ直接閲覧時のfallback。ゲーム自体は止めない。
    window.alert("ヒント機能はアプリ版でのみご利用いただけます。");
    return;
  }

  if (adsState.rewardProcessing) return; // 二重タップ対策
  adsState.rewardProcessing = true;
  setHintButtonEnabled(false);

  let rewardEarned = false;
  let listenerHandles = [];

  const cleanup = () => {
    listenerHandles.forEach((h) => {
      try {
        h.remove();
      } catch (e) {
        /* noop */
      }
    });
    listenerHandles = [];
    adsState.rewardProcessing = false;
    setHintButtonEnabled(true);
  };

  const finishFailure = (message) => {
    cleanup();
    if (message) window.alert(message);
    prepareRewardedAd(); // 次回のために再ロードしておく
  };

  const finishSuccess = () => {
    cleanup();
    onReward();
    prepareRewardedAd(); // 次回のために再ロードしておく
  };

  Promise.all([
    AdMob.addListener("onRewardedVideoAdReward", () => {
      rewardEarned = true;
    }),
    AdMob.addListener("onRewardedVideoAdDismissed", () => {
      if (rewardEarned) {
        finishSuccess();
      } else {
        // 途中離脱・報酬未獲得: ヒントを表示しない。
        finishFailure(null);
      }
    }),
    AdMob.addListener("onRewardedVideoAdFailedToShow", () => {
      finishFailure("広告を読み込めませんでした。\n通信環境を確認して、もう一度お試しください。");
    }),
  ]).then((handles) => {
    listenerHandles = handles;

    const showAd = () => AdMob.showRewardVideoAd({ adId: getRewardedHintAdId() });

    if (adsState.rewardedReady) {
      adsState.rewardedReady = false;
      showAd().catch(() => finishFailure("広告を読み込めませんでした。\n通信環境を確認して、もう一度お試しください。"));
    } else {
      // 未ロード: その場で1回だけprepareを試みる。
      AdMob.prepareRewardVideoAd({ adId: getRewardedHintAdId(), isTesting: ADMOB_CONFIG.isTesting, npa: false })
        .then(() => showAd())
        .catch(() => finishFailure("広告を読み込めませんでした。\n通信環境を確認して、もう一度お試しください。"));
    }
  });
}

function setHintButtonEnabled(enabled) {
  const btn = document.getElementById("btn-menu-hint");
  if (btn) btn.disabled = !enabled;
}
