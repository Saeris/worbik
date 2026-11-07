// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { fetch } from "void/client";
import { getProof } from "../../auth/oauth";
import { getPlayer, setPlayer } from "../../auth/player";
import { getProgress } from "../../utils/progress";
import { GET_SOLVES } from "../../utils/service";
import { getGameKey, recordSolve } from "../../utils/solves";
import { usePostedGames } from "../usePostedGames";

/** Stands in for a sign-in that has run out, or that doesn't cover what's being asked */
class SignedOutError extends Error {}

vi.mock(`void/client`, () => ({ fetch: vi.fn<() => Promise<unknown>>() }));

vi.mock(`../../auth/oauth`, () => ({
  getProof: vi.fn<() => Promise<string>>(),
  // Hoisted above the class that it names, which exists by the time that this is read
  get SignedOutError() {
    return SignedOutError;
  }
}));

interface Request {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

const request = vi.mocked(
  fetch as unknown as (path: string, options: Request) => Promise<unknown>
);
const proof = vi.mocked(getProof);

const day = `11-06-2026`;
const puzzle = `${day}_5x5`;
const other = `${day}_6x5`;
const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const solved = {
  puzzle,
  moves: 42,
  challenge: `Bcaefd`,
  solution: `abcdef`
};

/** A game of the puzzle above that is saved on this device, having been solved in the given number of moves */
const savedSolve = (moves: number): string =>
  `3|bcaefd,${`bcaefd,`.repeat(moves - 1)}abcdef|ABCDEF`;

/** Answers as the server would for a player with the given games posted */
const serve = (...games: (typeof solved)[]): void => {
  request.mockImplementation(async (_path, { method }) =>
    method === `POST`
      ? games
      : games.map(({ puzzle: id, moves }) => ({ puzzle: id, moves }))
  );
};

/** Every request for the solutions to a day's puzzles */
const fetches = (): Request[] =>
  request.mock.calls
    .map(([, options]) => options)
    .filter(({ method }) => method === `POST`);

describe(`usePostedGames`, () => {
  const resume = vi.fn<(saved: string | null) => void>();
  let root: Root;
  let container: HTMLElement;

  const Game: React.FC<{ win?: boolean }> = ({ win = false }) => {
    usePostedGames(puzzle, win, resume);

    return null;
  };

  const render = async (win?: boolean): Promise<void> => {
    await act(async () => {
      root.render(<Game win={win} />);
    });
  };

  beforeEach(() => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
    proof.mockResolvedValue(`a-token`);
    serve();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    setPlayer(null);
    localStorage.clear();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it(`asks nothing about someone who hasn't signed in`, async () => {
    // There is nobody to ask about, and every request counts against a daily allowance
    await render();

    expect(request).not.toHaveBeenCalled();
  });

  it(`puts a puzzle that was solved on another device in its solved state`, async () => {
    // This is the bug: a player could sign in on a second device and play the day's puzzle again
    serve(solved);
    setPlayer(alice);
    await render();

    expect(resume).toHaveBeenCalledExactlyOnceWith(`5|bcaefd,abcdef|ABCDEF|42`);
  });

  it(`asks for the solutions with proof of who is asking`, async () => {
    // Leaderboards name who has solved a puzzle, so anyone could name a player. Only the player can prove to be them.
    serve(solved);
    setPlayer(alice);
    await render();

    expect(proof).toHaveBeenCalledExactlyOnceWith(alice.did, GET_SOLVES);
    expect(fetches()).toStrictEqual([
      {
        method: `POST`,
        body: { day },
        headers: { authorization: `Bearer a-token` }
      }
    ]);
  });

  it(`brings the rest of the day's puzzles up to date as well`, async () => {
    // Otherwise the list of the day's puzzles would show them as unplayed, and each could be played again
    serve(solved, { ...solved, puzzle: other, moves: 7 });
    setPlayer(alice);
    await render();

    expect(
      getProgress(localStorage.getItem(getGameKey(other, alice.did)))
    ).toStrictEqual({
      moves: 7,
      solved: true
    });
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it(`never posts a solve that came from another device`, async () => {
    // It's already on the leaderboard
    serve(solved);
    setPlayer(alice);
    await render();

    expect(recordSolve(puzzle, alice.did).posted).toBe(true);
  });

  it(`takes what was posted over a different solve on this device`, async () => {
    // A player's first solve is the one that's kept, so that is the score they have
    localStorage.setItem(getGameKey(puzzle, alice.did), savedSolve(30));
    serve(solved);
    setPlayer(alice);
    await render();

    expect(resume).toHaveBeenCalledExactlyOnceWith(`5|bcaefd,abcdef|ABCDEF|42`);
  });

  it(`asks for no proof when this device is up to date`, async () => {
    // This is what happens nearly every time, and asking means a trip to the server that hosts their account
    localStorage.setItem(getGameKey(puzzle, alice.did), savedSolve(42));
    serve(solved);
    setPlayer(alice);
    await render();

    expect(proof).not.toHaveBeenCalled();
    expect(fetches()).toHaveLength(0);
    expect(resume).not.toHaveBeenCalled();
  });

  it(`leaves a game under way alone when nothing has been posted`, async () => {
    setPlayer(alice);
    await render();

    expect(fetches()).toHaveLength(0);
    expect(resume).not.toHaveBeenCalled();
  });

  it(`looks again once the puzzle is solved`, async () => {
    // The first look may have failed, or the other device may have been used since
    setPlayer(alice);
    await render();
    serve(solved);
    await render(true);

    expect(resume).toHaveBeenCalledTimes(1);
  });

  it(`signs out a player whose sign-in can't fetch their games`, async () => {
    // They signed in before this was needed, and signing in again is the only way to bring this device up to date
    proof.mockRejectedValue(new SignedOutError());
    serve(solved);
    setPlayer(alice);
    await render();

    expect(getPlayer()).toBeNull();
  });

  it(`stays signed in when the server can't be reached`, async () => {
    // A lost connection says nothing about their sign-in
    request.mockRejectedValue(new Error(`Offline`));
    setPlayer(alice);
    await render();

    expect(getPlayer()).toStrictEqual(alice);
  });
});
