/* =========================================================
   猫カフェからの脱出 - STEP2 items.js
   10章(アイテム定義) / 12章(アイテム組み合わせ) を基準にした
   item定義とcombinationテーブルのみを扱う。
   ここには取得/削除/選択のロジックは書かない(inventory.jsで扱う)。
   ========================================================= */

/**
 * 表示名はFINAL_v2仕様書に明記が無いため、UI確認用にClaude側で付与した仮称。
 * ゲームロジック(id/file/合成関係)には一切影響しない。
 * 正式なテキストが決まったらnameだけ差し替えればよい。
 */
const ITEM_DEFS = {
  ITEM_CAT_PLATE: {
    file: "item_cat_plate.png",
    name: "穴あきプレート",
  },
  ITEM_TEASER_ROD_PART: {
    file: "item_teaser_rod_part.png",
    name: "猫じゃらし（棒側）",
  },
  ITEM_TEASER_FEATHER_PART: {
    file: "item_teaser_feather_part.png",
    name: "猫じゃらし（羽根側）",
  },
  ITEM_CAT_TEASER_COMPLETE: {
    file: "item_cat_teaser_complete.png",
    name: "猫じゃらし",
  },
  ITEM_SMALL_KEY: {
    file: "item_small_key.png",
    name: "小さな鍵",
  },
  ITEM_STAFF_CARD_A: {
    file: "item_staff_card_piece_a.png",
    name: "スタッフカード（左側）",
  },
  ITEM_STAFF_CARD_B: {
    file: "item_staff_card_piece_b.png",
    name: "スタッフカード（右側）",
  },
  ITEM_STAFF_CARD_REPAIRED: {
    file: "item_staff_card_repaired.png",
    name: "修復済みスタッフカード",
  },
  ITEM_UV_LIGHT: {
    file: "item_uv_light.png",
    name: "UVライト",
  },
  ITEM_GREEN_TAG: {
    file: "item_key_tag_green.png",
    name: "緑のキータグ",
  },
  ITEM_MONA_LOCKER_KEY: {
    file: "item_mona_locker_key.png",
    name: "名前なしロッカーキー",
  },
  ITEM_CAT_BOX_PLATE: {
    file: "item_cat_box_plate.png",
    name: "猫型木製プレート",
  },
  ITEM_SMALL_BRASS_KEY: {
    file: "item_small_brass_key.png",
    name: "小さな真鍮の鍵",
  },
  ITEM_ENTRANCE_KEY: {
    file: "item_entrance_key.png",
    name: "玄関の鍵",
  },
};

// --- 12章 アイテム組み合わせ ---
const COMBINATIONS = [
  {
    pair: ["ITEM_TEASER_ROD_PART", "ITEM_TEASER_FEATHER_PART"],
    result: "ITEM_CAT_TEASER_COMPLETE",
  },
  {
    pair: ["ITEM_STAFF_CARD_A", "ITEM_STAFF_CARD_B"],
    result: "ITEM_STAFF_CARD_REPAIRED",
  },
];

/**
 * idA/idBの組み合わせに一致するcombinationを返す(順不同)。無ければnull。
 */
function findCombination(idA, idB) {
  return (
    COMBINATIONS.find(
      (c) =>
        (c.pair[0] === idA && c.pair[1] === idB) ||
        (c.pair[0] === idB && c.pair[1] === idA)
    ) || null
  );
}
