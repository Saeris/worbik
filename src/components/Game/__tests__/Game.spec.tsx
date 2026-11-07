// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { fetch } from "void/client";
import { getPlayer, setPlayer } from "../../../auth/player";
import { checkGuesses } from "../../../server/moves";
import {
  PuzzleState,
  type Challenge,
  type PuzzleStateInit
} from "../../../state";
import { getPuzzleID } from "../../../utils/getPuzzleID";
import { Game } from "../Game";

/**
 * The whole game, played the way that a player plays it. The board, its
 * buttons, the menu and the drawer are all real, and moves are checked by the
 * real server code. Only the network between the two is stood in for.
 */

vi.mock(`void/client`, () => ({
  fetch: vi.fn<() => Promise<unknown>>(),
  FetchError: class extends Error {}
}));

vi.mock(`void/env`, () => ({ env: { PUZZLE_SECRET: `secret` } }));

vi.mock(`@void/react`, () => ({
  Link: ({
    href,
    children,
    ...props
  }: React.ComponentProps<`a`>): React.ReactNode => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

// Nobody here is really signed in, which is what a sign-in that has run out looks like
vi.mock(`../../../auth/oauth`, async () => {
  const { SignedOutError } = await import(`../../../auth/errors`);

  return {
    getProof: async (): Promise<never> => {
      throw new SignedOutError();
    }
  };
});

interface Options {
  method?: string;
  query: Record<string, string>;
}

const request = vi.mocked(
  fetch as unknown as (path: string, options: Options) => Promise<unknown>
);

const puzzle = getPuzzleID();
const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const solution = `abcdefghijklmnopqrstuvwxy`;
/** The solution with its first two rows each rotated one place to the right */
const start = `eabcdjfghiklmnopqrstuvwxy`;
const challenge: Challenge = [2, start, solution];
const init: PuzzleStateInit = [5, PuzzleState.compare(start, solution), 2];

/** Scores that are on a leaderboard, and solves that are on the server, as far as this device can tell */
let posted: { puzzle: string; moves: number }[] = [];

const server = async (path: string, { query }: Options): Promise<unknown> => {
  if (path === `/api/check`) {
    return checkGuesses(
      puzzle,
      challenge,
      query.guesses.split(`,`),
      query.from
    );
  }

  if (path === `/api/solves`) return posted;

  return { scores: [], total: 0, you: null };
};

describe(`game`, () => {
  let root: Root;
  let container: HTMLElement;

  /** Signing an answer takes longer than `act` waits for */
  const settle = async (): Promise<void> => {
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 30);
      });
    });
  };

  const open = async (): Promise<void> => {
    await act(async () => {
      root.render(<Game puzzleID={puzzle} init={init} />);
    });
    await settle();
  };

  const named = (name: string): HTMLElement | null =>
    document.querySelector(`[aria-label="${name}"]`);

  const press = async (name: string): Promise<void> => {
    await act(async () => {
      (
        named(name) ??
        [...document.querySelectorAll<HTMLElement>(`button`)].find(
          (button) => button.textContent === name
        )
      )?.click();
    });
    await settle();
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

  const solve = async (): Promise<void> => {
    await press(`Rotate row 1 left`);
    await press(`Rotate row 2 left`);
  };

  beforeEach(() => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    vi.spyOn(console, `error`).mockImplementation(() => {});
    posted = [];
    request.mockImplementation(server);
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = ``;
    setPlayer(null);
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
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

      expect(letters().slice(0, 5)).toBe(`abcde`);
      expect(status()).toBe(`1 move`);
    });

    it(`rotates a column`, async () => {
      await open();
      await press(`Rotate column 1 down`);

      expect(letters()[0]).toBe(`u`);
      expect(letters()[5]).toBe(`e`);
    });

    it(`plays from the keyboard, on the line of the tile that has focus`, async () => {
      await open();

      const tile = document.querySelector(`[data-row="1"][data-column="0"]`);

      await act(async () => {
        tile?.dispatchEvent(
          new KeyboardEvent(`keydown`, { key: `a`, bubbles: true })
        );
      });
      await settle();

      expect(letters().slice(5, 10)).toBe(`fghij`);
    });

    it(`ignores keys that aren't moves`, async () => {
      await open();
      await act(async () => {
        document
          .querySelector(`[data-row="1"][data-column="0"]`)
          ?.dispatchEvent(
            new KeyboardEvent(`keydown`, { key: `x`, bubbles: true })
          );
      });

      expect(status()).toBe(`0 moves`);
    });

    it(`marks the letters that the server says are in place`, async () => {
      await open();
      await press(`Rotate row 1 left`);

      expect(
        document
          .querySelector(`[data-row="0"][data-column="0"]`)
          ?.getAttribute(`aria-label`)
      ).toContain(`Correct character for this tile is A`);
    });

    it(`never says what belongs in a tile before it's been earned`, async () => {
      // The hints are the game, so the board can't give away anything that the server hasn't confirmed
      await open();

      expect(
        document
          .querySelector(`[data-row="0"][data-column="0"]`)
          ?.getAttribute(`aria-label`)
      ).not.toContain(`Correct character`);
    });
  });

  describe(`solving`, () => {
    it(`shows how it went, in place of the count of moves`, async () => {
      await open();
      await solve();

      expect(
        document.querySelector(`[aria-label="Result"]`)?.textContent
      ).toContain(`Solved in 2 moves`);
      expect(status()).not.toContain(`moves`);
    });

    it(`takes the board out of play`, async () => {
      await open();
      await solve();
      await press(`Rotate row 1 left`);

      expect(letters()).toBe(solution);
    });

    it(`leaves nothing on the board that looks as if it can be pressed`, async () => {
      await open();
      await solve();

      const arrows = [
        ...document.querySelectorAll<HTMLButtonElement>(
          `[aria-label^="Rotate"]`
        )
      ];

      expect(arrows).toHaveLength(20);
      expect(arrows.every((arrow) => arrow.disabled)).toBe(true);
    });

    it(`keeps the target hidden until then`, async () => {
      // Seeing it while playing only discourages those who are behind it
      await open();

      expect(document.body.textContent).not.toContain(`The target was`);

      await solve();

      expect(document.body.textContent).toContain(`The target was 2`);
    });

    it(`survives the page being loaded again`, async () => {
      await open();
      await solve();
      await act(async () => {
        root.unmount();
      });
      root = createRoot(container);
      await open();

      expect(document.body.textContent).toContain(`Solved in 2 moves`);
    });
  });

  describe(`when moves can't be checked`, () => {
    it(`says so, and can try again`, async () => {
      await open();
      request.mockRejectedValueOnce(new Error(`Offline`));
      await press(`Rotate row 1 left`);

      expect(status()).toContain(`Couldn’t check that move`);

      await press(`Try again`);

      expect(status()).toBe(`1 move`);
    });
  });

  describe(`when a sign-in has run out`, () => {
    beforeEach(() => {
      setPlayer(alice);
      posted = [{ puzzle: `${puzzle.slice(0, 10)}_6x6`, moves: 12 }];
    });

    it(`asks the player to sign in again, beside the count of moves`, async () => {
      await open();

      expect(named(`Your sign-in has run out. Sign in again`)).not.toBeNull();
      expect(status()).toContain(`0 moves`);
    });

    it(`keeps them signed in, and leaves their game where it is`, async () => {
      // Signing them out would swap the board in front of them for someone else's
      await open();
      await press(`Rotate row 1 left`);

      expect(getPlayer()).toStrictEqual(alice);
      expect(status()).toContain(`1 move`);
    });

    it(`takes them to sign in`, async () => {
      await open();
      await press(`Your sign-in has run out. Sign in again`);

      expect(document.body.textContent).toContain(
        `Sign in with your Atmosphere account`
      );
    });

    it(`says nothing to a player whose device is up to date`, async () => {
      posted = [];
      await open();

      expect(named(`Your sign-in has run out. Sign in again`)).toBeNull();
    });
  });

  describe(`the menu`, () => {
    const leadTo = async (screen: string): Promise<void> => {
      await press(`Menu`);
      await act(async () => {
        document
          .querySelector<HTMLElement>(`[data-screen="${screen}"]`)
          ?.click();
      });
      await settle();
    };

    it(`explains the size of board that's being played`, async () => {
      await open();
      await leadTo(`guide`);

      expect(document.body.textContent).toContain(`five words`);
    });

    it(`loads the leaderboard only once it's asked for`, async () => {
      // Every request counts against a daily allowance
      await open();

      const asked = (): number =>
        request.mock.calls.filter(([path]) => path === `/api/ranking`).length;

      expect(asked()).toBe(0);

      await leadTo(`leaderboard`);

      expect(asked()).toBe(1);
    });

    it(`doesn't load the leaderboard for any other screen`, async () => {
      await open();
      await leadTo(`guide`);

      expect(request.mock.calls.map(([path]) => path)).not.toContain(
        `/api/ranking`
      );
    });

    it(`has a way back from a screen to the menu`, async () => {
      await open();
      await leadTo(`guide`);
      await press(`Back to the menu`);

      expect(
        document.querySelector(`[data-screen="guide"]`)?.closest(`[inert]`)
      ).toBeNull();
    });

    it(`leaves the game as it was underneath`, async () => {
      await open();
      await press(`Rotate row 1 left`);
      await leadTo(`settings`);
      await press(`Close`);

      expect(status()).toBe(`1 move`);
    });

    it(`calls signing in what it's for, once there's a score to post`, async () => {
      await open();
      await solve();
      await leadTo(`sign-in`);

      expect(document.body.textContent).toContain(`Post your score`);
    });

    it(`leads from the settings to deleting a player's data, and back`, async () => {
      setPlayer(alice);
      await open();
      await leadTo(`settings`);
      await press(`Delete my Worbik data`);

      expect(document.body.textContent).toContain(`Delete your Worbik data`);

      await press(`Back to settings`);

      expect(document.body.textContent).toContain(`Theme Mode`);
    });

    it(`offers a signed-in player their profile instead of signing in`, async () => {
      setPlayer(alice);
      await open();
      await press(`Menu`);

      expect(document.querySelector(`[data-screen="profile"]`)).not.toBeNull();
      expect(document.querySelector(`[data-screen="sign-in"]`)).toBeNull();
    });
  });
});
