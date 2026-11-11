// Section 1: Mio, the shy seller, promotes the cart. Same idea as the portfolio hero:
// poses, blinking, a typing speech bubble, reply buttons, pokes.
// ── Her lines are near the top. Edit freely. *stars* make a word bold. ──
(() => {
  "use strict";

  const K = window.Kopi;
  const ART = K.cfg.art;
  const POSES = ["idle", "waiting", "greet", "ask", "suggest", "think", "happy", "flustered", "serve"];

  const TYPE_MS = 26;       // per character while she "types"
  const AUTO_MS = 1500;     // pause after a line that continues by itself (plus reading time)
  const IDLE_MS = 20000;    // unanswered question → "take your time", then she goes idle

  const h = new Date().getHours();
  const HELLO =
    h < 5  ? "…oh. you're up late too? h-hi. I'm *Mio*." :
    h < 12 ? "…good morning. I'm *Mio*. welcome to *Kopi Introvert*." :
    h < 19 ? "…h-hi. I'm *Mio*. welcome to *Kopi Introvert*." :
             "…good evening. I'm *Mio*. still open, don't worry.";

  const MENU = [
    { label: "What's good?", go: "good" },
    { label: "What is this place?", go: "place" },
    { label: "Teach me kopi lingo", go: "lingo" },
    { label: "I want to order", go: "order", kind: "main" },
  ];

  // Each step: t = line, pose, then ONE of:
  //   next: step that follows by itself   options: reply buttons   go: "#section" to scroll to   end: stop talking
  const STEPS = {
    hello:   { t: HELLO, pose: "greet", next: "ask" },
    ask:     { t: "…what brings you here?", pose: "waiting", options: MENU },
    again:   { t: "anything else… you want to know?", pose: "waiting", options: MENU },

    // What is this place
    place:   { t: "it's a kopi cart… for people like us.", pose: "idle", next: "place2" },
    place2:  { t: "you don't have to talk. just tap what you want, pay by QR, and show your number.", pose: "ask", next: "place3" },
    place3:  { t: "no awkward \"uncle, kopi satu!\"… I promise.", pose: "happy", next: "again" },

    // Her recommendation: two quick questions
    good:    { t: "hmm… you like it sweet?", pose: "think",
               options: [{ label: "Yes, sweet", go: "goodSweet" }, { label: "Not really", go: "goodBitter" }] },
    goodSweet:  { t: "hot… or cold today?", pose: "think",
                  options: [{ label: "Hot", go: "sugHotSweet" }, { label: "Cold", go: "sugColdSweet" }] },
    goodBitter: { t: "hot… or cold today?", pose: "think",
                  options: [{ label: "Hot", go: "sugHotBitter" }, { label: "Cold", go: "sugColdBitter" }] },
    sugColdSweet:  { t: "then… *Teh Peng*. sweet and cold. boleh?", pose: "suggest",
                     drink: { base: "teh", temp: "iced" } },
    sugHotSweet:   { t: "then… a hot *Milo*. it's like a hug.", pose: "suggest",
                     drink: { base: "milo" } },
    sugColdBitter: { t: "then maybe… *Kopi C Siew Dai Peng*? …it's what I drink.", pose: "suggest",
                     drink: { base: "kopi", milk: "evaporated", sugar: "less", temp: "iced" } },
    sugHotBitter:  { t: "then… *Kopi O Kosong Gao*. very serious one.", pose: "suggest",
                     drink: { base: "kopi", milk: "none", sugar: "none", strength: "strong" } },
    take:    { t: "okay… I filled it in for you. just scroll down.", pose: "happy", go: "#order" },
    notThat: { t: "o-okay… maybe something else?", pose: "flustered", next: "again" },

    // Kopi lingo lesson + a tiny quiz
    lingo:   { t: "*Kopi* is coffee with condensed milk. *Teh* is tea.", pose: "ask", next: "lingo2" },
    lingo2:  { t: "add *O* for no milk… or *C* for evaporated milk.", pose: "ask", next: "lingo3" },
    lingo3:  { t: "*kosong* is no sugar. *siew dai*, less sugar. *ga dai*, more.", pose: "ask", next: "lingo4" },
    lingo4:  { t: "*gao* is strong. *po* is light. *peng*… is iced.", pose: "ask", next: "quiz" },
    quiz:    { t: "so… what is *Kopi O Kosong Peng*?", pose: "think",
               options: [
                 { label: "Iced black coffee, no sugar", go: "quizYes" },
                 { label: "Hot milk tea", go: "quizNo" },
                 { label: "Chocolate with ice", go: "quizNo" },
               ] },
    quizYes: { t: "c-correct! you're a natural…", pose: "happy", next: "again" },
    quizNo:  { t: "…not quite. it's iced black coffee, no sugar. it's okay, I got it wrong also last time.", pose: "flustered", next: "again" },

    order:   { t: "okay… the menu is right below.", pose: "happy", go: "#order" },

    // Back at the top after visiting the order section
    back:    { t: "…oh. you're back.", pose: "greet", next: "again" },
  };

  const POKES = ["eep—!", "…that tickles.", "p-please just order…", "s-stop lah…", "…I'm going to hide."];
  const IDLE_LINE = "…take your time. no rush.";

  // ── Plumbing ──
  const $ = (s) => document.querySelector(s);
  const mio = $("#mio"), img = $("#mioImg"), blinkImg = $("#mioBlink");
  const bubble = $("#bubble"), textEl = $("#bubbleText"), live = $("#bubbleLive"), choicesEl = $("#choices");
  const talkBtn = $("#talkBtn");
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const src = (pose, blink) => `${ART.folder}${pose}${blink ? "-blink" : ""}${ART.ext}`;
  const plain = (t) => t.replace(/\*/g, "");
  const rich = (t) => t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))
                       .replace(/\*(.+?)\*/g, "<em>$1</em>");

  POSES.forEach((p) => { new Image().src = src(p); });   // preload so swaps don't flicker

  let pose = null;
  function setPose(p) {
    if (p === pose) return;
    pose = p;
    mio.classList.remove("can-blink", "pop");
    void mio.offsetWidth;
    mio.classList.add("pop");
    img.src = src(p);
    blinkImg.src = src(p, true);
  }
  blinkImg.addEventListener("load", () => mio.classList.add("can-blink"));     // blink only if a -blink frame exists
  blinkImg.addEventListener("error", () => mio.classList.remove("can-blink"));
  if (!calm) (function blink() {
    mio.classList.add("blinking");
    setTimeout(() => mio.classList.remove("blinking"), 130);
    setTimeout(blink, 2500 + Math.random() * 3000);
  })();

  // ── Talking ──
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  let typeTimer = null, shown = { text: "", pose: "idle" };

  function type(text, done) {
    clearInterval(typeTimer);
    live.textContent = plain(text);
    const finish = () => {
      clearInterval(typeTimer);
      bubble.classList.remove("typing");
      textEl.innerHTML = rich(text);
      typeTimer = null;
      done && done();
    };
    if (calm) return finish();
    const flat = plain(text);
    let i = 0;
    bubble.classList.add("typing");
    textEl.textContent = "";
    typeTimer = setInterval(() => {
      textEl.textContent = flat.slice(0, ++i);
      if (i >= flat.length) finish();
    }, TYPE_MS);
    skipTyping = finish;
  }
  let skipTyping = null;
  bubble.addEventListener("click", (e) => {
    if (typeTimer && !e.target.closest(".choice")) skipTyping();
  });

  function play(id) {
    const s = STEPS[id];
    if (!s) return;
    clearTimers();
    resting = false;
    if (s.options || s.drink) lastAsk = id;   // "Talk to Mio" picks up from here
    talkBtn.hidden = true;
    choicesEl.innerHTML = "";
    bubble.classList.add("show");
    setPose(s.pose);
    shown = { text: s.t, pose: s.pose };
    type(s.t, () => {
      if (s.next) later(() => play(s.next), AUTO_MS + plain(s.t).length * 25);
      else if (s.options) offer(s.options);
      else if (s.drink) offerDrink(s.drink);
      else if (s.go) later(() => goTo(s.go), 900);
      else if (s.end) later(rest, 2500);
    });
  }

  function offer(options) {
    choicesEl.innerHTML = options.map((o, i) => `
      <button type="button" class="choice ${o.kind || ""}" data-i="${i}" style="animation-delay:${i * 50}ms">${rich(o.label)}</button>`).join("");
    choicesEl.onclick = (e) => {
      const b = e.target.closest(".choice");
      if (!b) return;
      const o = options[+b.dataset.i];
      choicesEl.onclick = null;
      if (o.act) o.act();
      play(o.go);
    };
    // Nobody answers: one gentle nudge, then she goes idle until someone talks to her
    later(() => {
      aside(IDLE_LINE, "waiting", 2600);
      later(rest, 2500);
    }, IDLE_MS);
  }

  function offerDrink(drink) {
    const info = K.describe(drink);
    offer([
      { label: `I'll have that · ${K.money(info.price)}`, kind: "main", go: "take", act: () => K.prefill(drink) },
      { label: "Something else", go: "notThat" },
    ]);
  }

  // Scroll to the order section; she rests until the visitor comes back up.
  function goTo(hash) {
    lastAsk = null;   // she finished; next time she asks "anything else?"
    document.querySelector(hash).scrollIntoView({ behavior: calm ? "auto" : "smooth" });
    later(rest, 1200);
  }

  function rest() {
    clearTimers();
    choicesEl.innerHTML = "";
    bubble.classList.remove("show");
    setPose("idle");
    talkBtn.hidden = false;
    resting = true;
  }
  let resting = false, lastAsk = null;
  talkBtn.addEventListener("click", () => play(lastAsk || "again"));

  // When the visitor scrolls back up to her after leaving, she notices.
  let leftHero = false;
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) { leftHero = true; return; }
    if (leftHero && resting) { leftHero = false; play("back"); }
  }, { threshold: 0.6 }).observe($("#hero"));

  // A quick aside (poke, idle nudge) that returns to what she was saying.
  let asideTimer;
  function aside(text, p, ms) {
    if (typeTimer) skipTyping();
    const back = shown;
    setPose(p);
    textEl.innerHTML = rich(text);
    live.textContent = plain(text);
    bubble.classList.add("show");
    clearTimeout(asideTimer);
    asideTimer = setTimeout(() => {
      if (resting) { bubble.classList.remove("show"); setPose("idle"); return; }
      setPose(back.pose);
      textEl.innerHTML = rich(back.text);
      live.textContent = plain(back.text);
    }, ms);
  }

  let pokes = 0;
  mio.addEventListener("click", () => aside(POKES[Math.min(pokes++, POKES.length - 1)], "flustered", 1800));

  setPose("idle");
  later(() => play("hello"), calm ? 0 : 900);
})();
