// =========================================================
// AUDIO
// BGM / SE 共通管理
// =========================================================

const AUDIO_SETTINGS_KEY = "nekocafeescape_audio_settings";


// ---------------------------------------------------------
// 音声ファイル
// ---------------------------------------------------------

const AUDIO_FILES = {
  bgm_cafe: "assets/audio/bgm_cafe.mp3",

  tap: "assets/audio/se_tap.mp3",
  zoom: "assets/audio/se_zoom.mp3",
  item_get: "assets/audio/se_item_get.mp3",
  button: "assets/audio/se_button.mp3",
  puzzle_correct: "assets/audio/se_puzzle_correct.mp3",
  puzzle_wrong: "assets/audio/se_puzzle_wrong.mp3",
  unlock: "assets/audio/se_unlock.mp3",
  door_open: "assets/audio/se_door_open.mp3",
  clear: "assets/audio/se_clear.mp3",
};


// ---------------------------------------------------------
// 設定
// ---------------------------------------------------------

let audioSettings = {
  bgm: true,
  se: true,
};


function loadAudioSettings() {
  try {
    const raw =
      localStorage.getItem(AUDIO_SETTINGS_KEY);

    if (!raw) return;

    const saved =
      JSON.parse(raw);

    audioSettings = {
      ...audioSettings,
      ...saved,
    };

  } catch (e) {
    console.warn(
      "Audio settings load failed",
      e
    );
  }
}


function saveAudioSettings() {
  try {
    localStorage.setItem(
      AUDIO_SETTINGS_KEY,
      JSON.stringify(audioSettings)
    );
  } catch (e) {
    console.warn(
      "Audio settings save failed",
      e
    );
  }
}


// ---------------------------------------------------------
// BGM
// ---------------------------------------------------------

const bgmCafe =
  new Audio(AUDIO_FILES.bgm_cafe);

bgmCafe.loop = true;
bgmCafe.volume = 0.28;


function playBGM() {

  if (!audioSettings.bgm) {
    return;
  }

  if (!bgmCafe.paused) {
    return;
  }

  bgmCafe
    .play()
    .catch(() => {
      // iOS / ブラウザの自動再生制限時は
      // 次のユーザー操作まで待つ
    });
}


function stopBGM() {
  bgmCafe.pause();
}


function restartBGM() {
  bgmCafe.currentTime = 0;
  playBGM();
}


// ---------------------------------------------------------
// SE
// ---------------------------------------------------------

function playSE(name, volume = 0.7) {

  if (!audioSettings.se) {
    return;
  }

  const src =
    AUDIO_FILES[name];

  if (!src) {
    console.warn(
      `Unknown SE: ${name}`
    );
    return;
  }

  const audio =
    new Audio(src);

  audio.volume = volume;

  audio
    .play()
    .catch(() => {});
}


// ---------------------------------------------------------
// ON / OFF
// ---------------------------------------------------------

function setBGMEnabled(enabled) {

  audioSettings.bgm =
    !!enabled;

  saveAudioSettings();

  if (audioSettings.bgm) {
    playBGM();
  } else {
    stopBGM();
  }
}


function setSEEnabled(enabled) {

  audioSettings.se =
    !!enabled;

  saveAudioSettings();
}


// ---------------------------------------------------------
// 初期化
// ---------------------------------------------------------

loadAudioSettings();