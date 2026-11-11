// Section 2: the order builder, the order card on the right, paying, and Mio peeking.
// mio.js (section 1) uses window.Kopi to describe drinks and to prefill her suggestion.
(() => {
  "use strict";

  const cfg = window.KOPI_CONFIG;
  const $ = (sel) => document.querySelector(sel);
  const money = (n) => `${cfg.currency} ${n.toFixed(2)}`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const MILK = {
    condensed: { lingo: "", plain: "condensed milk" },
    evaporated: { lingo: "C", plain: "evaporated milk" },
    none: { lingo: "O", plain: "no milk" },
  };
  const SUGAR = {
    none: { lingo: "Kosong", plain: "no sugar" },
    less: { lingo: "Siew Dai", plain: "less sugar" },
    normal: { lingo: "", plain: "normal sugar" },
    more: { lingo: "Ga Dai", plain: "extra sugar" },
  };
  const STRENGTH = {
    weak: { lingo: "Po", plain: "light" },
    normal: { lingo: "", plain: "" },
    strong: { lingo: "Gao", plain: "strong" },
  };
  const DEFAULTS = { milk: "condensed", sugar: "normal", strength: "normal", temp: "hot" };

  // A drink is { base, milk, sugar, strength, temp }; missing parts count as the defaults.
  function describe(partial) {
    const d = { ...DEFAULTS, ...partial };
    const base = cfg.bases.find((b) => b.id === d.base);
    const lingo = [
      base.lingo, MILK[d.milk].lingo, STRENGTH[d.strength].lingo, SUGAR[d.sugar].lingo,
      d.temp === "iced" ? "Peng" : "",
    ].filter(Boolean).join(" ");
    const plain = [
      base.plain, MILK[d.milk].plain, SUGAR[d.sugar].plain, STRENGTH[d.strength].plain,
      d.temp === "iced" ? "iced" : "hot",
    ].filter(Boolean).join(" · ");
    const price = base.price
      + (d.temp === "iced" ? cfg.icedExtra : 0)
      + (d.strength === "strong" ? cfg.strongExtra : 0);
    return { drink: d, lingo, plain, price };
  }

  // ── Builder ──
  const form = $("#builder");
  let qty = 1;

  $("#baseChips").innerHTML = cfg.bases.map((b) => `
    <label class="chip">
      <input type="radio" name="base" value="${b.id}">
      <span><b>${esc(b.lingo)}</b><small>${esc(b.plain)}</small><small>${money(b.price)}</small></span>
    </label>`).join("");

  function current() {
    const fd = new FormData(form);
    if (!fd.get("base")) return null;
    return Object.fromEntries(["base", "milk", "sugar", "strength", "temp"].map((k) => [k, fd.get(k)]));
  }

  function refresh() {
    // Condensed milk is already sweet: no "kosong" with it.
    const condensed = form.elements.milk.value === "condensed";
    const kosong = $("#kosongChip input");
    kosong.disabled = condensed;
    $("#sugarHint").style.visibility = condensed ? "visible" : "hidden";   // keeps its space either way
    if (condensed && kosong.checked) form.elements.sugar.value = "less";

    $("#qty").textContent = qty;
    const d = current();
    if (!d) {
      $("#lingoName").textContent = "Pick a drink";
      $("#plainName").innerHTML = "&nbsp;";
      $("#addPrice").textContent = "";
      $("#addBtn").disabled = true;
      return;
    }
    const info = describe(d);
    $("#lingoName").textContent = (qty > 1 ? `${qty} × ` : "") + info.lingo;
    $("#plainName").textContent = info.plain;
    $("#plainName").title = info.plain;   // full text on hover when it's cut off with "…"
    $("#addPrice").textContent = `· ${money(info.price * qty)}`;
    $("#addBtn").disabled = stage !== "order";
  }

  form.addEventListener("change", refresh);
  $("#qtyUp").addEventListener("click", () => { qty = Math.min(qty + 1, 20); refresh(); });
  $("#qtyDown").addEventListener("click", () => { qty = Math.max(qty - 1, 1); refresh(); });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = current();
    if (!d || stage !== "order") return;
    const info = describe(d);
    const same = tray.find((it) => it.lingo === info.lingo);
    if (same) same.qty += qty; else tray.push({ ...info, qty });
    peekSay(PEEK_LINES[Math.floor(Math.random() * PEEK_LINES.length)]);
    form.reset();
    qty = 1;
    refresh();
    render();
  });

  // Mio's suggestion from section 1 → fill in the builder and scroll here.
  function prefill(drink) {
    for (const [k, v] of Object.entries({ ...DEFAULTS, ...drink })) form.elements[k].value = v;
    qty = 1;
    refresh();
    $("#order").scrollIntoView({ behavior: "smooth" });
    form.classList.remove("flash");
    void form.offsetWidth;
    form.classList.add("flash");
    setTimeout(() => peekSay("…I filled it in for you."), 700);
  }

  // ── Summary card: order → pay → order card ──
  let tray = [];
  let stage = "order";
  const total = () => tray.reduce((s, it) => s + it.price * it.qty, 0);
  const count = () => tray.reduce((s, it) => s + it.qty, 0);

  function render() {
    const box = $("#summary");
    if (stage === "order") {
      box.innerHTML = tray.length ? `
        <h3>Your order · ${count()}</h3>
        <ul class="order-list">${tray.map((it, i) => `
          <li>
            <span class="q">${it.qty}×</span>
            <div class="info"><b>${esc(it.lingo)}</b><small>${esc(it.plain)} · ${money(it.price * it.qty)}</small></div>
            <button type="button" class="remove" data-remove="${i}" aria-label="Remove ${esc(it.lingo)}">×</button>
          </li>`).join("")}
        </ul>
        <div class="total"><span>Total</span><span>${money(total())}</span></div>
        <div class="btn-row"><button type="button" class="btn main" data-act="pay">Pay by QR</button></div>`
        : `<h3>Your order</h3><p class="empty">Nothing yet. Pick a drink and tap <b>Add</b>.</p>`;
    } else if (stage === "pay") {
      const qr = cfg.paymentQr
        ? `<img src="${esc(cfg.paymentQr)}" alt="Payment QR for ${esc(cfg.payee)}">`
        : demoQr();
      box.innerHTML = `
        <h3>Scan to pay</h3>
        <p class="pay-amount">${money(total())}</p>
        <div class="qr-box">${qr}</div>
        <p class="payee">${esc(cfg.payee)}</p>
        <div class="btn-row">
          <button type="button" class="btn quiet" data-act="back">Back</button>
          <button type="button" class="btn main" data-act="paid">I’ve paid</button>
        </div>`;
    } else {
      const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      box.innerHTML = `
        <p class="card-kicker">Show this to the counter</p>
        <p class="card-number">#${orderNo}</p>
        <ul class="card-drinks">${tray.map((it) => `
          <li><span class="big">${it.qty > 1 ? `${it.qty} × ` : ""}${esc(it.lingo)}</span><small>${esc(it.plain)}</small></li>`).join("")}
        </ul>
        <p class="card-meta">Paid by QR · ${money(total())} · ${time}</p>
        <div class="btn-row"><button type="button" class="btn" data-act="new">New order</button></div>`;
    }
    $("#addBtn").title = stage === "order" ? "" : "Finish this order first";
    refresh();
  }

  let orderNo = "00";
  $("#summary").addEventListener("click", (e) => {
    const rm = e.target.closest("[data-remove]");
    if (rm) { tray.splice(+rm.dataset.remove, 1); render(); return; }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "pay") { stage = "pay"; peekSay("…I won't look. promise."); }
    if (act === "back") stage = "order";
    if (act === "paid") {
      stage = "card";
      orderNo = String(nextOrderNo()).padStart(2, "0");
      peekSay("th-thank you… just show the number.");
    }
    if (act === "new") { stage = "order"; tray = []; }
    render();
    $("#summary").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  function nextOrderNo() {
    try {
      const n = (parseInt(localStorage.getItem("kopi-order-no"), 10) || 0) % 99 + 1;
      localStorage.setItem("kopi-order-no", String(n));
      return n;
    } catch {
      return Math.floor(Math.random() * 99) + 1;
    }
  }

  function demoQr() {
    // Decorative placeholder only — not scannable.
    const n = 25, c = 4;
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const finder = (x, y) => `
      <rect x="${x * c}" y="${y * c}" width="${7 * c}" height="${7 * c}"/>
      <rect x="${(x + 1) * c}" y="${(y + 1) * c}" width="${5 * c}" height="${5 * c}" fill="#fff"/>
      <rect x="${(x + 2) * c}" y="${(y + 2) * c}" width="${3 * c}" height="${3 * c}"/>`;
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    let cells = "";
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++)
        if (!inFinder(x, y) && rnd() > 0.5) cells += `<rect x="${x * c}" y="${y * c}" width="${c}" height="${c}"/>`;
    return `<svg viewBox="0 0 ${n * c} ${n * c}" aria-label="Demo QR code">${cells}
      ${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>
      <p class="qr-demo">Demo QR · set <code>paymentQr</code> in config.js</p>`;
  }

  // ── Mio peeking over the order card (only once assets/peek.jpg exists) ──
  const PEEK_LINES = ["…good choice.", "…noted.", "ooh. sedap.", "okay… got it."];
  const peek = $("#peek"), peekImg = $("#peekImg"), peekBubble = $("#peekBubble");
  peekImg.addEventListener("load", () => peek.classList.add("ready"));
  peekImg.addEventListener("error", () => peek.remove());
  peekImg.src = `${cfg.art.folder}peek${cfg.art.ext}`;

  // She rises when the order section scrolls into view.
  new IntersectionObserver(([e]) => peek.classList.toggle("up", e.isIntersecting), { threshold: 0.25 })
    .observe($("#order"));

  let peekTimer;
  function peekSay(text) {
    if (!peek.isConnected || !peek.classList.contains("ready")) return;
    peekBubble.textContent = text;
    peekBubble.classList.add("show");
    clearTimeout(peekTimer);
    peekTimer = setTimeout(() => peekBubble.classList.remove("show"), 2200);
  }

  $("#brand").textContent = cfg.shopName;
  document.title = cfg.shopName;
  refresh();
  render();

  window.Kopi = { cfg, describe, money, prefill };
})();
