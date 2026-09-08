/* =========================================================
   猫カフェからの脱出 - STEP5 wall3.js
   WALL_3限定の実装。WALL_4/STAFF ROOMはここに書かない。
   対象: Cat Profiles / 猫雑誌 / 本棚 / 猫型木箱 / 窓 / Milk's Spot /
         ソファ / ローテーブル / クッション / MILK

   クッション(zoom_floor_cushions.png)は探索用のみで謎化しない。
   MILKに移動イベントは追加しない(CHANGE-01: 移動状態変化があるのはMONAだけ)。
   CHANGE-01により、MILKの透過画像はoverlay_milk_window.png 1枚のみで、
   壁表示・ズーム表示の両方で(サイズ・位置を変えて)併用してよいとされているため、
   壁の常時overlayとズーム内overlayの両方で同じファイルを使う。
   ========================================================= */

// ---------------------------------------------------------
// 壁ステージのHotspot (WALL_3のみ)
// bg_wall_03.png (1122×1402) の実画像照合済み座標(STEP11.5-B)。
//
// 登録順(=DOM順=タップ優先順)に注意:
//   cushions → low_table の順で登録し、重複域ではlow_tableを優先。
//   low_table → cat_magazine の順で登録し、重複域ではcat_magazineを優先
//   (猫雑誌はローテーブル上に乗っているため)。
// ---------------------------------------------------------
WALL_HOTSPOTS.WALL_3 = [
  {
  id: "wall3_cat_profiles",
  rect: { x: 0.02, y: 0.03, w: 0.22, h: 0.28 },

  onTap: () => {
    openZoom("WALL3_CAT_PROFILES");

    setTimeout(() => {
      showZoomMessage("4匹の猫のプロフィールだ。名前や好きなものが書かれている。");
    }, 0);
  },
},
  {
  id: "wall3_bookshelf",
  rect: { x: 0.0100, y: 0.4140, w: 0.3408, h: 0.2289 },

  onTap: () => {
    openZoom("WALL3_BOOKSHELF");

    setTimeout(() => {
      showZoomMessage("本棚だ。猫に関する本や小物が並んでいる。");
    }, 0);
  },
},
  
  {
  id: "wall3_window",

  rect: { x: 0.3119, y: 0.0084, w: 0.3708, h: 0.4028 },

  onTap: () => {
    openZoom("WALL3_WINDOW");

    setTimeout(() => {
      showZoomMessage("大きな窓だ。窓辺にミルクがいる。");
    }, 0);
  },
},
 
  {
  id: "wall3_milk_spot",

  rect: { x: 0.7993, y: 0.0621, w: 0.1960, h: 0.2473 },

  onTap: () => {
    openZoom("WALL3_MILK_SPOT");

    setTimeout(() => {
      showZoomMessage("小物が壁に掛けられている。");
    }, 0);
  },
},
 {
  id: "wall3_sofa",

  rect: { x: 0.68, y: 0.32, w: 0.32, h: 0.30 },

  onTap: () => {
    openZoom("WALL3_SOFA");

    setTimeout(() => {
      showZoomMessage("猫たちがくつろぐためのソファだ。");
    }, 0);
  },
},
  {
  id: "wall3_cushions_left",

  rect: { x: 0.0012, y: 0.6669, w: 0.3496, h: 0.2629 },

  onTap: () => {
    openZoom("WALL3_CUSHIONS");

    setTimeout(() => {
      showZoomMessage("猫たちがくつろぐためのクッションが並んでいる。");
    }, 0);
  },
},

{
  id: "wall3_cushions_bottom",

  rect: { x: 0.3543, y: 0.7743, w: 0.3108, h: 0.2190 },

  onTap: () => {
    openZoom("WALL3_CUSHIONS");

    setTimeout(() => {
      showZoomMessage("猫たちがくつろぐためのクッションが並んでいる。");
    }, 0);
  },
},

{
  id: "wall3_cushions_right",

  rect: { x: 0.6545, y: 0.6358, w: 0.3455, h: 0.3575 },

  onTap: () => {
    openZoom("WALL3_CUSHIONS");

    setTimeout(() => {
      showZoomMessage("猫たちがくつろぐためのクッションが並んでいる。");
    }, 0);
  },
},
  {
  id: "wall3_low_table",

  rect: { x: 0.3526, y: 0.5878, w: 0.3020, h: 0.1851 },

  onTap: () => {
    openZoom("WALL3_LOW_TABLE");

    setTimeout(() => {
      showZoomMessage("低いテーブルだ。いくつか物が置かれている。");
    }, 0);
  },
},
  
];

// ---------------------------------------------------------
// 壁の常時表示overlay: MILK(移動なし、常時表示)
// ---------------------------------------------------------
WALL_OVERLAYS.WALL_3 = [
  {
    id: "wall3_milk_window",
    src: "overlay_milk_window.png",
    rect: { x: 0.42, y: 0.25, w: 0.2059, h: 0.1216 },
    visible: () => true,
  },
];

// ---------------------------------------------------------
// Cat Profiles / 猫雑誌 / 本棚 (探索・情報のみ。このSTEPではロジック化しない)
// ---------------------------------------------------------
ZOOM_TARGETS.WALL3_CAT_PROFILES = {
  getView() {
    return { layers: ["zoom_cat_profiles.png"], hotspots: [] };
  },
};

