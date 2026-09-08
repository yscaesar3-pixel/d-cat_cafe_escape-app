/* =========================================================
   猫カフェからの脱出 - STEP4 wall2.js
   WALL_2限定の実装。WALL_3/WALL_4/STAFF ROOMはここに書かない。
   対象: ごはん棚 / キャットタワー / おもちゃカゴ / MONA(+ピンクのベッド)
   ※ ピンクのベッドはFINAL_v2に独立した謎セクションが無く、
     MONAの通常/移動後画像(zoom_mona_base / zoom_mona_moved_base)に
     含まれる背景要素として扱われている。そのため別Hotspotは作らず、
     MONAのズーム内で表現する。
   ========================================================= */

// ---------------------------------------------------------
// 壁ステージのHotspot (WALL_2のみ)
// bg_wall_02.png (1194×1317) の実画像照合済み座標(STEP11.5-B)。
// ---------------------------------------------------------
WALL_HOTSPOTS.WALL_2 = [
  {
  id: "wall2_cat_tower",

  rect: { x: 0.4665, y: 0.2387, w: 0.2728, h: 0.4098 },

  onTap: () => {
    openZoom("WALL2_CAT_TOWER");

    setTimeout(() => {
      showZoomMessage("大きなキャットタワーだ。下の方に小さな引き出しがある。");
    }, 0);
  },
},
  {
  id: "wall2_food_area",

  rect: { x: 0.7472, y: 0.3199, w: 0.2528, h: 0.4573 },

  onTap: () => {
    openZoom("WALL2_FOOD_AREA");

    setTimeout(() => {
      showZoomMessage("猫たちのごはんが並んでいる。下には選択できそうな欄がある。");
    }, 0);
  },
},
  {
  id: "wall2_toy_basket",

  rect: { x: 0.0046, y: 0.7032, w: 0.2982, h: 0.2417 },

  onTap: () => {
    openZoom("WALL2_TOY_BASKET");

    setTimeout(() => {
      showZoomMessage("猫のおもちゃが入ったカゴだ。");
    }, 0);
  },
},
  {
  id: "wall2_mona",

  // ピンクのベッド(中央下)を含む領域。
  // MONAの通常/移動後どちらの状態でもここをタップする。
  rect: { x: 0.3182, y: 0.6493, w: 0.3155, h: 0.1401 },

  onTap: () => {
    openZoom("WALL2_MONA");

    setTimeout(() => {
      if (F("FLAG_MONA_MOVED")) {
        showZoomMessage("MONAがいたピンクのベッドだ。");
      } else {
        showZoomMessage("MONAがピンクのベッドでくつろいでいる。");
      }
    }, 0);
  },
},
];

// ---------------------------------------------------------
// 壁の常時表示overlay: MONA(通常時のみ壁上に表示)
// ---------------------------------------------------------
WALL_OVERLAYS.WALL_2 = [
  {
    id: "wall2_mona_on_bed",
    src: "overlay_mona_on_bed.png",
    rect: { x: 0.30, y: 0.60, w: 0.30, h: 0.18 },
    visible: () => !F("FLAG_MONA_MOVED"),
  },
];

// ---------------------------------------------------------
// ごはん棚 (9.1)
// 画像内の4つの選択ボタンを押して、
// 各猫の白い表示枠の中の餌画像を切り替える。
// 別ウィンドウの選択UIは使用しない。
// ---------------------------------------------------------

const FOOD_AREA_CANS = [
  "まぐろ",
  "ささみ",
  "かつお",
  "さけ",
  "かにかま",
  "かぼちゃ"
];

const FOOD_AREA_ANSWER = {
  tete: "まぐろ",
  mona: "ささみ",
  milk: "かつお",
  sora: "かぼちゃ"
};

const FOOD_AREA_CAT_KEYS = [
  "tete",
  "mona",
  "milk",
  "sora"
];


// ---------------------------------------------------------
// 餌ごとのoverlay画像
// assets/ 内に配置済み
// ---------------------------------------------------------

