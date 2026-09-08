/* =========================================================
   猫カフェからの脱出 - STEP2 inventory.js
   inventoryへのadd/remove/所持判定/選択、および合成のみを扱う。
   「取得元(どの謎で得るか)」「消費先(どこで使うか)」の接続は後続STEPで行う。
   ========================================================= */

/**
 * item所持判定。
 */
function hasItem(id) {
  return state.inventory.includes(id);
}

/**
 * itemをinventoryへ追加する。
 * 未定義idや既に所持しているidは無視する(重複追加しない)。
 * ここではitem所持そのものによる自動変化は一切起こさない。
 */
function addItem(id) {
  if (!ITEM_DEFS[id]) {
    console.warn("[inventory] 未定義のitem id:", id);
    return;
  }

  if (hasItem(id)) return;

  state.inventory.push(id);

  // アイテム取得・合成完成時の共通SE
  playSE("item_get");

  saveGame();
}

/**
 * itemをinventoryから削除する。選択中だった場合は選択も解除する。
 */
function removeItem(id) {
  const idx = state.inventory.indexOf(id);
  if (idx === -1) return;
  state.inventory.splice(idx, 1);
  if (state.selectedItem === id) {
    state.selectedItem = null;
  }
  saveGame();
}

function selectItem(id) {
  state.selectedItem = id;
  saveGame();
}

function deselectItem() {
  state.selectedItem = null;
  saveGame();
}

/**
 * inventory内のitemがタップされた時の共通処理(23章)。
 *
 * - 何も選択していない状態でタップ → そのitemを選択する。
 * - 選択中と同じitemを再タップ → ITEMDETAILを開く(23章の明文規定)。
 * - 選択中と異なるitemをタップし、その2つがcombination対象なら合成する。
 *   (合成のトリガー方法はFINAL_v2に明記が無いため、
 *    「選択中item→合成相手をタップ」という一般的な操作をClaude側で採用した。
 *    別方式が正式ならここだけ差し替えれば良い。)
 * - 選択中と異なり、合成対象でもないitemをタップ → 選択をそちらへ切り替える。
 */
function onItemTap(id) {
  if (!hasItem(id)) return;

  if (state.selectedItem === id) {
    showItemDetail(id);
    return;
  }

  if (state.selectedItem !== null) {
    const combo = findCombination(state.selectedItem, id);
    if (combo) {
      const usedA = state.selectedItem;
      const usedB = id;
      removeItem(usedA);
      removeItem(usedB);
      addItem(combo.result);
      deselectItem();
      renderInventory();
      return;
    }
  }

  selectItem(id);
  renderInventory();
}
