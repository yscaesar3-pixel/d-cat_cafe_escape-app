# assets/ フォルダ

FINAL_v2仕様書 18章の正式ファイル名で、実画像をこの階層に配置してください。
Base64埋め込みは行わず、このフォルダから相対パス `assets/xxx.png` で参照します。

STEP1時点で参照されるファイル(未配置でも動作確認は可能。プレースホルダー表示になります):

```
bg_wall_01.png
bg_wall_02.png
bg_wall_03.png
bg_wall_04.png
bg_staff_room.png
```

それ以外のzoom/overlay/item画像はSTEP3以降で順次参照します。
