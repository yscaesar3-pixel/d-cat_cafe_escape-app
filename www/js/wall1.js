/* =========================================================
   猫カフェからの脱出 - STEP3 wall1.js
   WALL_1限定の実装。WALL_2以降・STAFF ROOMはここに書かない。

   猫アイコン式収納(WALL1_CAT_LOCKER)の入力UI・正解シーケンスは
   STEP11.5-Aで実画像確認のうえ確定済み(旧: 開発用強制成立は削除済み)。
   ========================================================= */

// ---------------------------------------------------------
// 壁ステージのHotspot (WALL_1のみ)
// bg_wall_01.png (1122×1402) の実画像照合済み座標(STEP11.5-B)。
// ---------------------------------------------------------
WALL_HOTSPOTS.WALL_1 = [
  {
  id: "wall1_entrance_door",
  rect: { x: 0.0000, y: 0.0833, w: 0.3049, h: 0.4536 },

  onTap: () => {
    openZoom("WALL1_ENTRANCE");

    setTimeout(() => {
      showZoomMessage("玄関のドアには鍵がかかっている。");
    }, 0);
  },
},
  {
  id: "wall1_tete",

  // 実画像では玄関前・左下にいる猫がTETE(右上には置かない)。
  rect: { x: 0.0877, y: 0.5496, w: 0.2825, h: 0.2219 },

  onTap: () => {
    openZoom("WALL1_TETE");

    setTimeout(() => {
      showZoomMessage("ててがこちらを見ている。");
    }, 0);
  },
},
  {
  id: "wall1_menu_board",

  rect: { x: 0.4620, y: 0.0494, w: 0.3655, h: 0.3349 },

  onTap: () => {
    openZoom("WALL1_BLACKBOARD");

    setTimeout(() => {
      showZoomMessage("メニューが書かれた黒板だ。");
    }, 0);
  },
},
  {
  id: "wall1_register_counter",
  rect: { x: 0.3278, y: 0.3857, w: 0.3991, h: 0.1441 },

  onTap: () => {
    openZoom("WALL1_REGISTER");

    setTimeout(() => {
      showZoomMessage("レジカウンターだ。引き出しも付いている。");
    }, 0);
  },
},
  {
  id: "wall1_stamp_card",

  rect: {
    x: 0.7358,
    y: 0.4295,
    w: 0.1872,
    h: 0.1357
  },

  onTap: () => {
    openZoom("WALL1_STAMP_CARD");

    setTimeout(() => {
      showZoomMessage("猫カフェのスタンプカードだ。色の違う肉球スタンプが押されている。");
    }, 0);
  },
},
  {
  id: "wall1_cat_locker",

  rect: { x: 0.3808, y: 0.5383, w: 0.2455, h: 0.2049 },

  onTap: () => {
    openZoom("WALL1_CAT_LOCKER");

    setTimeout(() => {
      showZoomMessage("猫の絵が付いた4つのボタンが並んでいる。");
    }, 0);
  },
},
  {
    id: "wall1_small_drawer",
    // STEP11.5-C実画像照合: 元の座標(y:0.83)は床の爪とぎパッドを指しており誤り。
    // 実際の小引き出し(鍵穴付き木箱)はカウンター右端、ペン立ての隣にある。
    rect: { x: 0.9247, y: 0.4126, w: 0.0753, h: 0.1540 },
    onTap: () => openZoom("WALL1_SMALL_DRAWER"),
  },
];

