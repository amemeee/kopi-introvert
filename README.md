# kopi-introvert

A kopi cart for shy people: order without talking.

- **Section 1, Mio:** the shy seller promotes the cart, in the same style as the portfolio hero. She talks in a speech bubble, and you reply with buttons: *What's good?* (she recommends a drink, and "I'll have that" fills it in below), *What is this place?*, *Teach me kopi lingo* (with a tiny quiz), *I want to order*. You can poke her.
- **Section 2, Order:** pick drink, milk, sugar, strength and hot/iced, set the quantity, and add as many drinks as you like. Then pay by QR and get an order card to show at the counter. Mio peeks over the order card once `assets/peek.jpg` exists.

Black-and-white manga style to match Mio's ink art. A portfolio project.

## Run it

Static files, no build step. Serve the folder (opening `index.html` directly mostly works too):

```sh
npx serve .
# or: python -m http.server
```

## Files

| File | What's in it |
|---|---|
| [mio.js](mio.js) | Section 1: Mio's lines and conversation (`STEPS`), poses, typing, pokes. **Edit her lines here.** |
| [app.js](app.js) | Section 2: drinks and lingo names, the order builder, order / QR / order card, peeking Mio |
| [config.js](config.js) | Shop name, currency, prices, payment QR, art folder |
| [styles.css](styles.css) | Black-and-white manga look |
| `assets/` | Mio's poses |

## Mio's art

Poses live in `assets/` as `<pose>.jpg`:
`idle`, `waiting`, `greet`, `ask`, `suggest`, `think`, `happy`, `flustered`, `serve`.

Blinking: add `<pose>-blink.jpg` (same image, eyes closed) and she'll blink in that pose automatically. Poses without one just don't blink. `happy` and `flustered` don't need one.

`peek.jpg` (optional, wide 2:1): her head and hands peeking over a table edge drawn at 75% height. She rises over the order card when you scroll to it, and comments when you add drinks.

Keep every pose at the same size and framing (1024×1024, white background) so swaps don't jump.

## Lingo cheat sheet

| Lingo | Means |
|---|---|
| Kopi / Teh | coffee / tea with condensed milk |
| C | evaporated milk + sugar |
| O | no milk |
| Kosong | no sugar |
| Siew Dai / Ga Dai | less / more sugar |
| Po / Gao | lighter / stronger |
| Peng | iced |
| Cham | coffee + tea |
