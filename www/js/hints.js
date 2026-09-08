/* =========================================================
   猫カフェからの脱出 - STEP12-B hints.js
   現在の進行状況(flags/inventory)から「次にやること」ヒントを1つ返す。
   複雑な謎別3段階ヒントは実装しない。答え(3214/4681等)は直接表示しない。
   ========================================================= */

/**
 * リワード広告で実際に報酬を獲得できた時だけ呼ばれる(STEP12-C, ads.js経由)。
 * ここでusedHintCountを加算し、HINT画面を表示する。
 * 広告失敗/途中離脱時はこの関数自体が呼ばれない。
 */
function grantHintReward() {
  state.usedHintCount = (state.usedHintCount || 0) + 1;
  saveGame();
  showScreen(SCREEN.HINT, { rememberPrevious: true });
}

/**
 * 現在の状態から表示すべきヒント文を1つ返す。
 * 上から順に判定し、最初に条件へ合致したものを返す(優先度付き決定木)。
 */
function getCurrentHint() {
  // --- ごはん棚〜黒板〜猫アイコン収納 ---
  if (!F("FLAG_FOOD_AREA_SOLVED")) {
    return "猫たちの好物が分かる場所を探してみよう。";
  }
  if (!F("FLAG_CAT_PLATE_TAKEN")) {
    return "ごはん棚で見つけたものを受け取ろう。";
  }
  if (!F("FLAG_CAT_PLATE_USED_ON_BOARD")) {
    return "穴あきプレートを使えそうな場所がないかな？";
  }
  if (!F("FLAG_CAT_LOCKER_SOLVED")) {
    return "黒板で分かった数字と、収納の4つのマークを見比べてみよう。";
  }
  if (!F("FLAG_TEASER_FEATHER_TAKEN")) {
    return "収納の中にあるものを受け取ろう。";
  }

  // --- 猫じゃらし合成 ---
  if (!hasItem("ITEM_CAT_TEASER_COMPLETE")) {
    if (!hasItem("ITEM_TEASER_ROD_PART")) {
      return "もう片方の猫じゃらしの部品を探してみよう。";
    }
    if (hasItem("ITEM_TEASER_ROD_PART") && hasItem("ITEM_TEASER_FEATHER_PART")) {
      return "手に入れた猫じゃらしの部品を組み合わせてみよう。";
    }
  }

  // --- MONA〜小さな鍵〜小引き出し ---
  if (!F("FLAG_MONA_MOVED")) {
    return "モナが興味を持ちそうなおもちゃを使ってみよう。";
  }
  if (!F("FLAG_SMALL_KEY_TAKEN")) {
    return "モナが動いた場所を確認しよう。";
  }
  if (!F("FLAG_SMALL_DRAWER_UNLOCKED")) {
    return "小さな鍵が使えそうな場所を探そう。";
  }
  if (!F("FLAG_STAFF_CARD_A_TAKEN")) {
    return "引き出しの中を確認しよう。";
  }

  // --- スタッフカード合成〜スタッフ扉 ---
  if (!hasItem("ITEM_STAFF_CARD_REPAIRED")) {
    if (!F("FLAG_CAT_TOWER_SOLVED")) {
      return "スタッフカードのもう片方を探そう。";
    }
    if (!F("FLAG_STAFF_CARD_B_TAKEN")) {
      return "キャットタワーの中を確認しよう。";
    }
    if (hasItem("ITEM_STAFF_CARD_A") && hasItem("ITEM_STAFF_CARD_B")) {
      return "2枚のカードを組み合わせてみよう。";
    }
  }
  if (!F("FLAG_STAFF_DOOR_UNLOCKED")) {
    return "修復したスタッフカードと、店内の情報を使って扉を開けよう。";
  }

  // --- HEALTH CHECK〜UV〜KEY BOX ---
  if (!F("FLAG_HEALTH_CHECK_SOLVED")) {
    return "健康管理表の体重を軽い順に並べてみよう。";
  }
  if (!F("FLAG_UV_LIGHT_TAKEN")) {
    return "ケースの中を確認しよう。";
  }
  if (!F("FLAG_FAMILY_PHOTO_UV_REVEALED")) {
    return "手に入れたUVライトを使えそうな写真はないかな？";
  }
  if (!F("FLAG_KEY_BOX_SOLVED")) {
    return "UVで見えた数字を、体重の軽い順で読んでみよう。";
  }
  if (!F("FLAG_GREEN_TAG_TAKEN")) {
    return "KEY BOXの中を確認しよう。";
  }

  // --- 緑キャリー〜MONAロッカー〜猫型木箱 ---
  if (!F("FLAG_GREEN_CARRIER_OPEN")) {
    return "緑のキータグと同じ色の場所を探そう。";
  }
  if (!F("FLAG_MONA_LOCKER_KEY_TAKEN")) {
    return "キャリーの中を確認しよう。";
  }
  if (!F("FLAG_MONA_LOCKER_OPEN")) {
    return "キャリーの中にあった物が、どの猫の物か考えてみよう。";
  }
  if (!F("FLAG_CAT_BOX_PLATE_TAKEN")) {
    return "ロッカーの中を確認しよう。";
  }
  if (!F("FLAG_CAT_BOX_OPEN")) {
    return "ロッカーで手に入れたプレートが合いそうな場所を探そう。";
  }

  // --- 真鍮鍵〜デスク〜スタッフメモ ---
  if (!F("FLAG_SMALL_BRASS_KEY_TAKEN")) {
    return "木箱の中を確認しよう。";
  }
  if (!F("FLAG_DESK_DRAWER_OPEN")) {
    return "小さな真鍮の鍵が使えそうな引き出しを探そう。";
  }
  if (!F("FLAG_STAFF_NOTE_READ")) {
    return "開いた引き出しの中をよく確認しよう。";
  }

  // --- 緑ラグ〜玄関鍵〜CLEAR ---
  if (!F("FLAG_PLAY_AREA_RUG_REVEALED")) {
    return "スタッフメモの内容を思い出して、遊び場を調べよう。";
  }
  if (!F("FLAG_ENTRANCE_KEY_TAKEN")) {
    return "めくれたラグの下を確認しよう。";
  }
  if (!F("FLAG_ENTRANCE_KEY_USED")) {
    return "玄関へ戻って鍵を使おう。";
  }

  // 通常ここには到達しない(到達済みならCLEARSEQへ進んでいるはず)。
  return "あと少し！店内をもう一度見てみよう。";
}