const FOOD_AREA_IMAGES = {
  "まぐろ": "food_select_maguro.png",
  "ささみ": "food_select_sasami.png",
  "かつお": "food_select_katsuo.png",
  "さけ": "food_select_salmon.png",
  "かにかま": "food_select_kanikama.png",
  "かぼちゃ": "food_select_kabocha.png"
};


// ---------------------------------------------------------
// 白い四角の位置
// ---------------------------------------------------------

const FOOD_AREA_DISPLAY_RECTS = {
  tete: { x: 0.1180, y: 0.6245, w: 0.1454, h: 0.0926 },
  mona: { x: 0.3015, y: 0.6245, w: 0.1440, h: 0.0926 },
  milk: { x: 0.4951, y: 0.6245, w: 0.1411, h: 0.0926 },
  sora: { x: 0.6921, y: 0.6245, w: 0.1493, h: 0.0926 },
};


// ---------------------------------------------------------
// 一番下の選択ボタンHotspot
// ---------------------------------------------------------

const FOOD_AREA_BUTTON_RECTS = {
  tete: { x: 0.1166, y: 0.7180, w: 0.1529, h: 0.0787 },
  mona: { x: 0.2978, y: 0.7115, w: 0.1580, h: 0.0883 },
  milk: { x: 0.4782, y: 0.7075, w: 0.1759, h: 0.0915 },
  sora: { x: 0.6815, y: 0.7076, w: 0.1745, h: 0.0912 },
};


// ---------------------------------------------------------
// 現在の餌から配列indexを取得
// ---------------------------------------------------------

function foodAreaValueToIndex(value) {

  if (value === null) {
    return -1;
  }

  return FOOD_AREA_CANS.indexOf(value);
}


// ---------------------------------------------------------
// 選択ボタン
// 1回押すごとに次の餌へ進む
// ---------------------------------------------------------

function foodAreaCycle(catKey, dir) {

  if (F("FLAG_FOOD_AREA_SOLVED")) {
    return;
  }

  const selections =
    state.puzzleInputs.foodSelections;

  const currentIdx =
    foodAreaValueToIndex(
      selections[catKey]
    );


  let nextIdx;

  // 初回だけは、進む・戻るともに
  // 選択肢の端から開始
  if (currentIdx === -1) {

    nextIdx =
      dir > 0
        ? 0
        : FOOD_AREA_CANS.length - 1;

  } else {

    nextIdx =
      (
        currentIdx +
        dir +
        FOOD_AREA_CANS.length
      ) %
      FOOD_AREA_CANS.length;
  }


  selections[catKey] =
    FOOD_AREA_CANS[nextIdx];


  const allCorrect =
    FOOD_AREA_CAT_KEYS.every(
      (key) =>
        selections[key] ===
        FOOD_AREA_ANSWER[key]
    );


  if (allCorrect) {

    setF(
      "FLAG_FOOD_AREA_SOLVED",
      true
    );

  } else {

    saveGame();
  }


  renderZoomScreen();
}

function splitFoodButtonRect(rect) {

  return {

    left: {
      x: rect.x,
      y: rect.y,
      w: rect.w / 2,
      h: rect.h
    },

    right: {
      x: rect.x + rect.w / 2,
      y: rect.y,
      w: rect.w / 2,
      h: rect.h
    }

  };
}

// ---------------------------------------------------------
// ごはん棚
// ---------------------------------------------------------