ZOOM_TARGETS.WALL3_CAT_MAGAZINE = {
  getView() {
    return { layers: ["zoom_cat_magazine.png"], hotspots: [] };
  },
};

ZOOM_TARGETS.WALL3_BOOKSHELF = {
  getView() {
    return {
      layers: ["zoom_bookshelf_wall3.png"],
      hotspots: [
        {
          id: "wall3_bookshelf_cat_box",
          rect: { x: 0.4896, y: 0.5939, w: 0.3326, h: 0.1909 },
          onTap: () => pushZoom("WALL3_CAT_BOX"),
        },
      ],
    };
  },
};

// ---------------------------------------------------------
// 猫型木箱 (9.17)
// ---------------------------------------------------------
ZOOM_TARGETS.WALL3_CAT_BOX = {
  getView() {
    const open = F("FLAG_CAT_BOX_OPEN");
    const taken = F("FLAG_SMALL_BRASS_KEY_TAKEN");

    if (!open) {
      return {
        layers: ["zoom_cat_box_closed.png"],
        hotspots: [
          {
            id: "wall3_cat_box_use_slot",
            rect: { x: 0.48, y: 0.43, w: 0.30, h: 0.24 },
            onTap: onCatBoxUseTap,
          },
        ],
      };
    }

    const layers = ["zoom_cat_box_open.png"];
    const hotspots = [];
    if (!taken) {
      const displayRect = { x: 0.57, y: 0.42, w: 0.21, h: 0.16 };
      layers.push({ src: "overlay_small_brass_key_in_cat_box.png", rect: displayRect });
      hotspots.push({
        id: "wall3_cat_box_key_overlay",
        rect: expandRect(displayRect),
        onTap: onCatBoxKeyTap,
      });
    }
    return { layers, hotspots };
  },
};

function onCatBoxUseTap() {
  if (F("FLAG_CAT_BOX_OPEN")) return;

  if (state.selectedItem === "ITEM_CAT_BOX_PLATE") {
    setF("FLAG_CAT_BOX_OPEN", true);
    removeItem("ITEM_CAT_BOX_PLATE");
    deselectItem();
    renderZoomScreen();
    renderInventory();
    return;
  }

 if (state.selectedItem === null) {
  showZoomMessage("中央に猫の形をしたくぼみがある。");
} else {
  showZoomMessage("それはくぼみには合わないみたい。");
}
}

function onCatBoxKeyTap() {
  if (F("FLAG_SMALL_BRASS_KEY_TAKEN")) return;
  addItem("ITEM_SMALL_BRASS_KEY");
  setF("FLAG_SMALL_BRASS_KEY_TAKEN", true);
  renderZoomScreen();
  renderInventory();
}

// ---------------------------------------------------------
// 窓 / Milk's Spot / ソファ / ローテーブル / クッション (すべて探索用のみ)
// ---------------------------------------------------------
ZOOM_TARGETS.WALL3_WINDOW = {
  getView() {
    return {
      layers: [
        "zoom_window_area.png",
        {
          src: "overlay_milk_window.png",
          rect: { x: 0.3256, y: 0.6263, w: 0.4480, h: 0.1786 },
        },
      ],
      hotspots: [],
    };
  },
};

ZOOM_TARGETS.WALL3_SOFA = {
  getView() {
    return { layers: ["zoom_sofa.png"], hotspots: [] };
  },
};

ZOOM_TARGETS.WALL3_LOW_TABLE = {
  getView() {
    return {
      layers: ["zoom_low_table.png"],
      hotspots: [
        {
          id: "wall3_low_table_cat_magazine",
          rect: { x: 0.0855, y: 0.3614, w: 0.6236, h: 0.3988 },
          onTap: () => pushZoom("WALL3_CAT_MAGAZINE"),
        },
      ],
    };
  },
};

// クッションは探索用のみ。謎にしない(ユーザー指示どおり)。
ZOOM_TARGETS.WALL3_CUSHIONS = {
  getView() {
    return { layers: ["zoom_floor_cushions.png"], hotspots: [] };
  },
};

// ---------------------------------------------------------
// MILK / Milk's Spot (WALL_3固定配置。移動イベントなし)
// MILK本体タップとMilk's Spotタップは同じズーム表示に統一する。
// zoom_window_area.png(窓そのもの)とは別扱い。
// ---------------------------------------------------------
ZOOM_TARGETS.WALL3_MILK = {
  getView() {
    // Milk's Spot(zoom_milk_spot.png)を土台にoverlay_milk_window.pngを重ねる。
    // CHANGE-01により、この画像は壁表示(WALL_OVERLAYS.WALL_3)と併用する前提。
    return {
      layers: [
        "zoom_milk_spot.png",
        { src: "overlay_milk_window.png", rect: { x: 0.18, y: 0.72, w: 0.55, h: 0.22 } },
      ],
      hotspots: [],
    };
  },
};

ZOOM_TARGETS.WALL3_MILK_SPOT = {
  getView() {
    return {
      layers: ["zoom_milk_spot.png"],
      hotspots: [],
    };
  },
};
