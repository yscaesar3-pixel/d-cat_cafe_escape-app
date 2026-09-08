/* =========================================================
   猫カフェからの脱出 - STEP3 flags.js
   flags読み書きの共通関数のみを扱う。
   個々のフラグの成立条件は各壁のファイル(wall1.js等)に書く。
   ========================================================= */

/** フラグが真であるかを返す。未設定時はfalse扱い。 */
function F(name) {
  return state.flags[name] === true;
}

/** フラグを設定する。デフォルトtrue。 */
function setF(name, value = true) {
  state.flags[name] = value;
  saveGame();
}