ZOOM_TARGETS.WALL2_FOOD_AREA = {

  getView() {

    const solved =
      F("FLAG_FOOD_AREA_SOLVED");

    const taken =
      F("FLAG_CAT_PLATE_TAKEN");


    // =====================================================
    // 未クリア
    // =====================================================

    if (!solved) {

      const layers = [
        "zoom_food_area.png"
      ];

      const hotspots = [];


      // ---------------------------------------------------
      // 現在選択中の餌画像を
      // 4匹それぞれの白い四角へ表示
      // ---------------------------------------------------

      FOOD_AREA_CAT_KEYS.forEach(
        (catKey) => {

          const selected =
            state.puzzleInputs
              .foodSelections[catKey];

          // 初期状態は白い四角を空欄にする
          if (selected === null) {
            return;
          }

          const imageFile =
            FOOD_AREA_IMAGES[selected];

          const displayRect =
            FOOD_AREA_DISPLAY_RECTS[
              catKey
            ];

          layers.push({
            src: imageFile,
            rect: displayRect
          });
        }
      );


      // ---------------------------------------------------
      // 画像内の選択ボタン4つ
      // ---------------------------------------------------

      FOOD_AREA_CAT_KEYS.forEach(
  (catKey) => {

    const buttonRects =
      splitFoodButtonRect(
        FOOD_AREA_BUTTON_RECTS[
          catKey
        ]
      );


    // 左側 = 1つ戻る
    hotspots.push({

      id:
        `wall2_food_area_${catKey}_prev`,

      rect:
        buttonRects.left,

      onTap: () =>
        foodAreaCycle(
          catKey,
          -1
        )
    });


    // 右側 = 1つ進む
    hotspots.push({

      id:
        `wall2_food_area_${catKey}_next`,

      rect:
        buttonRects.right,

      onTap: () =>
        foodAreaCycle(
          catKey,
          1
        )
    });

  }
);


      return {
        layers,
        hotspots
      };
    }


    // =====================================================
    // 謎クリア後
    // =====================================================

    const layers = [
      "zoom_food_area_open.png"
    ];

    const hotspots = [];


    // -----------------------------------------------------
    // 穴あきプレート未取得
    // -----------------------------------------------------

    if (!taken) {

      // 背景不透明だった旧overlayは使わない。
      // 透過済み item_cat_plate.png を利用。
      const plateRect = {
        x: 0.29,
        y: 0.80,
        w: 0.42,
        h: 0.12
      };


      layers.push({
        src: "item_cat_plate.png",
        rect: plateRect
      });


      hotspots.push({

        id:
          "wall2_food_area_plate_overlay",

        rect: {
          x: 0.27,
          y: 0.78,
          w: 0.46,
          h: 0.16
        },

        onTap:
          onFoodAreaPlateTap
      });
    }


    return {
      layers,
      hotspots
    };
  }
};


// ---------------------------------------------------------
// 穴あきプレート取得
// ---------------------------------------------------------

function onFoodAreaPlateTap() {

  if (
    F("FLAG_CAT_PLATE_TAKEN")
  ) {
    return;
  }


  addItem(
    "ITEM_CAT_PLATE"
  );

  setF(
    "FLAG_CAT_PLATE_TAKEN",
    true
  );


  renderZoomScreen();
  renderInventory();
}
// ---------------------------------------------------------
// おもちゃカゴ (9.4)
// FLAG_TOY_BOX_OPENは使用しない。ロック等は無く、最初から取得可能。
// ---------------------------------------------------------
ZOOM_TARGETS.WALL2_TOY_BASKET = {
  getView() {
    const taken = F("FLAG_TEASER_ROD_TAKEN");
    if (taken) {
      return { layers: ["zoom_toy_basket.png"], hotspots: [] };
    }
    const displayRect = { x: 0.3018, y: 0.3688, w: 0.3816, h: 0.2346 };
    return {
      layers: ["zoom_toy_basket.png", { src: "overlay_teaser_part_in_basket.png", rect: displayRect }],
      hotspots: [
        {
          id: "wall2_toy_basket_rod_overlay",
          rect: expandRect(displayRect),
          onTap: onToyBasketRodTap,
        },
      ],
    };
  },
};

function onToyBasketRodTap() {
  if (F("FLAG_TEASER_ROD_TAKEN")) return;
  addItem("ITEM_TEASER_ROD_PART");
  setF("FLAG_TEASER_ROD_TAKEN", true);
  renderZoomScreen();
  renderInventory();
}

