import { delay, http, HttpResponse } from "msw";
import { render } from "vitest-browser-react";
import { setPlayer } from "#auth/player";
import { vouchForBoard } from "#server/moves";
import {
  MAX_GUESSES,
  PuzzleState,
  type Challenge,
  type PuzzleStateInit
} from "#state";
import { answerCheck, neverHappens, serveGame } from "#test/game";
import { network } from "#test/network";
import { getPuzzleID } from "#utils";
import { usePuzzle } from "../usePuzzleState";

/** What a request to check some moves asked */
interface Asked {
  guesses: string;
  from: string | null;
}

/** Answers with whatever the test says, and notes what was asked */
const answerWith = (
  respond: (asked: Asked) => Response | Promise<Response>
): Asked[] => {
  const asked: Asked[] = [];

  network.use(
    http.get(`*/api/check`, async ({ request }) => {
      const { searchParams } = new URL(request.url);
      const question = {
        guesses: searchParams.get(`guesses`) ?? ``,
        from: searchParams.get(`from`)
      };

      asked.push(question);

      return respond(question);
    })
  );

  return asked;
};

/**
 * A 3×2 puzzle whose solution is `abc` over `def`, in which no letter
 * starts out in its correct position. Rotating the first row to the
 * right puts all three of its letters where they belong.
 */
const init: PuzzleStateInit = [3 as PuzzleStateInit[0], `bcaefd`, 2];
const small = `03-02-2026_3x2`;

let puzzle: ReturnType<typeof usePuzzle>;

/** Renders the hints of every tile, the way that the board does */
const Board: React.FC = () => {
  // oxlint-disable-next-line react/globals -- hands the hook's result to the tests, which then drive it
  puzzle = usePuzzle(small, init, false);

  return (
    <output>
      {[0, 1]
        .map((x) => [0, 1, 2].map((y) => puzzle.getHintAt(x, y)).join(``))
        .join(`|`)}
    </output>
  );
};

/** The hints that are on show */
const hints = (): string | null | undefined =>
  document.querySelector(`output`)?.textContent;

describe(`usePuzzle`, () => {
  beforeEach(async () => {
    vi.spyOn(console, `error`).mockImplementation(() => {});
    await render(<Board />);
  });

  it(`reveals a hint as soon as the server confirms it`, async () => {
    // A hint that only shows up after the next move tricks players into moving a letter that was already in place
    answerWith(() => HttpResponse.json({ hints: [`ABCefd`] }));

    expect(hints()).toBe(`   |   `);

    puzzle.rotate(0, `right`);

    await expect.poll(hints).toBe(`ABC|   `);
    expect(puzzle.isRowCorrect(0)).toBe(true);
    expect(puzzle.moves).toBe(1);
  });

  it(`checks a move right away, rather than waiting to see if more follow`, async () => {
    // Any delay before checking is time in which a player can't tell that a letter is already in place
    const asked = answerWith(async () => {
      await delay(`infinite`);

      return HttpResponse.json({});
    });

    puzzle.rotate(0, `right`);

    await expect
      .poll(() => asked)
      .toStrictEqual([{ guesses: `abcefd`, from: null }]);
  });

  it(`checks the moves made while waiting on the server together`, async () => {
    // One request per burst of moves keeps the game within the limits of what it's hosted on
    const first = Promise.withResolvers<undefined>();
    const asked = answerWith(async ({ guesses }) => {
      if (guesses === `abcefd`) await first.promise;

      return HttpResponse.json({ hints: [`ABCefd`] });
    });

    puzzle.rotate(0, `right`);
    puzzle.rotate(1, `left`);
    puzzle.rotate(1, `left`);

    await expect.poll(() => asked).toHaveLength(1);

    first.resolve(undefined);

    await expect.poll(() => asked).toHaveLength(2);
    expect(asked[1].guesses).toBe(`abcfde,abcdef`);
  });

  it(`checks a move again with the next one when the server couldn't be reached`, async () => {
    // A letter that landed in place while offline must still be revealed once back online
    let online = false;
    const asked = answerWith(() =>
      online
        ? HttpResponse.json({ hints: [`ABCefd`, `ABCfde`] })
        : HttpResponse.error()
    );

    puzzle.rotate(0, `right`);

    await expect.poll(() => puzzle.stalled).toBe(true);
    expect(hints()).toBe(`   |   `);

    online = true;
    puzzle.rotate(1, `left`);

    await expect.poll(hints).toBe(`ABC|   `);
    expect(asked.at(-1)?.guesses).toBe(`abcefd,abcfde`);
  });
});

