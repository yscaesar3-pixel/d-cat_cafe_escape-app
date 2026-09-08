(() => {
  const DEBUG_HOTSPOT_EDITOR = true;
  if (!DEBUG_HOTSPOT_EDITOR) return;

  let enabled = false;
  let dragStart = null;
  let activeRect = null;
  let selectionEl = null;

  // -----------------------------
  // パネル
  // -----------------------------
  const panel = document.createElement("div");
  panel.id = "hotspot-editor-panel";
  panel.innerHTML = `
    <div class="hotspot-editor-title">Hotspot調整</div>

    <button id="hotspot-editor-toggle" type="button">
      編集ON
    </button>

    <div id="hotspot-editor-output">
      ドラッグして範囲を選択
    </div>

    <button id="hotspot-editor-copy" type="button">
      Copy
    </button>
  `;

  document.body.appendChild(panel);

  const toggleBtn = panel.querySelector("#hotspot-editor-toggle");
  const output = panel.querySelector("#hotspot-editor-output");
  const copyBtn = panel.querySelector("#hotspot-editor-copy");

  function setEnabled(value) {
    enabled = value;

document.body.classList.add("hotspot-editor-visible");

document.body.classList.toggle(
  "hotspot-editor-enabled",
  enabled
);

toggleBtn.textContent = enabled ? "編集OFFにする" : "編集ONにする";

    if (!enabled && selectionEl) {
      selectionEl.remove();
      selectionEl = null;
    }
  }

  toggleBtn.addEventListener("click", () => {
    setEnabled(!enabled);
  });

  copyBtn.addEventListener("click", async () => {
    const text = output.dataset.rectText;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copied";

      setTimeout(() => {
        copyBtn.textContent = "Copy";
      }, 800);
    } catch (err) {
      console.warn("clipboard copy failed", err);
    }
  });

  // -----------------------------
  // 現在表示中の画像を探す
  // -----------------------------
  function isVisible(el) {
    if (!el) return false;

    const r = el.getBoundingClientRect();

    if (r.width <= 1 || r.height <= 1) {
      return false;
    }

    const style = getComputedStyle(el);

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  }

  function findActiveImageAtPoint(clientX, clientY) {
    const images = Array.from(document.querySelectorAll("img"));

    const candidates = images.filter((img) => {
      if (!isVisible(img)) return false;

      const r = img.getBoundingClientRect();

      return (
        clientX >= r.left &&
        clientX <= r.right &&
        clientY >= r.top &&
        clientY <= r.bottom
      );
    });

    if (candidates.length === 0) {
      return null;
    }

    // GAME / ZOOMの中央にある一番大きな画像を優先
    candidates.sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();

      return (
        rb.width * rb.height -
        ra.width * ra.height
      );
    });

    return candidates[0];
  }

  // -----------------------------
  // 座標
  // -----------------------------
  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function getPoint(e, rect) {
    return {
      x: clamp01(
        (e.clientX - rect.left) / rect.width
      ),
      y: clamp01(
        (e.clientY - rect.top) / rect.height
      ),
    };
  }

  // -----------------------------
  // 選択枠
  // body直下にfixed表示
  // -----------------------------
  function createSelection() {
    const el = document.createElement("div");
    el.className = "hotspot-editor-selection";
    el.style.position = "fixed";
    el.style.pointerEvents = "none";

    document.body.appendChild(el);

    return el;
  }

  function updateSelection(start, current, rect) {
    if (!selectionEl) return;

    const x = Math.min(start.x, current.x);
    const y = Math.min(start.y, current.y);
    const w = Math.abs(current.x - start.x);
    const h = Math.abs(current.y - start.y);

    selectionEl.style.left =
      `${rect.left + x * rect.width}px`;

    selectionEl.style.top =
      `${rect.top + y * rect.height}px`;

    selectionEl.style.width =
      `${w * rect.width}px`;

    selectionEl.style.height =
      `${h * rect.height}px`;
  }

  function finishSelection(start, end) {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);

    const text =
      `{ x: ${x.toFixed(4)}, ` +
      `y: ${y.toFixed(4)}, ` +
      `w: ${w.toFixed(4)}, ` +
      `h: ${h.toFixed(4)} }`;

    output.textContent = text;
    output.dataset.rectText = text;
  }

  // -----------------------------
  // Drag
  // -----------------------------
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!enabled) return;

      // editorパネル上ではドラッグ開始しない
      if (e.target.closest("#hotspot-editor-panel")) {
        return;
      }

      const img = findActiveImageAtPoint(
        e.clientX,
        e.clientY
      );

      if (!img) return;

      e.preventDefault();
      e.stopPropagation();

      activeRect = img.getBoundingClientRect();
      dragStart = getPoint(e, activeRect);

      if (selectionEl) {
        selectionEl.remove();
      }

      selectionEl = createSelection();

      updateSelection(
        dragStart,
        dragStart,
        activeRect
      );
    },
    true
  );

  document.addEventListener(
    "pointermove",
    (e) => {
      if (
        !enabled ||
        !dragStart ||
        !activeRect
      ) {
        return;
      }

      e.preventDefault();

      const current = getPoint(e, activeRect);

      updateSelection(
        dragStart,
        current,
        activeRect
      );
    },
    true
  );

  document.addEventListener(
    "pointerup",
    (e) => {
      if (
        !enabled ||
        !dragStart ||
        !activeRect
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const end = getPoint(e, activeRect);

      updateSelection(
        dragStart,
        end,
        activeRect
      );

      finishSelection(
        dragStart,
        end
      );

      dragStart = null;
      activeRect = null;
    },
    true
  );

  setEnabled(false);
})();