// ---------------------------------------------------------
// MONA + ピンクのベッド (9.6)
// ---------------------------------------------------------
ZOOM_TARGETS.WALL2_MONA = {
  getView() {
    const moved = F("FLAG_MONA_MOVED");
    const keyTaken = F("FLAG_SMALL_KEY_TAKEN");

    if (!moved) {
      return {
        layers: [
          "zoom_mona_base.png",
          { src: "overlay_mona_zoom.png", rect: { x: 0.27, y: 0.52, w: 0.47, h: 0.29 } },
        ],
        hotspots: [
          {
            id: "wall2_mona_use_teaser_slot",
            rect: { x: 0.1801, y: 0.5354, w: 0.6767, h: 0.3156 },
            onTap: onMonaUseTeaserTap,
          },
        ],
      };
    }

    const layers = ["zoom_mona_moved_base.png"];
    const hotspots = [];
    if (!keyTaken) {
      const displayRect = { x: 0.3421, y: 0.4479, w: 0.3646, h: 0.1569 };
      layers.push({ src: "overlay_small_key_on_bed.png", rect: displayRect });
      hotspots.push({
        id: "wall2_mona_small_key_overlay",
        rect: expandRect(displayRect),
        onTap: onMonaSmallKeyTap,
      });
    }
    return { layers, hotspots };
  },
};

function onMonaUseTeaserTap() {
  if (F("FLAG_MONA_MOVED")) return;

  if (state.selectedItem === "ITEM_CAT_TEASER_COMPLETE") {
    setF("FLAG_MONA_MOVED", true);
    removeItem("ITEM_CAT_TEASER_COMPLETE");
    deselectItem();
    renderZoomScreen();
    renderInventory();
    renderWallOverlays(); // 壁上のMONA表示もこのタイミングで更新(次回GAME描画時にも反映される)
    return;
  }

  if (state.selectedItem === null) {
  showZoomMessage("MONAはこちらをじっと見ている。");
} else {
  showZoomMessage("MONAはそれには興味がないみたい。");
}
}

function onMonaSmallKeyTap() {
  if (F("FLAG_SMALL_KEY_TAKEN")) return;
  addItem("ITEM_SMALL_KEY");
  setF("FLAG_SMALL_KEY_TAKEN", true);
  renderZoomScreen();
  renderInventory();
}

// ---------------------------------------------------------
// キャットタワー (9.8)
// 正解順(変更禁止): TETE→MILK→MONA→SORA
// 実画像(zoom_cat_tower_buttons.png)では4ボタンは縦並びではなく横並び。
// 左から TETE / MONA / MILK / SORA の順に配置されているため、
// 正解入力の実際の操作順は「左端→3番目→2番目→右端」になる。
// ---------------------------------------------------------
const CAT_TOWER_ANSWER = ["TETE", "MILK", "MONA", "SORA"];
const CAT_TOWER_BUTTONS = [
  { catKey: "TETE", label: "高い場所" },
  { catKey: "MILK", label: "狭い場所" },
  { catKey: "MONA", label: "ふかふか" },
  { catKey: "SORA", label: "ボール" },
];
// 実画像上の横並び配置(STEP11.5-B): 左から TETE/MONA/MILK/SORA
const CAT_TOWER_BUTTON_RECTS = {
  TETE: { x: 0.0630, y: 0.4154, w: 0.2048, h: 0.1724 },
  MONA: { x: 0.2890, y: 0.4196, w: 0.1819, h: 0.1752 },
  MILK: { x: 0.5080, y: 0.4196, w: 0.1978, h: 0.1710 },
  SORA: { x: 0.7216, y: 0.4196, w: 0.1854, h: 0.1738 },
};

// ---------------------------------------------------------
// キャットタワーボタン：押し込み演出の位置調整
// x：プラスで右、マイナスで左
// y：プラスで下、マイナスで上
// ---------------------------------------------------------

const CAT_TOWER_BUTTON_PRESS_OFFSETS = {
  TETE: { x: -2, y: 0 },
  MONA: { x: -3, y: 0 },
  MILK: { x: -3, y: 0 },
  SORA: { x: 0, y: 0 },
};

// 「closed→ボタン表示」への切替は正式フラグではなく、
// タップして初めてボタン画像に切り替わる一時的な表示状態として扱う(セーブ対象外)。
const wall2UiState = {
  catTowerRevealed: false,
};

