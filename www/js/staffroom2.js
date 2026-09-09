/* =========================================================
   猫カフェからの脱出 - STEP8 staffroom2.js
   ROOM_STAFF後半の実装。対象:
   緑キャリー / MONAロッカー / デスク引き出し / スタッフメモ
   猫型木箱(WALL_3)との往復は既存実装(wall3.js, STEP5)をそのまま利用する。
   ========================================================= */

// ---------------------------------------------------------
// ROOM_STAFFのHotspotへ追加(STEP7で作成済みの配列へpushする)
// ---------------------------------------------------------
WALL_HOTSPOTS.ROOM_STAFF.push(
  {
    id: "staff_green_carrier",

    rect: { x: 0.17, y: 0.46, w: 0.22, h: 0.21 },

    onTap: () => {
      openZoom("STAFF_GREEN_CARRIER");

      setTimeout(() => {
        showZoomMessage("緑色のキャリーだ。横に小さなスロットがある。");
      }, 0);
    },
  },

  {
    // プレイヤー向けには単に「ロッカー」。どれがMONAのものかは推理させる。
    id: "staff_lockers-top",

    rect: { x: 0.2721, y: 0.1483, w: 0.2459, h: 0.3109 },

    onTap: () => {
      openZoom("STAFF_MONA_LOCKER");

      setTimeout(() => {
        showZoomMessage("猫ごとに分けられたロッカーが並んでいる。");
      }, 0);
    },
  },

  {
    // プレイヤー向けには単に「ロッカー」。どれがMONAのものかは推理させる。
    id: "staff_lockers-bottom",

    rect: { x: 0.3824, y: 0.4634, w: 0.1357, h: 0.1145 },

    onTap: () => {
      openZoom("STAFF_MONA_LOCKER");

      setTimeout(() => {
        showZoomMessage("猫ごとに分けられたロッカーが並んでいる。");
      }, 0);
    },
  },

  {
    id: "staff_desk",

    rect: { x: 0.3972, y: 0.5807, w: 0.6028, h: 0.4193 },

    onTap: () => {
      openZoom("STAFF_DESK");

      setTimeout(() => {
        showZoomMessage("スタッフ用の事務机だ。引き出しが付いている。");
      }, 0);
    },
  },

  {
    id: "staff_keybox_memo_cabinet",

    // スタッフルーム左側の木製収納
    rect: {
      x: 0.0000,
      y: 0.4300,
      w: 0.1700,
      h: 0.3400,
    },

    onTap: () => {
      openZoom("STAFF_KEYBOX_MEMO_CABINET");
    },
  },
);

// ---------------------------------------------------------
// 緑キャリー (9.15)
// 通常タップだけでは開かない。ITEM_GREEN_TAGの明示使用が必要。
// 首輪と猫じゃらしは観察のみでinventoryに入れない。
// ---------------------------------------------------------
ZOOM_TARGETS.STAFF_GREEN_CARRIER = {
  getView() {
    const open = F("FLAG_GREEN_CARRIER_OPEN");

    if (!open) {
      return {
        layers: ["zoom_carriers.png"],
        hotspots: [
          {
            id: "staff_green_carrier_slot",
            // zoom_carriers.pngでは上=青/左下=赤/右下=緑。
            // 緑スロットは右下キャリー上部。
            rect: {
              x: 0.5392,
              y: 0.5440,
              w: 0.3943,
              h: 0.2925,
            },
            onTap: onGreenCarrierUseTap,
          },
        ],
      };
    }
    const keyTaken = F("FLAG_MONA_LOCKER_KEY_TAKEN");
    // 右下・開いた緑キャリー内部から大きくはみ出さない範囲にまとめる。
    const collarRect = { x: 0.58, y: 0.66, w: 0.18, h: 0.10 };
    const teaserRect = { x: 0.6240, y: 0.6401, w: 0.2099, h: 0.1625 };
    const keyRect = { x: 0.68, y: 0.81, w: 0.15, h: 0.11 };

    const layers = [
      "zoom_carrier_open.png",
      { src: "overlay_mona_collar_in_carrier.png", rect: collarRect },
      { src: "overlay_mona_teaser_in_carrier.png", rect: teaserRect },
    ];
    const hotspots = [
      {
        id: "staff_green_carrier_collar_slot",
        rect: expandRect(collarRect),
        onTap: () => showZoomMessage("MONAの首輪と鈴だ。"),
      },
      {
        id: "staff_green_carrier_teaser_slot",
        rect: expandRect(teaserRect),
        onTap: () => showZoomMessage("使い込まれた猫じゃらしだ。"),
      },
    ];

    if (!keyTaken) {
      layers.push({ src: "overlay_mona_locker_key.png", rect: keyRect });
      hotspots.push({
        id: "staff_green_carrier_key_overlay",
        rect: expandRect(keyRect),
        onTap: onGreenCarrierKeyTap,
      });
    }

    return { layers, hotspots };
  },
};

