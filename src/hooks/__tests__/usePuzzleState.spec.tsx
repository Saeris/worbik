// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { fetch, FetchError } from "void/client";
import { setPlayer } from "../../auth/player";
import { checkGuesses, vouchForBoard } from "../../server/moves";
import {
  MAX_GUESSES,
  PuzzleState,
  type Challenge,
  type PuzzleStateInit
} from "../../state";
import { getPuzzleID } from "../../utils";
import { REQUEST_TIMEOUT } from "../../utils/withTimeout";
import { usePuzzle } from "../usePuzzleState";

/** What the server answers with: the letters that are in place, and a note of where the game is */
interface Answer {
  hints: string[];
  from?: string;
}

vi.mock(`void/client`, () => ({
  fetch: vi.fn<() => Promise<Answer>>(),
  FetchError: class extends Error {
    constructor(readonly status: number) {
      super();
    }
  }
}));
vi.mock(`void/env`, () => ({ env: { PUZZLE_SECRET: `secret` } }));

const check = vi.mocked(
  fetch as unknown as (...args: any[]) => Promise<Answer>
);

/**
 * A 3×2 puzzle whose solution is `abc` over `def`, in which no letter
 * starts out in its correct position. Rotating the first row to the
 * right puts all three of its letters where they belong.
 */
const init: PuzzleStateInit = [3 as PuzzleStateInit[0], `bcaefd`, 2];

let puzzle: ReturnType<typeof usePuzzle>;

/** Renders the hints of every tile, the way that the board does */
const Board: React.FC = () => {
  // oxlint-disable-next-line react/globals -- hands the hook's result to the tests, which then drive it
  puzzle = usePuzzle(`03-02-2026_3x2`, init, false);

  return (
    <output>
      {[0, 1]
        .map((x) => [0, 1, 2].map((y) => puzzle.getHintAt(x, y)).join(``))
        .join(`|`)}
    </output>
  );
};