describe(`restoring a saved game`, () => {
  /** The same board, but one that keeps its game on the device */
  const Saved: React.FC = () => {
    // oxlint-disable-next-line react/globals -- hands the hook's result to the tests, which then read it
    puzzle = usePuzzle(`12-31-2099_3x2`, init, true);

    return <output>{puzzle.moves}</output>;
  };

  const id = `12-31-2099_3x2`;

  it(`picks up a game of this puzzle where it was left`, async () => {
    localStorage.setItem(id, `3|bcaefd,abcefd|ABC   ||a-note`);
    await render(<Saved />);

    expect(puzzle.moves).toBe(1);
  });

  it(`hands the server's note back with the next move`, async () => {
    // Without it the server has no way to tell that the move follows from where the game is
    const asked = answerWith(() =>
      HttpResponse.json({ hints: [`ABCefd`], from: `a-newer-note` })
    );

    localStorage.setItem(id, `3|bcaefd,abcefd|ABC   ||a-note`);
    await render(<Saved />);
    puzzle.rotate(1, `left`);

    await expect.poll(() => localStorage.getItem(id)).toContain(`a-newer-note`);
    expect(asked[0].from).toBe(`a-note`);
  });

  it(`has an unfinished game with no note checked from the start`, async () => {
    // With nothing to say how far the server got, the game itself is what it's shown
    const asked = answerWith(() =>
      HttpResponse.json({ hints: [`ABCefd`], from: `a-note` })
    );

    localStorage.setItem(id, `3|bcaefd,abcefd|ABC   `);
    await render(<Saved />);

    await expect
      .poll(() => asked)
      .toStrictEqual([{ guesses: `abcefd`, from: null }]);
    expect(puzzle.moves).toBe(1);
  });

  it(`keeps a solved game, which needs no note`, async () => {
    localStorage.setItem(id, `3|bcaefd,abcdef|ABCDEF`);
    await render(<Saved />);

    expect(puzzle.moves).toBe(1);
    expect(puzzle.win).toBe(true);
  });

  it(`leaves whatever isn't a game of this puzzle's board`, async () => {
    // Storage can hold anything, and a bad hint would otherwise take the whole page down with it
    localStorage.setItem(id, `3|bcaefd,abcefd|AB`);
    await render(<Saved />);

    expect(puzzle.moves).toBe(0);
  });

  it(`keeps the board's width a number`, async () => {
    // What's saved is text, and the size picker compares this to find the board being played
    localStorage.setItem(id, `3|bcaefd,abcefd|ABC   ||a-note`);
    await render(<Saved />);

    expect(puzzle.initial.width).toBe(3);
  });

  it(`leaves a game of a puzzle that has since been remade`, async () => {
    // Its moves were made on a different board, and a score made of them would be turned away
    localStorage.setItem(id, `3|zzzzzz,abcefd|ABC   `);
    await render(<Saved />);

    expect(puzzle.moves).toBe(0);
  });

  it(`clears away games that have expired, and leaves the rest`, async () => {
    // Storage is limited, and a device would otherwise keep every game that was ever played on it
    localStorage.setItem(`01-01-2020_5x5`, `an old game`);
    localStorage.setItem(`theme`, `dark`);
    await render(<Saved />);

    expect(localStorage.getItem(`01-01-2020_5x5`)).toBeNull();
    expect(localStorage.getItem(`theme`)).toBe(`dark`);
  });
});