function onGreenCarrierUseTap() {
  if (F("FLAG_GREEN_CARRIER_OPEN")) return;

  if (state.selectedItem === "ITEM_GREEN_TAG") {
    setF("FLAG_GREEN_CARRIER_OPEN", true);
    removeItem("ITEM_GREEN_TAG");
    deselectItem();
    renderZoomScreen();
    renderInventory();
    return;
  }

 if (state.selectedItem === null) {
  showZoomMessage("緑色のキャリーだ。横に小さなスロットがある。");
} else {
  showZoomMessage("それはこのスロットには合わないみたい。");
}
}

function onGreenCarrierKeyTap() {
  if (F("FLAG_MONA_LOCKER_KEY_TAKEN")) return;
  addItem("ITEM_MONA_LOCKER_KEY");
  setF("FLAG_MONA_LOCKER_KEY_TAKEN", true);
  renderZoomScreen();
  renderInventory();
}

// ---------------------------------------------------------
// ロッカー (9.16)
// プレイヤーには単に「ロッカー」として見せる。どれがMONAのものかは
// 緑キャリー内の首輪/猫じゃらしとCat Profilesから推理させるため、
// zoom_lockers.png全体ではなく、実画像上の対象ロッカー部分だけに
// Hotspotを限定する(左から TETE/MONA/MILK/SORA の並びのうち、
// 左から2番目=MONAのロッカー部分)。
// 他のロッカー部分にはHotspotを置かないため、キーを使っても反応しない。
// UIやメッセージでも解決前に「MONAロッカー」であることを明示しない。
// ---------------------------------------------------------
ZOOM_TARGETS.STAFF_MONA_LOCKER = {
  getView() {
    const open = F("FLAG_MONA_LOCKER_OPEN");

    if (!open) {
      return {
        layers: ["zoom_lockers.png"],
        hotspots: [
          {
            id: "staff_locker_use_slot",
            // 左から2番目(MONA)のロッカー部分のみ。他3ロッカーには重ねない。
            rect: { x: 0.34, y: 0.18, w: 0.17, h: 0.67 },
            onTap: onLockerUseTap,
          },
        ],
      };
    }

    const taken = F("FLAG_CAT_BOX_PLATE_TAKEN");
    const layers = ["zoom_mona_locker_open.png"];
    const hotspots = [];
    if (!taken) {
      const displayRect = { x: 0.3422, y: 0.7475, w: 0.1165, h: 0.0961 };
      layers.push({ src: "overlay_cat_box_plate_in_locker.png", rect: displayRect });
      hotspots.push({
        id: "staff_locker_plate_overlay",
        rect: expandRect(displayRect),
        onTap: onLockerPlateTap,
      });
    }
    return { layers, hotspots };
  },
};

function onLockerUseTap() {
  if (F("FLAG_MONA_LOCKER_OPEN")) return;

  if (state.selectedItem === "ITEM_MONA_LOCKER_KEY") {
    setF("FLAG_MONA_LOCKER_OPEN", true);
    removeItem("ITEM_MONA_LOCKER_KEY");
    deselectItem();
    renderZoomScreen();
    renderInventory();
    return;
  }

  if (state.selectedItem === null) {
  showZoomMessage("MONAのロッカーには鍵がかかっている。");
} else {
  showZoomMessage("この鍵穴には合わないみたい。");
}
}

function onLockerPlateTap() {
  if (F("FLAG_CAT_BOX_PLATE_TAKEN")) return;
  // item_cat_plate.png(前半の黒板用プレート)とは別アイテム。取り違えないこと。
  addItem("ITEM_CAT_BOX_PLATE");
  setF("FLAG_CAT_BOX_PLATE_TAKEN", true);
  renderZoomScreen();
  renderInventory();
}

// ---------------------------------------------------------
// デスク / デスク引き出し / スタッフメモ (9.18, 9.19)
// ズーム階層2段目: デスク → 引き出し。
// メモは取得しない。タップで読むとFLAG_STAFF_NOTE_READ=trueになるが、
// 緑ラグをめくる処理はここでは一切追加しない(STEP9で接続)。
// ---------------------------------------------------------
const STAFF_NOTE_TEXT =
  "閉店前、玄関の鍵はちょっとだけ\n" +
  "レジ横に置いておきました。\n" +
  "\n" +
  "気づいたら、鍵についていた\n" +
  "丸いチャームがころころ床の上へ……。\n" +
  "\n" +
  "そのあと、いつもの遊び場のほうから\n" +
  "鈴の音が聞こえたような？\n" +
  "\n" +
  "また誰か、おもちゃだと思って\n" +
  "遊んじゃったのかな。";

// メモ本文パネルの開閉は保存不要の一時UI状態として扱う(FLAGとは別)。
const staffNoteUiState = {
  open: false,
};

// ---------------------------------------------------------
// KEY BOX用メモ収納
// スタッフルーム左側の木製棚
// ---------------------------------------------------------