describe(`usePuzzle`, () => {
  let root: Root;
  let container: HTMLElement;

  beforeEach(async () => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    vi.spyOn(console, `error`).mockImplementation(() => {});
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
    await act(async () => {
      root.render(<Board />);
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    check.mockReset();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it(`reveals a hint as soon as the server confirms it`, async () => {
    // A hint that only shows up after the next move tricks players into moving a letter that was already in place
    check.mockResolvedValue({ hints: [`ABCefd`] });

    expect(container.textContent).toBe(`   |   `);

    await act(async () => {
      puzzle.rotate(0, `right`);
    });

    expect(container.textContent).toBe(`ABC|   `);
    expect(puzzle.isRowCorrect(0)).toBe(true);
    expect(puzzle.moves).toBe(1);
  });

  it(`checks a move right away, rather than waiting to see if more follow`, async () => {
    // Any delay before checking is time in which a player can't tell that a letter is already in place
    // A response from the server that is settled at a moment of the test's choosing
    const response = Promise.withResolvers<Answer>();
    check.mockReturnValue(response.promise);

    await act(async () => {
      puzzle.rotate(0, `right`);
    });

    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenLastCalledWith(`/api/check`, {
      query: { puzzle: `03-02-2026_3x2`, guesses: `abcefd` },
      timeout: REQUEST_TIMEOUT
    });

    await act(async () => {
      response.resolve({ hints: [`ABCefd`] });
    });
  });

  it(`checks the moves made while waiting on the server together`, async () => {
    // One request per burst of moves keeps the game within the limits of what it's hosted on
    const first = Promise.withResolvers<Answer>();
    check.mockReturnValueOnce(first.promise).mockResolvedValue({ hints: [] });

    await act(async () => {
      puzzle.rotate(0, `right`);
      puzzle.rotate(1, `left`);
      puzzle.rotate(1, `left`);
    });

    expect(check).toHaveBeenCalledTimes(1);

    await act(async () => {
      first.resolve({ hints: [`ABCefd`] });
    });

    expect(check).toHaveBeenCalledTimes(2);
    expect(check).toHaveBeenLastCalledWith(`/api/check`, {
      query: { puzzle: `03-02-2026_3x2`, guesses: `abcfde,abcdef` },
      timeout: REQUEST_TIMEOUT
    });
  });

  it(`checks a move again with the next one when the server couldn't be reached`, async () => {
    // A letter that landed in place while offline must still be revealed once back online
    check
      .mockRejectedValueOnce(new Error(`Failed to fetch`))
      .mockResolvedValue({ hints: [`ABCefd`, `ABCfde`] });

    await act(async () => {
      puzzle.rotate(0, `right`);
    });

    expect(container.textContent).toBe(`   |   `);

    await act(async () => {
      puzzle.rotate(1, `left`);
    });

    expect(check).toHaveBeenLastCalledWith(`/api/check`, {
      query: { puzzle: `03-02-2026_3x2`, guesses: `abcefd,abcfde` },
      timeout: REQUEST_TIMEOUT
    });
    expect(container.textContent).toBe(`ABC|   `);
  });
});

describe(`restoring a saved game`, () => {
  let root: Root;
  let container: HTMLElement;

  /** The same board, but one that keeps its game on the device */
  const Saved: React.FC = () => {
    // oxlint-disable-next-line react/globals -- hands the hook's result to the tests, which then read it
    puzzle = usePuzzle(`03-02-2026_3x2`, init, true);

    return <output>{puzzle.moves}</output>;
  };

  const render = async (): Promise<void> => {
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
    await act(async () => {
      root.render(<Saved />);
    });
  };

  beforeEach(() => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it(`picks up a game of this puzzle where it was left`, async () => {
    localStorage.setItem(`03-02-2026_3x2`, `3|bcaefd,abcefd|ABC   ||a-note`);
    await render();

    expect(puzzle.moves).toBe(1);
  });

  it(`hands the server's note back with the next move`, async () => {
    // Without it the server has no way to tell that the move follows from where the game is
    check.mockResolvedValue({ hints: [`ABCefd`], from: `a-newer-note` });
    localStorage.setItem(`03-02-2026_3x2`, `3|bcaefd,abcefd|ABC   ||a-note`);
    await render();
    await act(async () => {
      puzzle.rotate(1, `left`);
    });

    expect(check).toHaveBeenLastCalledWith(`/api/check`, {
      query: expect.objectContaining({ from: `a-note` }),
      timeout: REQUEST_TIMEOUT
    });
    expect(localStorage.getItem(`03-02-2026_3x2`)).toContain(`a-newer-note`);
  });

  it(`has an unfinished game with no note checked from the start`, async () => {
    // With nothing to say how far the server got, the game itself is what it's shown
    check.mockResolvedValue({ hints: [`ABCefd`], from: `a-note` });
    localStorage.setItem(`03-02-2026_3x2`, `3|bcaefd,abcefd|ABC   `);
    await render();

    expect(puzzle.moves).toBe(1);
    expect(check).toHaveBeenLastCalledWith(`/api/check`, {
      query: { puzzle: `03-02-2026_3x2`, guesses: `abcefd` },
      timeout: REQUEST_TIMEOUT
    });
  });

  it(`keeps a solved game, which needs no note`, async () => {
    localStorage.setItem(`03-02-2026_3x2`, `3|bcaefd,abcdef|ABCDEF`);
    await render();

    expect(puzzle.moves).toBe(1);
    expect(puzzle.win).toBe(true);
  });

  it(`leaves whatever isn't a game of this puzzle's board`, async () => {
    // Storage can hold anything, and a bad hint would otherwise take the whole page down with it
    localStorage.setItem(`03-02-2026_3x2`, `3|bcaefd,abcefd|AB`);
    await render();

    expect(puzzle.moves).toBe(0);
  });

  it(`keeps the board's width a number`, async () => {
    // What's saved is text, and the size picker compares this to find the board being played
    localStorage.setItem(`03-02-2026_3x2`, `3|bcaefd,abcefd|ABC   ||a-note`);
    await render();

    expect(puzzle.initial.width).toBe(3);
  });

  it(`leaves a game of a puzzle that has since been remade`, async () => {
    // Its moves were made on a different board, and a score made of them would be turned away
    localStorage.setItem(`03-02-2026_3x2`, `3|zzzzzz,abcefd|ABC   `);
    await render();

    expect(puzzle.moves).toBe(0);
  });
});

describe(`staying in step with the server`, () => {
  const id = getPuzzleID({ width: 5, height: 5 });
  const solution = `abcdefghijklmnopqrstuvwxy`;
  /** The solution with its first two rows each rotated one place to the right */
  const start = `eabcdjfghiklmnopqrstuvwxy`;
  const game: Challenge = [2, start, solution];
  const board: PuzzleStateInit = [5, PuzzleState.compare(start, solution), 2];
  /** The board after the first row is put right */
  const afterA = `abcdejfghiklmnopqrstuvwxy`;
  /** That board, after a wrong move: the first column rotated up */
  const afterB = `jbcdekfghiplmnouqrstavwxy`;
  /** What's known once the first row is in place, along with the rows that began in place */
  const hints = `ABCDE     ${solution.slice(10).toUpperCase()}`;

  const refuse = (status: number): Error =>
    new (FetchError as unknown as new (code: number) => Error)(status);

  /** Answers the way that the real server does, which is what these are all about */
  const server = async (
    _url: string,
    { query }: { query: Record<string, string> }
  ): Promise<Answer> => {
    try {
      return await checkGuesses(id, game, query.guesses.split(`,`), query.from);
    } catch (cause) {
      throw refuse((cause as { status: number }).status);
    }
  };

  const Played: React.FC = () => {
    // oxlint-disable-next-line react/globals -- hands the hook's result to the tests, which then drive it
    puzzle = usePuzzle(id, board);

    return <output>{puzzle.moves}</output>;
  };

  let root: Root | undefined;

  /** Signing an answer takes longer than `act` waits for */
  const settle = async (): Promise<void> => {
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 30);
      });
    });
  };

  const open = async (): Promise<void> => {
    root = createRoot(document.body.appendChild(document.createElement(`div`)));
    await act(async () => {
      root?.render(<Played />);
    });
    await settle();
  };

  const close = async (): Promise<void> => {
    await act(async () => {
      root?.unmount();
    });
    root = undefined;
  };

  const move = async (
    line: number,
    dir: `down` | `left` | `right` | `up`
  ): Promise<void> => {
    await act(async () => {
      puzzle.rotate(line, dir);
    });
    await settle();
  };

  beforeEach(() => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    vi.spyOn(console, `error`).mockImplementation(() => {});
    check.mockImplementation(server as never);
  });

  afterEach(async () => {
    await close();
    vi.unstubAllGlobals();
    localStorage.clear();
    check.mockReset();
    vi.restoreAllMocks();
  });

  it(`can always be solved after the page goes away with a move on its way`, async () => {
    // A save of moves the server hadn't reached used to get every later move refused, leaving the puzzle unsolvable for the rest of the day
    const held = Promise.withResolvers<void>();
    check
      .mockImplementationOnce((async (...args: Parameters<typeof server>) => {
        await held.promise;
        return server(...args);
      }) as never)
      .mockImplementationOnce((async () => new Promise(() => {})) as never);
    await open();
    await act(async () => {
      puzzle.rotate(0, `left`);
      puzzle.rotate(0, `up`);
    });
    await act(async () => {
      held.resolve();
    });
    await settle();
    await close();

    await open();
    await move(0, `left`);
    await move(1, `left`);

    expect(puzzle.win).toBe(true);
  });

  it(`recovers a game that was saved ahead of its note`, async () => {
    // Players already have these, and their games have to come back to life
    const note = await vouchForBoard(id, afterA);
    localStorage.setItem(
      id,
      `5|${start},${afterA},${afterB}|${hints}||${note}`
    );
    await open();
    await move(0, `down`);
    await move(1, `left`);

    expect(puzzle.win).toBe(true);
    expect(puzzle.stalled).toBe(false);
  });

  it(`recovers a game whose note the server can no longer read`, async () => {
    // As happens to every game under way if the secret that signs them is ever changed
    localStorage.setItem(id, `5|${start},${afterA}|${hints}||${afterA}.forged`);
    await open();
    await move(1, `left`);

    expect(puzzle.win).toBe(true);
  });

  it(`goes on when the game can't be saved`, async () => {
    // A move that was checked but not saved used to be sent again, which the server refuses
    vi.stubGlobal(`localStorage`, {
      getItem: () => null,
      removeItem: () => {},
      setItem: () => {
        throw new DOMException(`Full`, `QuotaExceededError`);
      }
    });
    await open();
    await move(0, `left`);
    await move(1, `left`);

    expect(puzzle.win).toBe(true);
  });

  it(`can be played without any storage at all`, async () => {
    // Browsers that block site data throw at the very mention of it
    const storage = Object.getOwnPropertyDescriptor(globalThis, `localStorage`);

    Object.defineProperty(globalThis, `localStorage`, {
      configurable: true,
      get: () => {
        throw new DOMException(`Denied`, `SecurityError`);
      }
    });

    try {
      await open();
      await move(0, `left`);
      await move(1, `left`);

      expect(puzzle.win).toBe(true);
    } finally {
      Object.defineProperty(
        globalThis,
        `localStorage`,
        storage as PropertyDescriptor
      );
    }
  });

  it(`says so when moves can't be checked, and can try again`, async () => {
    // Without hints a game can't be won, and a player has no other way of knowing that nothing is happening
    check.mockRejectedValueOnce(new Error(`Failed to fetch`));
    await open();
    await move(0, `left`);

    expect(puzzle.stalled).toBe(true);

    await act(async () => {
      puzzle.retry();
    });
    await settle();

    expect(puzzle.stalled).toBe(false);
    expect(puzzle.isRowCorrect(0)).toBe(true);
  });

  it(`stops, rather than asking forever, if the game itself is refused`, async () => {
    check.mockImplementation((async () => {
      throw refuse(409);
    }) as never);
    localStorage.setItem(id, `5|${start},${afterA}|${hints}||a-note`);
    await open();
    await move(1, `left`);

    expect(puzzle.stalled).toBe(true);
    expect(check).toHaveBeenCalledTimes(2);
  });

  it(`never checks more at once than fits in an address`, async () => {
    // A long stretch offline, or a whole game being sent again, would otherwise be turned away for its length
    check.mockImplementation((async () => {
      throw new Error(`Failed to fetch`);
    }) as never);
    await open();
    await act(async () => {
      for (let count = 0; count < MAX_GUESSES + 20; count += 1) {
        puzzle.rotate(count % 5, count % 2 ? `left` : `right`);
      }
    });
    await settle();
    check.mockReset();
    check.mockImplementation((async (
      _url: string,
      { query }: { query: { guesses: string } }
    ) => ({
      hints: query.guesses.split(`,`),
      from: `a-note`
    })) as never);
    await act(async () => {
      puzzle.retry();
    });
    await settle();

    const sizes = check.mock.calls.map(
      ([, { query }]) => query.guesses.split(`,`).length
    );

    expect(sizes).toStrictEqual([MAX_GUESSES, 20]);
  });

  it(`follows a game that's further along in another tab`, async () => {
    // Whichever tab falls behind would otherwise overwrite the other's moves the next time that it saved
    await open();
    await act(async () => {
      window.dispatchEvent(
        new StorageEvent(`storage`, {
          key: id,
          newValue: `5|${start},${afterA}|${hints}||a-note`
        })
      );
    });
    await settle();

    expect(puzzle.moves).toBe(1);
    expect(puzzle.isRowCorrect(0)).toBe(true);
  });

  it(`leaves a game alone when another tab is behind it`, async () => {
    await open();
    await move(0, `left`);
    await move(0, `up`);
    await act(async () => {
      window.dispatchEvent(
        new StorageEvent(`storage`, {
          key: id,
          newValue: `5|${start},${afterA}|${hints}||a-note`
        })
      );
    });

    expect(puzzle.moves).toBe(2);
  });

  it(`catches up with another tab on waking`, async () => {
    // A phone puts a tab to sleep, and a sleeping tab hears nothing of what's saved, so it would overwrite newer moves
    await open();
    localStorage.setItem(id, `5|${start},${afterA}|${hints}||a-note`);
    await act(async () => {
      document.dispatchEvent(new Event(`visibilitychange`));
    });
    await settle();

    expect(puzzle.moves).toBe(1);
  });

  it(`does nothing on going to sleep`, async () => {
    await open();
    localStorage.setItem(id, `5|${start},${afterA}|${hints}||a-note`);
    vi.spyOn(document, `visibilityState`, `get`).mockReturnValue(`hidden`);
    await act(async () => {
      document.dispatchEvent(new Event(`visibilitychange`));
    });

    expect(puzzle.moves).toBe(0);
  });

  it(`leaves a solved game alone on waking`, async () => {
    // Nothing can come after a solve, and picking it up again would throw away what's known about it
    await open();
    await move(0, `left`);
    await move(1, `left`);

    const { history } = puzzle;

    localStorage.setItem(
      id,
      `5|${[...history, solution].join(`,`)}|${solution.toUpperCase()}||a-note`
    );
    await act(async () => {
      document.dispatchEvent(new Event(`visibilitychange`));
    });

    expect(puzzle.win).toBe(true);
    expect(puzzle.moves).toBe(2);
  });

  it(`ignores an answer about a game that another tab has replaced`, async () => {
    // It would leave a note for one board saved beside another, which is what used to make games unwinnable
    const held = Promise.withResolvers<void>();

    check.mockImplementationOnce((async (
      ...args: Parameters<typeof server>
    ) => {
      await held.promise;
      return server(...args);
    }) as never);
    await open();
    await act(async () => {
      puzzle.rotate(0, `left`);
    });
    await act(async () => {
      window.dispatchEvent(
        new StorageEvent(`storage`, {
          key: id,
          newValue: `5|${start},${afterA},${afterB}|${hints}||a-note`
        })
      );
    });
    await act(async () => {
      held.resolve();
    });
    await settle();

    expect(puzzle.moves).toBe(2);
    expect(localStorage.getItem(id)?.endsWith(`|a-note`)).toBe(true);
  });

  it(`keeps one player's moves out of another's game`, async () => {
    // Signing out doesn't reload the page, so what was left to check has to go with the game it belongs to
    setPlayer({ did: `did:plc:someone`, handle: `someone.test` });
    check.mockRejectedValueOnce(new Error(`Failed to fetch`));
    await open();
    await move(0, `left`);
    await act(async () => {
      setPlayer(null);
    });
    check.mockClear();
    await move(0, `left`);

    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenLastCalledWith(`/api/check`, {
      query: { puzzle: id, guesses: afterA },
      timeout: REQUEST_TIMEOUT
    });
  });
});