describe(`staying in step with the server`, () => {
  const id = getPuzzleID();
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
  const known = `ABCDE     ${solution.slice(10).toUpperCase()}`;

  const Played: React.FC = () => {
    // oxlint-disable-next-line react/globals -- hands the hook's result to the tests, which then drive it
    puzzle = usePuzzle(id, board);

    return <output>{puzzle.moves}</output>;
  };

  const open = async (): ReturnType<typeof render> => render(<Played />);

  const solve = (): void => {
    puzzle.rotate(0, `left`);
    puzzle.rotate(1, `left`);
  };

  const won = async (): Promise<void> => {
    await expect.poll(() => puzzle.win).toBe(true);
  };

  /** What another tab saying that it's further along looks like */
  const otherTabSaves = (saved: string): void => {
    window.dispatchEvent(
      new StorageEvent(`storage`, { key: id, newValue: saved })
    );
  };

  beforeEach(() => {
    vi.spyOn(console, `error`).mockImplementation(() => {});
    serveGame(id, game);
  });

  it(`can always be solved after the page goes away with a move on its way`, async () => {
    // A save of moves the server hadn't reached used to get every later move refused, leaving the puzzle unsolvable for the rest of the day
    const held = Promise.withResolvers<undefined>();
    let requests = 0;

    network.use(
      http.get(`*/api/check`, async ({ request }) => {
        requests += 1;

        if (requests > 1) await delay(`infinite`);
        await held.promise;

        return answerCheck(id, game, request);
      })
    );

    const page = await open();

    puzzle.rotate(0, `left`);
    puzzle.rotate(0, `up`);
    held.resolve(undefined);
    await expect.poll(() => requests).toBe(2);
    await page.unmount();

    network.resetHandlers();
    serveGame(id, game);
    await open();
    solve();

    await won();
  });

  it(`recovers a game that was saved ahead of its note`, async () => {
    // Players already have these, and their games have to come back to life
    const note = await vouchForBoard(id, afterA);

    localStorage.setItem(
      id,
      `5|${start},${afterA},${afterB}|${known}||${note}`
    );
    await open();
    puzzle.rotate(0, `down`);
    puzzle.rotate(1, `left`);

    await won();
    expect(puzzle.stalled).toBe(false);
  });

  it(`recovers a game whose note the server can no longer read`, async () => {
    // As happens to every game under way if the secret that signs them is ever changed
    localStorage.setItem(id, `5|${start},${afterA}|${known}||${afterA}.forged`);
    await open();
    puzzle.rotate(1, `left`);

    await won();
  });

  it(`goes on when the game can't be saved`, async () => {
    // A move that was checked but not saved used to be sent again, which the server refuses
    vi.spyOn(Storage.prototype, `setItem`).mockImplementation(() => {
      throw new DOMException(`Full`, `QuotaExceededError`);
    });
    await open();
    solve();

    await won();
  });

  it(`can be played without any storage at all`, async () => {
    // Browsers that block site data throw at the very mention of it
    const storage = Object.getOwnPropertyDescriptor(window, `localStorage`);

    Object.defineProperty(window, `localStorage`, {
      configurable: true,
      get: () => {
        throw new DOMException(`Denied`, `SecurityError`);
      }
    });

    try {
      await open();
      solve();

      await won();
    } finally {
      Object.defineProperty(window, `localStorage`, storage!);
    }
  });

  it(`says so when moves can't be checked, and can try again`, async () => {
    // Without hints a game can't be won, and a player has no other way of knowing that nothing is happening
    network.use(http.get(`*/api/check`, () => HttpResponse.error()));
    await open();
    puzzle.rotate(0, `left`);

    await expect.poll(() => puzzle.stalled).toBe(true);

    network.resetHandlers();
    serveGame(id, game);
    puzzle.retry();

    await expect.poll(() => puzzle.stalled).toBe(false);
    expect(puzzle.isRowCorrect(0)).toBe(true);
  });

  it(`stops, rather than asking forever, if the game itself is refused`, async () => {
    const asked = answerWith(() =>
      HttpResponse.json({ message: `Refused` }, { status: 409 })
    );

    localStorage.setItem(id, `5|${start},${afterA}|${known}||a-note`);
    await open();
    puzzle.rotate(1, `left`);

    await expect.poll(() => puzzle.stalled).toBe(true);
    // Once as it stood and once from the start, each of which the client tries twice of its own accord
    expect(asked).toHaveLength(4);
  });

  it(`never checks more at once than fits in an address`, async () => {
    // A long stretch offline, or a whole game being sent again, would otherwise be turned away for its length
    network.use(http.get(`*/api/check`, () => HttpResponse.error()));
    await open();

    for (let count = 0; count < MAX_GUESSES + 20; count += 1) {
      puzzle.rotate(count % 5, count % 2 ? `left` : `right`);
    }

    await expect.poll(() => puzzle.stalled).toBe(true);

    const asked = answerWith(({ guesses }) =>
      HttpResponse.json({ hints: guesses.split(`,`), from: `a-note` })
    );

    puzzle.retry();

    await expect
      .poll(() => asked.map(({ guesses }) => guesses.split(`,`).length))
      .toStrictEqual([MAX_GUESSES, 20]);
  });

  it(`follows a game that's further along in another tab`, async () => {
    // Whichever tab falls behind would otherwise overwrite the other's moves the next time that it saved
    await open();
    otherTabSaves(`5|${start},${afterA}|${known}||a-note`);

    await expect.poll(() => puzzle.moves).toBe(1);
    expect(puzzle.isRowCorrect(0)).toBe(true);
  });

  it(`leaves a game alone when another tab is behind it`, async () => {
    await open();
    puzzle.rotate(0, `left`);
    puzzle.rotate(0, `up`);
    await expect.poll(() => puzzle.moves).toBe(2);
    otherTabSaves(`5|${start},${afterA}|${known}||a-note`);

    await neverHappens(() => puzzle.moves !== 2);
  });

  it(`catches up with another tab on waking`, async () => {
    // A phone puts a tab to sleep, and a sleeping tab hears nothing of what's saved, so it would overwrite newer moves
    await open();
    localStorage.setItem(id, `5|${start},${afterA}|${known}||a-note`);
    document.dispatchEvent(new Event(`visibilitychange`));

    await expect.poll(() => puzzle.moves).toBe(1);
  });

  it(`does nothing on going to sleep`, async () => {
    await open();
    localStorage.setItem(id, `5|${start},${afterA}|${known}||a-note`);
    vi.spyOn(document, `visibilityState`, `get`).mockReturnValue(`hidden`);
    document.dispatchEvent(new Event(`visibilitychange`));

    await neverHappens(() => puzzle.moves !== 0);
  });

  it(`leaves a solved game alone on waking`, async () => {
    // Nothing can come after a solve, and picking it up again would throw away what's known about it
    await open();
    solve();
    await won();
    localStorage.setItem(
      id,
      `5|${[...puzzle.history, solution].join(`,`)}|${solution.toUpperCase()}||a-note`
    );
    document.dispatchEvent(new Event(`visibilitychange`));

    await neverHappens(() => puzzle.moves !== 2);
  });

  it(`ignores an answer about a game that another tab has replaced`, async () => {
    // It would leave a note for one board saved beside another, which is what used to make games unwinnable
    const held = Promise.withResolvers<undefined>();
    let requests = 0;

    network.use(
      http.get(`*/api/check`, async ({ request }) => {
        requests += 1;
        await held.promise;

        return answerCheck(id, game, request);
      })
    );
    await open();
    puzzle.rotate(0, `left`);
    await expect.poll(() => requests).toBe(1);
    otherTabSaves(`5|${start},${afterA},${afterB}|${known}||a-note`);
    held.resolve(undefined);

    await expect
      .poll(() => localStorage.getItem(id)?.endsWith(`|a-note`))
      .toBe(true);
    expect(puzzle.moves).toBe(2);
  });

  it(`keeps one player's moves out of another's game`, async () => {
    // Signing out doesn't reload the page, so what was left to check has to go with the game it belongs to
    setPlayer({ did: `did:plc:someone`, handle: `someone.test` });
    network.use(http.get(`*/api/check`, () => HttpResponse.error()));
    await open();
    puzzle.rotate(0, `left`);
    await expect.poll(() => puzzle.stalled).toBe(true);

    const asked = serveGame(id, game);

    setPlayer(null);
    await expect.poll(() => puzzle.moves).toBe(0);
    puzzle.rotate(0, `left`);

    await expect.poll(() => asked).toStrictEqual([[afterA]]);
  });
});
