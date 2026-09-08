import type { CapacitorConfig } from '@capacitor/cli';

// アプリ表示名: ねこカフェからの脱出
// Bundle ID: com.yutaXXX.catcafeescape (App Store Connect登録済み・explicit App ID)
const config: CapacitorConfig = {
  appId: 'com.yutaXXX.catcafeescape',
  appName: 'ねこカフェからの脱出',
  // webDirはWeb資産(index.html/css/js/assets)をそのまま外部ファイル参照で
  // 使うためのディレクトリ。Base64化やbundle化は行わない。
  webDir: 'www',
  ios: {
    // Capacitor 8のiOSはSPM(Swift Package Manager)ベース。CocoaPodsは
    // AdMobプラグイン等ネイティブ依存の解決にのみ使用される想定。
    contentInset: 'automatic',
  },
};

export default config;
