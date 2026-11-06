# Worbik

**Genre**: Casual, Puzzle
**Platforms**: Web, Mobile
**Number of Players**: Single Player

## Gameplay

Each game consists of a randomly generated set of words that are scrambled and must be unscrambled similar to solving a Rubik's Cube. Words can be of variable length, but all words in a set will be of the same length. Sets can also be of variable length. For example, one game could have a grid of four 5-letter words, and another could have a grid of five 7-letter words. The range for both word length and set length is between 4 and 7 (to accomodate for reasonable touch input sizing on mobile devices).

Players must rotate the rows and columns of this grid to rearrange the letters and find the puzzle's solution. Scoring is measured by the number of moves the player made to solve the puzzle, with the least amount of moves to find a solution being the best score. This means each puzzle has perfect score that players can reach. There is also a `target` score, which is the number of moves used to initially scramble the grid, which may be higher than a perfect score. Like a Rubik's cube, there is no lose condition, and there is always a solution, so players may make any number of moves necessary to reach a solution.

During gameplay, when a letter is in the correct position, that status is reflected in the game's interface, hinting to the player what the words in each row are and how close they are to solving the puzzle.

Upon winning, players are given the option to share their score on social media. Optionally, if they have an account and are logged in, they can place on a daily global leader board and their score + completion status will be logged to their play history.

## Input Methods

1. Click controls (current implementation)
1. Keyboard (WASD rotates current column/row + Up/Left/Down/Right control focus in grid)
1. Gamepad (D-pad controls focus in grid + A/B/X/Y rotates current column/row)
1. Touch (Swipe to rotate a column or row)

## Development

Worbik is a [Void](https://void.cloud) app that runs on Cloudflare Workers, built and checked with [Vite+](https://viteplus.dev).

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

### Testing with puzzles that take one move

Set `PUZZLE_SCRAMBLE=1` in `.env` to have new puzzles scrambled with a single move. Puzzles that were already made are kept, so forget today's with `curl -X POST http://127.0.0.1:5173/api/dev/reset`, which also removes any local scores on them, and clear the site's storage in the browser, which otherwise restores its saved game of the old puzzle. The route only exists on the dev server.

### Reviewing the palette

While `yarn dev` is running, `/palette` shows a board with a tile in every state, in both color schemes, as it appears with typical vision, under each color vision deficiency, and in grayscale. It also shows tiles at every size from 32px to 80px, for checking that a tile's letter and its hint never touch. The page only exists in development. The same guarantees are enforced by `src/theme/__tests__/palette.spec.ts`, which reads the colors straight out of `src/theme/theme.css`.

### How daily puzzles work

Each puzzle is derived on demand from its ID (the puzzle's date and size) and the `PUZZLE_SECRET`, the first time it is requested, and is then stored in Workers KV for good. A puzzle's leaderboard takes new scores for the day that it is the day's puzzle, plus an hour's grace. A new day's puzzles become available at 10:00 UTC. Solutions never leave the server: the browser sends its guesses to `/api/check`, which reports the letters that are in the right position.

Before the first deploy, set the production secret with `yarn void secret put PUZZLE_SECRET`.

### How streaks work

A player's profile is made of the scores that they have posted, so only a player who has signed in has one. A day counts towards a streak once any one of its puzzles is solved and posted. A streak that reached yesterday is still going, and ends once a whole day passes without a solve. A day is a puzzle's day, which begins at 10:00 UTC for everyone.

### How sharing works

A solve is shared as a link: `/s/<date>/<size>`, with the player's handle on the end once their score is on the leaderboard. Opening one starts the puzzle of that size that is being played today. Pasting one shows a card, drawn by `/api/card`, with the puzzle's stamp and the player's score. The score on a card is always looked up, never taken from the link, so a link can't claim a score that wasn't posted. Neither the card nor the link gives away the solution or the target.

A puzzle's stamp is a mosaic in the shape of its board, whose color and pattern come from a hash of its scrambled letters. It is the same for everyone who plays that puzzle.

The card is drawn without any image library, to stay within the ten milliseconds of processor time that a Worker gets on Cloudflare's free plan: flat shapes in sixteen colors, with letters that were drawn ahead of time. While `yarn dev` is running, `/glyphs` draws those letters from the game's font. Save what it shows as `src/server/card/glyphs.json` whenever the wording of the card or the font changes.

### How signing in works

Worbik has no accounts of its own. A player signs in with their [Atmosphere](https://atproto.com) account, on the server that hosts it, and only to earn a place on a leaderboard: the game itself never asks. Worbik asks that server for two things: to say who the player is, and to vouch for them when they submit a score. It can't read or write anything in their account.

Signing in happens in the browser. The server that hosts the player's account learns about Worbik from `/oauth/client-metadata.json`, which describes the app at whichever address it is served from.

During development the app is served at `http://127.0.0.1:5173`, and moves itself there if it's opened at `localhost`. The protocol doesn't allow a player to be sent back to `localhost` after signing in, and what a browser stores for one address isn't shared with the other.
