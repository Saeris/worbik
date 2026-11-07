import "#theme/theme.css";
import "#theme/global.css";
import { http, HttpResponse } from "msw";
import { page, userEvent } from "vite-plus/test/browser";
import { render } from "vitest-browser-react";
import { getPlayer, setPlayer } from "#auth/player";
import { PuzzleState, type Challenge, type PuzzleStateInit } from "#state";
import { body, serveGame } from "#test/game";
import { network } from "#test/network";
import { Router } from "#test/router";
import { signInAs } from "#test/session";
import { getPuzzleID } from "#utils/getPuzzleID";
import { Game } from "../Game";

/**
 * The whole game, played the way that a player plays it, with real clicks and
 * keys on a real board, in the game's own styles. The menu and the drawer are
 * all real too, and moves are checked by the real server's code. Only the
 * network between the two is stood in for.
 */

const puzzle = getPuzzleID();
const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const solution = `abcdefghijklmnopqrstuvwxy`;
/** The solution with its first two rows each rotated one place to the right */
const start = `eabcdjfghiklmnopqrstuvwxy`;
const challenge: Challenge = [2, start, solution];
const init: PuzzleStateInit = [5, PuzzleState.compare(start, solution), 2];

describe(`game`, () => {
  const arrow = (name: string): ReturnType<typeof page.getByRole> =>
    page.getByRole(`button`, { name });
  const notice = arrow(`Your sign-in has run out. Sign in again`);
  const result = page.getByRole(`region`, { name: `Result` });

  const open = async (): ReturnType<typeof render> =>
    render(
      <Router>
        <Game puzzleID={puzzle} init={init} />
      </Router>
    );

  const press = async (name: string): Promise<void> => {
    await arrow(name).click();
  };

  /** The letters on the board, row by row */
  const letters = (): string =>
    [...document.querySelectorAll(`[data-row]`)]
      .map((tile) => tile.querySelector(`span`)?.textContent)
      .join(``)
      .toLowerCase();

  /** The line that says how the player is getting on, which goes when the puzzle is solved */
  const status = (): string =>
    document.querySelector(`main > p`)?.textContent ?? ``;

  const tile = (row: number, column: number): Element | null =>
    document.querySelector(`[data-row="${row}"][data-column="${column}"]`);

  const says = async (words: string): Promise<void> => {
    await expect.element(body).toMatchTextContent(words);
  };

  const solve = async (): Promise<void> => {
    await press(`Rotate row 1 left`);
    await press(`Rotate row 2 left`);
    await expect.element(result).toBeVisible();
  };

  beforeEach(() => {
    vi.spyOn(console, `error`).mockImplementation(() => {});
    serveGame(puzzle, challenge);
  });

  describe(`playing`, () => {
    it(`shows the puzzle as it was scrambled`, async () => {
      await open();

      expect(letters()).toBe(start);
      expect(status()).toBe(`0 moves`);
    });

    it(`rotates a row, and counts the move`, async () => {
      await open();
      await press(`Rotate row 1 left`);

      await expect.poll(status).toBe(`1 move`);
      expect(letters().slice(0, 5)).toBe(`abcde`);
    });

    it(`rotates a column`, async () => {
      await open();
      await press(`Rotate column 1 down`);

      await expect.poll(() => letters()[0]).toBe(`u`);
      expect(letters()[5]).toBe(`e`);
    });

    it(`plays from the keyboard, on the line of the tile that has focus`, async () => {
      await open();
      (tile(1, 0) as HTMLElement).focus();
      await userEvent.keyboard(`a`);

      await expect.poll(() => letters().slice(5, 10)).toBe(`fghij`);
    });

    it(`ignores keys that aren't moves`, async () => {
      await open();
      (tile(1, 0) as HTMLElement).focus();
      await userEvent.keyboard(`x`);

      expect(status()).toBe(`0 moves`);
    });

    it(`marks the letters that the server says are in place`, async () => {
      await open();
      await press(`Rotate row 1 left`);

      await expect
        .poll(() => tile(0, 0)?.getAttribute(`aria-label`))
        .toContain(`Correct character for this tile is A`);
    });

    it(`never says what belongs in a tile before it's been earned`, async () => {
      // The hints are the game, so the board can't give away anything that the server hasn't confirmed
      await open();

      expect(tile(0, 0)?.getAttribute(`aria-label`)).not.toContain(
        `Correct character`
      );
    });
  });

  describe(`solving`, () => {
    it(`shows how it went, in place of the count of moves`, async () => {
      await open();
      await solve();

      await expect.element(result).toMatchTextContent(`Solved in 2 moves`);
      expect(status()).toBe(``);
    });

    it(`takes the board out of play`, async () => {
      await open();
      await solve();

      const arrows = [
        ...document.querySelectorAll<HTMLButtonElement>(
          `[aria-label^="Rotate"]`
        )
      ];

      expect(letters()).toBe(solution);
      expect(arrows).toHaveLength(20);
      expect(arrows.every((button) => button.disabled)).toBe(true);
    });

    it(`keeps the target hidden until then`, async () => {
      // Seeing it while playing only discourages those who are behind it
      await open();

      await expect.element(body).not.toMatchTextContent(`The target was`);

      await solve();

      await says(`The target was 2`);
    });

    it(`survives the page being loaded again`, async () => {
      const { unmount } = await open();

      await solve();
      await expect.poll(() => localStorage.getItem(puzzle)).toBeTruthy();
      await unmount();
      await open();

      await says(`Solved in 2 moves`);
    });
  });

  describe(`when moves can't be checked`, () => {
    it(`says so, and can try again`, async () => {
      network.use(http.get(`*/api/check`, () => HttpResponse.error()));
      await open();
      await press(`Rotate row 1 left`);

      await expect.poll(status).toContain(`Couldn’t check that move`);

      network.resetHandlers();
      serveGame(puzzle, challenge);
      await press(`Try again`);

      await expect.poll(status).toBe(`1 move`);
    });
  });

  describe(`when a sign-in has run out`, () => {
    beforeEach(() => {
      setPlayer(alice);
      network.use(
        http.get(`*/api/solves`, () =>
          HttpResponse.json([
            { puzzle: `${puzzle.slice(0, 10)}_6x6`, moves: 12 }
          ])
        )
      );
    });

    it(`asks the player to sign in again, beside the count of moves`, async () => {
      await open();

      await expect.element(notice).toBeVisible();
      expect(status()).toContain(`0 moves`);
    });

    it(`keeps them signed in, and leaves their game where it is`, async () => {
      // Signing them out would swap the board in front of them for someone else's
      await open();
      await expect.element(notice).toBeVisible();
      await press(`Rotate row 1 left`);

      await expect.poll(status).toContain(`1 move`);
      expect(getPlayer()).toStrictEqual(alice);
    });

    it(`takes them to sign in`, async () => {
      await open();
      await notice.click();

      await says(`Sign in with your Atmosphere account`);
    });

    it(`says nothing to a player whose device is up to date`, async () => {
      network.resetHandlers();
      serveGame(puzzle, challenge);
      await open();
      await press(`Rotate row 1 left`);

      await expect.poll(status).toBe(`1 move`);
      await expect.element(notice).not.toBeInTheDocument();
    });
  });

  describe(`the menu`, () => {
    const leadTo = async (name: string): Promise<void> => {
      await press(`Menu`);
      await press(name);
    };

    it(`explains the size of board that's being played`, async () => {
      await open();
      await leadTo(`How to play`);

      await says(`five words`);
    });

    it(`loads the leaderboard only once it's asked for`, async () => {
      // Every request counts against a daily allowance
      let asked = 0;

      network.use(
        http.get(`*/api/ranking`, () => {
          asked += 1;

          return HttpResponse.json({ scores: [], total: 0, you: null });
        })
      );
      await open();
      await leadTo(`How to play`);
      await says(`five words`);

      expect(asked).toBe(0);

      await press(`Back to the menu`);
      await press(`Leaderboard`);

      await expect.poll(() => asked).toBe(1);
    });

    it(`has a way back from a screen to the menu`, async () => {
      await open();
      await leadTo(`How to play`);
      await press(`Back to the menu`);

      await expect.element(arrow(`How to play`)).toBeVisible();
    });

    it(`leaves the game as it was underneath`, async () => {
      await open();
      await press(`Rotate row 1 left`);
      await expect.poll(status).toBe(`1 move`);
      await leadTo(`Settings`);
      await page.getByRole(`button`, { name: `Close` }).last().click();

      await expect.poll(status).toBe(`1 move`);
    });

    it(`calls signing in what it's for, once there's a score to post`, async () => {
      await open();
      await solve();
      await leadTo(`Sign in`);

      await says(`Post your score`);
    });

    it(`leads from the settings to deleting a player's data, and back`, async () => {
      await signInAs(alice);
      await open();
      await leadTo(`Settings`);
      await press(`Delete my Worbik data`);

      await says(`Delete your Worbik data`);

      await press(`Back to settings`);

      await says(`Theme Mode`);
    });

    it(`offers a signed-in player their profile instead of signing in`, async () => {
      setPlayer(alice);
      await open();
      await press(`Menu`);

      await expect.element(arrow(`@alice.test`)).toBeVisible();
      await expect.element(arrow(`Sign in`)).not.toBeInTheDocument();
    });
  });
});
