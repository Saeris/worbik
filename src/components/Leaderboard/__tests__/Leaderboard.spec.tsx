// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { fetch } from "void/client";
import { setPlayer } from "../../../auth/player";
import { Leaderboard } from "../Leaderboard";

vi.mock(`void/client`, () => ({
  fetch: vi.fn<() => Promise<unknown>>(),
  FetchError: class extends Error {}
}));

interface Options {
  query: { puzzle: string; player?: string };
}

const request = vi.mocked(
  fetch as unknown as (path: string, options: Options) => Promise<unknown>
);

const puzzle = `11-07-2026_5x5`;
const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const someone = (index: number): object => ({
  did: `did:plc:player${index}`,
  handle: `player${index}.test`,
  moves: index + 1
});
const ranking = (total: number, you: object | null = null): object => ({
  scores: Array.from({ length: Math.min(total, 100) }, (_, index) =>
    someone(index)
  ),
  total,
  you
});

/** Answers with a leaderboard for each puzzle that the test knows of, and fails for any other */
const serve = (rankings: Record<string, object | Promise<object>>): void => {
  request.mockImplementation(async (_path, { query }) => {
    const answer = rankings[query.puzzle];

    if (answer === undefined) throw new Error(`Offline`);

    return answer;
  });
};

describe(`leaderboard`, () => {
  const onSignIn = vi.fn<() => void>();
  let root: Root;
  let container: HTMLElement;

  const open = async (): Promise<void> => {
    await act(async () => {
      root.render(
        <Leaderboard
          puzzleID={puzzle}
          width={5}
          height={5}
          onSignIn={onSignIn}
        />
      );
    });
  };

  const press = async (name: string): Promise<void> => {
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)
        ?.click();
    });
  };

  const pick = async (size: string): Promise<void> => {
    const select = container.querySelector(`select`);

    await act(async () => {
      if (select) {
        Object.getOwnPropertyDescriptor(
          HTMLSelectElement.prototype,
          `value`
        )?.set?.call(select, size);
        select.dispatchEvent(new Event(`change`, { bubbles: true }));
      }
    });
  };

  beforeEach(() => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    setPlayer(null);
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it(`lists who solved the puzzle`, async () => {
    serve({ [puzzle]: ranking(2) });
    await open();

    expect(container.textContent).toContain(`player0.test`);
    expect(container.textContent).toContain(`2 players posted a score.`);
  });

  it(`gets one player right`, async () => {
    serve({ [puzzle]: ranking(1) });
    await open();

    expect(container.textContent).toContain(`1 player posted a score.`);
  });

  it(`says how many more there are than it lists`, async () => {
    // "100 players" would be wrong, and would have someone in 150th place wondering where they went
    serve({ [puzzle]: ranking(150) });
    await open();

    expect(container.textContent).toContain(
      `150 players posted a score, and the top 100 are listed.`
    );
  });

  it(`shows a player where they stand beyond the end of the list`, async () => {
    setPlayer(alice);
    serve({
      [puzzle]: ranking(150, { ...alice, moves: 500, place: 150 })
    });
    await open();

    expect(container.textContent).toContain(`alice.test`);
    expect(container.querySelectorAll(`li`)).toHaveLength(101);
  });

  it(`doesn't list a player twice when they're among those listed`, async () => {
    const mine = { ...alice, moves: 1 };

    setPlayer(alice);
    serve({
      [puzzle]: { scores: [mine], total: 1, you: { ...mine, place: 1 } }
    });
    await open();

    expect(container.querySelectorAll(`li`)).toHaveLength(1);
  });

  it(`invites the first solve of today's puzzle`, async () => {
    serve({ [puzzle]: ranking(0) });
    await open();

    expect(container.textContent).toContain(
      `Be the first to solve today’s 5×5`
    );
  });

  it(`doesn't invite anyone to solve a day that's over`, async () => {
    serve({ [puzzle]: ranking(1), "11-06-2026_5x5": ranking(0) });
    await open();
    await press(`Earlier day`);

    expect(container.textContent).toContain(`Nobody posted a score`);
    expect(container.textContent).not.toContain(`Be the first`);
  });

  it(`says so when scores can't be loaded, rather than that there are none`, async () => {
    serve({});
    await open();

    expect(container.textContent).toContain(`Couldn’t load these scores`);
    expect(container.textContent).not.toContain(`No scores yet`);
  });

  it(`steps back through the days, and forward again`, async () => {
    serve({ [puzzle]: ranking(1), "11-06-2026_5x5": ranking(3) });
    await open();
    await press(`Earlier day`);

    expect(container.textContent).toContain(`3 players`);

    await press(`Later day`);

    expect(container.textContent).toContain(`Today`);
    expect(container.textContent).toContain(`1 player`);
  });

  it(`stops at today`, async () => {
    // There are no scores to come, and a later puzzle would be one that's yet to be played
    serve({ [puzzle]: ranking(1) });
    await open();

    expect(
      container.querySelector<HTMLButtonElement>(`[aria-label="Later day"]`)
        ?.disabled
    ).toBe(true);
  });

  it(`has a leaderboard for every size of board`, async () => {
    serve({ [puzzle]: ranking(1), "11-07-2026_8x6": ranking(7) });
    await open();
    await pick(`8x6`);

    expect(container.textContent).toContain(`7 players`);
  });

  it(`says where the player stands on each one`, async () => {
    // Without saying who is asking, the server can't say where they place
    setPlayer(alice);
    request.mockImplementation(async (_path, { query }) =>
      ranking(150, query.player ? { ...alice, moves: 500, place: 150 } : null)
    );
    await open();

    expect(container.textContent).toContain(`alice.test`);
  });

  it(`never shows a slow answer in place of a later choice`, async () => {
    // Scores for the wrong board, under the label of the right one, would be read as the truth
    const slow = Promise.withResolvers<object>();

    serve({ [puzzle]: slow.promise, "11-07-2026_8x6": ranking(7) });
    await open();
    await pick(`8x6`);
    await act(async () => {
      slow.resolve(ranking(1));
    });

    expect(container.textContent).toContain(`7 players`);
  });

  it(`goes back to loading while another board's scores are on their way`, async () => {
    // These scores would otherwise stay on show under the label of a board that they aren't for
    serve({ [puzzle]: ranking(2), "11-07-2026_8x6": new Promise(() => {}) });
    await open();
    await pick(`8x6`);

    expect(container.textContent).toContain(`Loading…`);
    expect(container.textContent).not.toContain(`2 players`);
  });

  it(`offers signing in to someone who hasn't`, async () => {
    serve({ [puzzle]: ranking(1) });
    await open();
    await act(async () => {
      [...container.querySelectorAll(`button`)]
        .find((button) => button.textContent === `Sign in to post scores`)
        ?.click();
    });

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it(`doesn't offer it to someone who has`, async () => {
    setPlayer(alice);
    serve({ [puzzle]: ranking(1) });
    await open();

    expect(container.textContent).not.toContain(`Sign in to post scores`);
  });
});
