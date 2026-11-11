// Cart settings. Edit this file — no build step needed.
window.KOPI_CONFIG = {
  shopName: "Kopi Introvert",
  currency: "RM",

  // Path or URL to a DuitNow / PayNow / bank QR image, e.g. "assets/qr.png".
  // Leave empty to show a demo placeholder.
  paymentQr: "",
  payee: "Kopi Introvert",

  // Base drinks and prices.
  bases: [
    // color = how dark the drink looks in the cup (greyscale, to match the ink art)
    { id: "kopi", lingo: "Kopi", plain: "Coffee", price: 1.8, color: "#141414" },
    { id: "teh", lingo: "Teh", plain: "Tea", price: 1.8, color: "#4a4a4a" },
    { id: "milo", lingo: "Milo", plain: "Chocolate malt", price: 2.5, color: "#2e2e2e" },
    { id: "cham", lingo: "Cham", plain: "Coffee + tea", price: 2.0, color: "#262626" },
  ],

  // Surcharges.
  icedExtra: 0.5,
  strongExtra: 0.2,

  // Mio's art: <folder><pose><ext>, blink frames as <pose>-blink<ext>.
  // Her lines and the conversation live in mio.js.
  art: { folder: "assets/", ext: ".jpg" },
};
