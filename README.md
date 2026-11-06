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

### Reviewing the palette

While `yarn dev` is running, `/palette` shows a board with a tile in every state, in both color schemes, as it appears with typical vision, under each color vision deficiency, and in grayscale. It also shows tiles at every size from 32px to 80px, for checking that a tile's letter and its hint never touch. The page only exists in development. The same guarantees are enforced by `src/theme/__tests__/palette.spec.ts`, which reads the colors straight out of `src/theme/theme.css`.

### How daily puzzles work

Each puzzle is derived on demand from its ID (the puzzle's date and size) and the `PUZZLE_SECRET`, the first time it is requested, and is then stored in Workers KV for good. A puzzle's leaderboard takes new scores for the day that it is the day's puzzle, plus an hour's grace. A new day's puzzles become available at 10:00 UTC. Solutions never leave the server: the browser sends its guesses to `/api/check`, which reports the letters that are in the right position.

Before the first deploy, set the production secret with `yarn void secret put PUZZLE_SECRET`.

### How signing in works

Worbik has no accounts of its own. A player signs in with their [Atmosphere](https://atproto.com) account, on the server that hosts it, and only to earn a place on a leaderboard: the game itself never asks. Worbik asks that server for two things: to say who the player is, and to vouch for them when they submit a score. It can't read or write anything in their account.

Signing in happens in the browser. The server that hosts the player's account learns about Worbik from `/oauth/client-metadata.json`, which describes the app at whichever address it is served from.

To sign in during development, run `yarn dev --host 127.0.0.1` and open the app at `http://127.0.0.1:5173`. The protocol doesn't allow a player to be sent back to `localhost`.