// ---------------------------------------------------------
// 玄関 (9.21)
// ITEM_ENTRANCE_KEYを明示使用した時だけCLEARSEQへ遷移する。
// 所持しているだけでは自動クリアしない。
// 鍵穴は右側ドアノブ下付近(扉全面をHotspotにしない)。
// ---------------------------------------------------------
ZOOM_TARGETS.WALL1_ENTRANCE = {
  getView() {
    return {
      layers: ["zoom_entrance_door.png"],
      hotspots: [
        {
          id: "wall1_entrance_lock_slot",
          // STEP11.5-C実画像照合: 実際の鍵穴はドアノブの下(元のrectはノブ上部までしか
          // カバーしておらず鍵穴を含んでいなかった)。ノブ+鍵穴を含む範囲へ補正。
          rect: { x: 0.6579, y: 0.4620, w: 0.1865, h: 0.1922 },
          onTap: onEntranceDoorUseTap,
        },
      ],
    };
  },
};

function onEntranceDoorUseTap() {
  if (F("FLAG_ENTRANCE_KEY_USED")) return;

  if (state.selectedItem === "ITEM_ENTRANCE_KEY") {
    setF("FLAG_ENTRANCE_KEY_USED", true);
    removeItem("ITEM_ENTRANCE_KEY");
    deselectItem();
    enterClearSequence(); // クリアタイム計測 + CLEARSEQ自動演出(clear.js)
    return;
  }

  if (state.selectedItem === null) {
  showZoomMessage("玄関のドアには鍵がかかっている。");
} else {
  showZoomMessage("これでは玄関の鍵は開かないみたい。");
}
}

// ---------------------------------------------------------
// レジ (探索のみ)
// ---------------------------------------------------------
ZOOM_TARGETS.WALL1_REGISTER = {
  getView() {
    return {
      layers: ["zoom_register_counter.png"],
      hotspots: [],
    };
  },
};

// ---------------------------------------------------------
// スタンプカード (表示のみ。3214判定はSTEP6)
// 固定情報(赤3/青1/黄4/緑2)は画像内の情報としてのみ扱い、
// このSTEPではロジック化しない。
// ---------------------------------------------------------
ZOOM_TARGETS.WALL1_STAMP_CARD = {
  getView() {
    return {
      layers: ["zoom_stamp_card.png"],
      hotspots: [],
    };
  },
};

// ---------------------------------------------------------
// 黒板 + 穴あきプレート (9.2)
// ---------------------------------------------------------
ZOOM_TARGETS.WALL1_BLACKBOARD = {
  getView() {
    const used = F("FLAG_CAT_PLATE_USED_ON_BOARD");
    return {
      layers: [used ? "zoom_menu_board_plate.png" : "zoom_menu_board.png"],
      hotspots: [
        {
          id: "wall1_blackboard_use_slot",
          rect: { x: 0.08, y: 0.07, w: 0.84, h: 0.82 },
          visible: () => !used,
          onTap: onBlackboardTap,
        },
      ],
    };
  },
};

function onBlackboardTap() {
  if (F("FLAG_CAT_PLATE_USED_ON_BOARD")) return;

  if (state.selectedItem === "ITEM_CAT_PLATE") {
    setF("FLAG_CAT_PLATE_USED_ON_BOARD", true);
    removeItem("ITEM_CAT_PLATE");
    deselectItem();
    renderZoomScreen();
    renderInventory();
    return;
  }

  if (state.selectedItem === null) {
  showZoomMessage("黒板に、何かを重ねられそうな場所がある。");
} else {
  showZoomMessage("それはここには合わないみたい。");
}
}

// ---------------------------------------------------------
// 猫アイコン式収納 (9.3)
// 実画像(zoom_cat_locker_closed.png, 1086×1448)上の4つの丸いアイコンボタンを
// 数字の小さい順(黒板プレートから得られる対応: 羽根=1/毛糸=2/魚=3/ボール=4)に押す。
// 配置: 左上=羽根 / 右上=毛糸 / 左下=魚 / 右下=ボール
// 中央の肉球はボタン化しない。
// 4つすべて押された時点でのみ正誤判定する。
// ---------------------------------------------------------

const CAT_LOCKER_ANSWER = ["FEATHER", "YARN", "FISH", "BALL"];