ZOOM_TARGETS.WALL2_CAT_TOWER = {
  getView() {

    const solved = F("FLAG_CAT_TOWER_SOLVED");
    const taken = F("FLAG_STAFF_CARD_B_TAKEN");


    // =====================================================
    // クリア後
    // =====================================================

    if (solved) {

      const layers = [
        "zoom_cat_tower_open.png"
      ];

      const hotspots = [];

      if (!taken) {

        const displayRect = {
          x: 0.47,
          y: 0.70,
          w: 0.25,
          h: 0.25
        };

        layers.push({
          src: "overlay_staff_card_piece_b.png",
          rect: displayRect
        });

        hotspots.push({
          id: "wall2_cat_tower_card_b_overlay",
          rect: expandRect(displayRect),
          onTap: onCatTowerCardBTap,
        });
      }

      return {
        layers,
        hotspots
      };
    }


    // =====================================================
    // 最初はキャットタワー全体
    // =====================================================

    if (!wall2UiState.catTowerRevealed) {

      return {
        layers: [
          "zoom_cat_tower_closed.png"
        ],

        hotspots: [
          {
            id: "wall2_cat_tower_reveal_slot",

            rect: {
              x: 0.2165,
              y: 0.6669,
              w: 0.6051,
              h: 0.2982
            },

            onTap: () => {
              wall2UiState.catTowerRevealed = true;
              renderZoomScreen();
            },
          },
        ],
      };
    }


    // =====================================================
    // 4猫ボタン表示
    // =====================================================

    const seq =
      state.puzzleInputs.catTowerSequence;


    const hotspots =
      CAT_TOWER_BUTTONS.map((btn) => {

        const catKey =
          btn.catKey;

        const pressed =
          seq.includes(catKey);


        return {
          id:
            `wall2_cat_tower_button_${catKey.toLowerCase()}`,

          rect:
            CAT_TOWER_BUTTON_RECTS[catKey],

          className:
            pressed
              ? "cat-tower-button cat-tower-button-pressed"
              : "cat-tower-button",

          pressOffset:
            CAT_TOWER_BUTTON_PRESS_OFFSETS[catKey],

          // 一度押したボタンは再度押せない
          onTap:
            pressed
              ? () => {}
              : () => onCatTowerButtonTap(catKey),
        };
      });


    return {
      layers: [
        "zoom_cat_tower_buttons.png"
      ],

      hotspots
    };
  },
};


// ---------------------------------------------------------
// キャットタワーボタン押下
// ---------------------------------------------------------

function onCatTowerButtonTap(catKey) {

  if (
    F("FLAG_CAT_TOWER_SOLVED")
  ) {
    return;
  }

  const seq =
    state.puzzleInputs.catTowerSequence;

  // すでに押しているボタンは無視
  if (seq.includes(catKey)) {
    return;
  }

  // 有効なボタン入力時だけ効果音
  playSE("button");

  // 押した順番を記録
  seq.push(catKey);

  saveGame();

  // 押し込み状態をすぐ表示
  renderZoomScreen();


  // -------------------------------------------------------
  // 4個全部押されるまでは判定しない
  // -------------------------------------------------------

  if (
    seq.length <
    CAT_TOWER_ANSWER.length
  ) {
    return;
  }


  // -------------------------------------------------------
  // 4個全部押された時点で初めて判定
  // -------------------------------------------------------

  const correct =
    seq.every(
      (value, index) =>
        value ===
        CAT_TOWER_ANSWER[index]
    );


  // =======================================================
  // 正解
  // =======================================================

  if (correct) {

    playSE("puzzle_correct");

    // 4つ全部押し込まれた状態を少し見せてからOPEN
    setTimeout(() => {

      setF(
        "FLAG_CAT_TOWER_SOLVED",
        true
      );

      state.puzzleInputs
        .catTowerSequence = [];

      wall2UiState
        .catTowerRevealed = false;

      saveGame();

      renderZoomScreen();

    }, 450);

    return;
  }


  // =======================================================
  // 不正解
  // =======================================================

  playSE("puzzle_wrong");

  // 4つ全部押し込まれた状態を見せてから一斉解除
  setTimeout(() => {

    state.puzzleInputs
      .catTowerSequence = [];

    saveGame();

    renderZoomScreen();

  }, 800);
}

function onCatTowerCardBTap() {
  if (F("FLAG_STAFF_CARD_B_TAKEN")) return;
  addItem("ITEM_STAFF_CARD_B");
  setF("FLAG_STAFF_CARD_B_TAKEN", true);
  renderZoomScreen();
  renderInventory();
}