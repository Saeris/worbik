<div align="center">

# 📰 Worbik

[![CI status][ci_badge]][ci]

A daily word puzzle, solved like a Rubik's Cube: rotate the rows and columns of a grid of letters until every row is a word.

**[Play at worbik.com][site]**

</div>

---

## 🎮 How to play

Each puzzle is a grid of words, one per row, scrambled by rotating its rows and columns. Rotate them back to find the words. Letters that are in the right place turn yellow and keep a reminder in their corner; a row turns green once its word is complete. Fewest moves wins, and there is always a solution.

There are sixteen puzzles a day, one for every size of board from 5×5 to 8×8, and a new day's puzzles arrive at 10:00 UTC for everyone at once. Past puzzles can still be played, but only the day's puzzle counts for its leaderboard.

Rotate a row or column by pressing the arrow beside it, by swiping across its tiles, or with the keyboard: the arrow keys move between tiles, and <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> rotate the column or row of the tile that has focus.

## 🏆 Leaderboards

Every size of board has its own ranked leaderboard for every day. To post a score, sign in with an [Atmosphere][atproto] account, the one used for Bluesky and other apps. Worbik has no accounts of its own: it asks the server that hosts the account for two things only, to say who the player is and to vouch for them when they submit a score. It can't read or write anything in the account.

A solve is posted as the whole game, which the server replays to check that it solves the puzzle, so a score is never only the player's word for it. A player's first solve of a puzzle is the one that counts, and signing in on another device opens the puzzles they have already solved as solved. A leaderboard takes scores for the day that its puzzle is the day's puzzle, plus an hour's grace.

## 🔥 Streaks

A signed-in player's profile shows their streak, their best streak, how many puzzles they have solved, a calendar of the days they played on, and their latest results. A day counts once any one of its puzzles is solved and posted. A streak that reached yesterday is still going, and ends once a whole day passes without a solve.

## 🔗 Sharing

A solve is shared as a link, `/s/<date>/<size>`, with the player's handle on the end once their score is on the leaderboard. Opening one starts today's puzzle of that size. Pasted anywhere that shows link previews, it shows a card with the puzzle's stamp and the player's score. The score on a card is always looked up, never taken from the link, so a link can't claim a score that wasn't posted. Neither the card nor the link gives away the solution or the target.

A puzzle's stamp is a mosaic in the shape of its board, whose color and pattern come from a hash of its scrambled letters, so it is the same for everyone who plays that puzzle.

## 🔧 Development

Worbik is a [Void][void] app that runs on Cloudflare Workers, built and checked with [Vite+][viteplus].

```sh
yarn install
echo "PUZZLE_SECRET=any-local-value" > .env
yarn dev
```

| Command       | Purpose                                    |
| ------------- | ------------------------------------------ |
| `yarn dev`    | Run the app locally on the Workers runtime |
| `yarn check`  | Format, lint, and typecheck                |
| `yarn test`   | Run the unit tests                         |
| `yarn build`  | Build for production                       |
| `yarn deploy` | Deploy to Cloudflare                       |

The dev server is served at `http://127.0.0.1:5173`, and the app moves itself there if it's opened at `localhost`. Signing in needs that: the protocol won't send a player back to `localhost`, and what a browser stores for one address isn't shared with the other.

### How puzzles are made

Each puzzle is derived on demand from its ID (its date and size) and the `PUZZLE_SECRET`, the first time it's asked for, and is then kept in Workers KV for good. Solutions never leave the server: the browser sends its guesses to `/api/check`, which answers with the letters that are in the right place.

### Puzzles that take one move

Set `PUZZLE_SCRAMBLE=1` in `.env` to have new puzzles scrambled with a single move. Puzzles that were already made are kept, so forget today's with `curl -X POST http://127.0.0.1:5173/api/dev/reset`, which also removes any local scores on them. The route only exists on the dev server.

### Reviewing the palette

While `yarn dev` is running, `/palette` shows a board with a tile in every state, in both color schemes, as it appears with typical vision, under each color vision deficiency, and in grayscale. It also shows tiles at every size, for checking that a tile's letter and its hint never touch. The page only exists in development. The same guarantees are enforced by `src/theme/__tests__/palette.spec.ts`, which reads the colors straight out of `src/theme/theme.css`.

### Icons and the site's card

While `yarn dev` is running, `/brand` draws the app's icons and the card that its pages show when linked to, in the game's own font and tile colors, each at the size of its file in `public/`. When the look of the game changes, save them again from there. `favicon.ico` holds the three smallest.

### The share card

The card is drawn without any image library, to stay within the ten milliseconds of processor time that a Worker gets on Cloudflare's free plan: flat shapes in sixteen colors, with letters that were drawn ahead of time. While `yarn dev` is running, `/glyphs` draws those letters from the game's font. Save what it shows as `src/server/card/glyphs.json` whenever the wording of the card or the font changes.

### Signing in

Signing in happens in the browser, with [atcute][atcute]. The server that hosts a player's account learns about Worbik from `/oauth/client-metadata.json`, which describes the app at whichever address it's served from, and the permission asked for names the three methods that the server vouches for the player to call: `com.worbik.submitScore`, `com.worbik.getSolves`, which brings a new device up to date, and `com.worbik.deleteAccount`. Adding to these makes anyone already signed in sign in again.

## 📜 Terms and privacy

The [Terms of Service][terms] and [Privacy Policy][privacy] are written in plain English, as Markdown in `src/pages/(legal)`, and are served at `/terms` and `/privacy`. The privacy policy says what Worbik stores and what the browser sends where, so it has to change along with those.

## 🚀 Deploying

Void deploys the app to a Cloudflare Worker, creating what it needs on the way: the KV namespace that holds puzzles and the D1 database that holds scores, with the migrations in `src/db/migrations` applied. Everything fits within the Workers Free plan.

1. Connect the project to the Cloudflare account, once: `yarn void connect --platform cloudflare`.
2. Set the production secret: `yarn void secret put PUZZLE_SECRET`. Use a long random value. Puzzles are derived from it, so changing it later changes every puzzle that hasn't been stored yet.
3. Deploy: `yarn void deploy`. The resources it creates are recorded in `void.lock.json`, which is committed.
4. Add the domain: `yarn void domain add worbik.com`. Cloudflare has to be the DNS provider for the zone, and creates the record and the certificate itself.

Signing in works at whichever address the app is served from. A player's sign-in is tied to the address they signed in at, so moving domains signs everyone out.

[ci_badge]: https://github.com/Saeris/worbik/actions/workflows/ci.yml/badge.svg
[ci]: https://github.com/Saeris/worbik/actions/workflows/ci.yml
[site]: https://worbik.com
[terms]: https://worbik.com/terms
[privacy]: https://worbik.com/privacy
[atproto]: https://atproto.com
[void]: https://void.cloud
[viteplus]: https://viteplus.dev/
[atcute]: https://github.com/mary-ext/atcute