const CAT_LOCKER_BUTTON_RECTS = {
  FEATHER: { x: 0.25, y: 0.35, w: 0.18, h: 0.14 }, // 左上
  YARN:    { x: 0.57, y: 0.35, w: 0.18, h: 0.14 }, // 右上
  FISH:    { x: 0.25, y: 0.56, w: 0.18, h: 0.14 }, // 左下
  BALL:    { x: 0.57, y: 0.56, w: 0.18, h: 0.14 }, // 右下
};

// ---------------------------------------------------------
// 押し込み演出の位置調整
// x：プラスで右、マイナスで左
// y：プラスで下、マイナスで上
// ---------------------------------------------------------

const CAT_LOCKER_BUTTON_PRESS_OFFSETS = {
  FEATHER: { x: 0, y: 1 },
  YARN:    { x: -4, y: 3 },
  FISH:    { x: 0, y: 3 },
  BALL:    { x: -4, y: 3 },
};


// ---------------------------------------------------------
// 猫アイコン収納
// ---------------------------------------------------------

ZOOM_TARGETS.WALL1_CAT_LOCKER = {
  getView() {

    const solved =
      F("FLAG_CAT_LOCKER_SOLVED");

    const taken =
      F("FLAG_TEASER_FEATHER_TAKEN");


    // =====================================================
    // 未クリア
    // =====================================================

    if (!solved) {

      const seq =
        state.puzzleInputs.catLockerSequence;

      const hotspots =
        CAT_LOCKER_ANSWER.map((key) => {

          const pressed =
            seq.includes(key);

          return {
            id:
              `wall1_cat_locker_button_${key.toLowerCase()}`,

            rect:
              CAT_LOCKER_BUTTON_RECTS[key],

            className:
              pressed
                ? "cat-locker-button cat-locker-button-pressed"
                : "cat-locker-button",

            pressOffset:
              CAT_LOCKER_BUTTON_PRESS_OFFSETS[key],

            // 一度押したボタンは再度押せない
            onTap:
              pressed
                ? () => {}
                : () => onCatLockerButtonTap(key),
          };
        });


      return {
        layers: [
          "zoom_cat_locker_closed.png"
        ],

        hotspots
      };
    }


    // =====================================================
    // クリア後
    // =====================================================

    const layers = [
      "zoom_cat_locker_open.png"
    ];

    const hotspots = [];

    if (!taken) {

      const displayRect = {
        x: 0.2334,
        y: 0.4776,
        w: 0.3241,
        h: 0.2501
      };

      layers.push({
        src:
          "overlay_teaser_feather_part_in_locker.png",
        rect:
          displayRect
      });

      hotspots.push({
        id:
          "wall1_cat_locker_feather_overlay",
        rect:
          expandRect(displayRect),
        onTap:
          onCatLockerFeatherTap,
      });
    }

    return {
      layers,
      hotspots
    };
  },
};

// ---------------------------------------------------------
// 猫アイコンボタン押下
// ---------------------------------------------------------

function onCatLockerButtonTap(key) {

  if (
    F("FLAG_CAT_LOCKER_SOLVED")
  ) {
    return;
  }

  const seq =
    state.puzzleInputs.catLockerSequence;

  // すでに押しているボタンは無視
  if (seq.includes(key)) {
    return;
  }

  // 有効なボタン入力時だけ効果音
  playSE("button");

  // 押した順番を記録
  seq.push(key);

  saveGame();

  // 押し込み状態を即座に画面へ反映
  renderZoomScreen();


  // -------------------------------------------------------
  // 4個全部押されるまでは正誤判定しない
  // -------------------------------------------------------

  if (
    seq.length <
    CAT_LOCKER_ANSWER.length
  ) {
    return;
  }


  // -------------------------------------------------------
  // 4個押された時点で初めて判定
  // -------------------------------------------------------

  const correct =
    seq.every(
      (value, index) =>
        value ===
        CAT_LOCKER_ANSWER[index]
    );


  // =======================================================
  // 正解
  // =======================================================

  if (correct) {

    playSE("puzzle_correct");

    // 4つ全部押し込まれた状態を少し見せてから開く
    setTimeout(() => {

      setF(
        "FLAG_CAT_LOCKER_SOLVED",
        true
      );

      state.puzzleInputs
        .catLockerSequence = [];

      saveGame();

      renderZoomScreen();

    }, 450);

    return;
  }


  // =======================================================
  // 不正解
  // =======================================================

  playSE("puzzle_wrong");

  // 4つ全部押し込まれた状態を少し見せた後、
  // 一斉に元へ戻す
  setTimeout(() => {

    state.puzzleInputs
      .catLockerSequence = [];

    saveGame();

    renderZoomScreen();

  }, 800);
}