ZOOM_TARGETS.STAFF_KEYBOX_MEMO_CABINET = {
  getView() {

    const open =
      F("FLAG_KEYBOX_MEMO_CABINET_OPEN");

    const memoTaken =
      F("FLAG_KEYBOX_MEMO_TAKEN");


    // -------------------------
    // 閉じた状態
    // -------------------------
    if (!open) {

  return {
    layers: [
      "zoom_staff_drawer_closed.png"
    ],

    hotspots: [
      {
        id: "staff_keybox_memo_cabinet_doors",


        // 下段の両開き扉
        rect: {
          x: 0.1800,
          y: 0.5100,
          w: 0.4900,
          h: 0.3400,
        },

        onTap: () => {

          setF(
            "FLAG_KEYBOX_MEMO_CABINET_OPEN",
            true
          );

          renderZoomScreen();
        },
      },
    ],
  };
}


    // -------------------------
    // 開いた状態
    // -------------------------

    const layers = [
      "zoom_staff_drawer_open.png"
    ];

    const hotspots = [];


    // メモ未取得時だけ表示
    if (!memoTaken) {

      const memoRect = {
        x: 0.3000,
        y: 0.5500,
        w: 0.2500,
        h: 0.1800,
      };


      layers.push({
        src: "overlay_memo_in_drawer.png",
        rect: memoRect,
      });


      hotspots.push({
        id:
          "staff_keybox_memo_overlay",

        rect:
          expandRect(memoRect),

        onTap:
          onKeyboxMemoTap,
      });
    }


    return {
      layers,
      hotspots,
    };
  },
};

ZOOM_TARGETS.STAFF_DESK = {
  getView() {
    return {
      layers: ["zoom_desk.png"],
      hotspots: [
        {
          id: "staff_desk_drawer_slot",
          // 引き出しは右側の3段引き出し部分(デスク全体ではない)。
          rect: { x: 0.5369, y: 0.6068, w: 0.4631, h: 0.3932 },
          onTap: () => pushZoom("STAFF_DESK_DRAWER"),
        },
      ],
    };
  },
};

ZOOM_TARGETS.STAFF_DESK_DRAWER = {
  getView() {
    const open = F("FLAG_DESK_DRAWER_OPEN");

    if (!open) {
      return {
        layers: ["zoom_desk_drawer_locked.png"],
        hotspots: [
          {
            id: "staff_desk_drawer_lock_slot",
            // 鍵穴は一番上の引き出し中央上部(引き出し全面ではない)。
            rect: { x: 0.3065, y: 0.2903, w: 0.4954, h: 0.2043 },
            onTap: onDeskDrawerUseTap,
          },
        ],
      };
    }

    const noteRect = { x: 0.39, y: 0.39, w: 0.28, h: 0.18 };
    return {
      layers: ["zoom_desk_drawer_open.png", { src: "overlay_staff_note_in_drawer.png", rect: noteRect }],
      hotspots: [
        {
          id: "staff_desk_note_overlay",
          rect: expandRect(noteRect),
          onTap: onStaffNoteTap,
        },
      ],
      renderExtra: renderStaffNotePanel,
    };
  },
};

function onDeskDrawerUseTap() {
  if (F("FLAG_DESK_DRAWER_OPEN")) return;

  if (state.selectedItem === "ITEM_SMALL_BRASS_KEY") {
    setF("FLAG_DESK_DRAWER_OPEN", true);
    removeItem("ITEM_SMALL_BRASS_KEY");
    deselectItem();
    renderZoomScreen();
    renderInventory();
    return;
  }

 if (state.selectedItem === null) {
  showZoomMessage("引き出しには小さな鍵穴がある。");
} else {
  showZoomMessage("この鍵では開かないみたい。");
}
}

/** メモをタップして読む。inventoryへは入れず、FLAG_STAFF_NOTE_READのみ立てる。 */
function onStaffNoteTap() {
  setF("FLAG_STAFF_NOTE_READ", true);
  staffNoteUiState.open = true;
  renderZoomScreen();
}

function renderStaffNotePanel(frameEl) {
  if (!staffNoteUiState.open) return;

  const panel = document.createElement("div");
  panel.className = "note-panel";

  const text = document.createElement("p");
  text.className = "note-panel-text";
  text.textContent = STAFF_NOTE_TEXT;
  panel.appendChild(text);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "btn btn-text";
  closeBtn.textContent = "閉じる";
  closeBtn.addEventListener("click", () => {
    staffNoteUiState.open = false;
    renderZoomScreen();
  });
  panel.appendChild(closeBtn);

  frameEl.appendChild(panel);
}

function onKeyboxMemoTap() {

  if (
    F("FLAG_KEYBOX_MEMO_TAKEN")
  ) {
    return;
  }


  addItem(
    "ITEM_KEYBOX_MEMO"
  );

  setF(
    "FLAG_KEYBOX_MEMO_TAKEN",
    true
  );


  renderZoomScreen();
  renderInventory();


  setTimeout(() => {

    showZoomMessage(
      "KEY BOXと、数字の入った丸が描かれている。"
    );

  }, 0);
}