// ---------------------------------------------------------
// 羽根パーツ取得
// ---------------------------------------------------------

function onCatLockerFeatherTap() {

  if (
    F("FLAG_TEASER_FEATHER_TAKEN")
  ) {
    return;
  }


  addItem(
    "ITEM_TEASER_FEATHER_PART"
  );

  setF(
    "FLAG_TEASER_FEATHER_TAKEN",
    true
  );

  renderZoomScreen();
  renderInventory();
}

// ---------------------------------------------------------
// 小さな鍵付き引き出し (9.7)
// ---------------------------------------------------------
ZOOM_TARGETS.WALL1_SMALL_DRAWER = {
  getView() {
    const unlocked = F("FLAG_SMALL_DRAWER_UNLOCKED");
    const taken = F("FLAG_STAFF_CARD_A_TAKEN");

    if (!unlocked) {
      return {
        layers: ["zoom_small_drawer_locked.png"],
        hotspots: [
          {
            id: "wall1_small_drawer_lock_slot",
            rect: { x: 0.1018, y: 0.3193, w: 0.7911, h: 0.4494 },
            onTap: onSmallDrawerLockTap,
          },
        ],
      };
    }

    const layers = ["zoom_small_drawer_open.png"];
    const hotspots = [];
    if (!taken) {
      const displayRect = { x: 0.3651, y: 0.4253, w: 0.2362, h: 0.1639 };
      layers.push({ src: "overlay_staff_card_piece_a.png", rect: displayRect });
      hotspots.push({
        id: "wall1_small_drawer_card_a_overlay",
        rect: expandRect(displayRect),
        onTap: onSmallDrawerCardATap,
      });
    }
    return { layers, hotspots };
  },
};

function onSmallDrawerLockTap() {
  if (F("FLAG_SMALL_DRAWER_UNLOCKED")) return;

  if (state.selectedItem === "ITEM_SMALL_KEY") {
    setF("FLAG_SMALL_DRAWER_UNLOCKED", true);
    removeItem("ITEM_SMALL_KEY");
    deselectItem();
    renderZoomScreen();
    renderInventory();
    return;
  }

  if (state.selectedItem === null) {
  showZoomMessage("引き出しには鍵がかかっている。");
} else {
  showZoomMessage("この鍵では開かないみたい。");
}
}

function onSmallDrawerCardATap() {
  if (F("FLAG_STAFF_CARD_A_TAKEN")) return;
  addItem("ITEM_STAFF_CARD_A");
  setF("FLAG_STAFF_CARD_A_TAKEN", true);
  renderZoomScreen();
  renderInventory();
}

// ---------------------------------------------------------
// TETE (WALL_1固定配置。移動イベントなし)
// ---------------------------------------------------------
ZOOM_TARGETS.WALL1_TETE = {
  getView() {
    return {
      layers: [
        "zoom_tete_base.png",
        { src: "overlay_tete_zoom.png", rect: { x: 0.27, y: 0.38, w: 0.45, h: 0.46 } },
      ],
      hotspots: [],
    };
  },
};
