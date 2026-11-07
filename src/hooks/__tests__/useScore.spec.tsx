// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { fetch } from "void/client";
import { SignedOutError } from "../../auth/errors";
import { getProof } from "../../auth/oauth";
import { setPlayer } from "../../auth/player";
import { MAX_MOVES } from "../../state";
import { getPuzzleID } from "../../utils/getPuzzleID";
import { getPuzzleStart } from "../../utils/isOpenForScores";
import { recordSolve } from "../../utils/solves";
import { SUBMIT_SCORE } from "../../utils/service";
import { useScore, type Score } from "../useScore";

/** Stands in for an answer from the server that isn't a success */
class FetchError extends Error {
  status: number;

  constructor(status: number) {
    super(`Request failed`);
    this.status = status;
  }
}

vi.mock(`void/client`, () => ({
  fetch: vi.fn<() => Promise<unknown>>(),
  // Hoisted above the class that it names, which exists by the time that this is read
  get FetchError() {
    return FetchError;
  }
}));

vi.mock(`../../auth/oauth`, () => ({
  getProof: vi.fn<() => Promise<string>>()
}));

interface Request {
  method?: string;
  body?: { puzzle: string; history: string[] };
  headers?: Record<string, string>;
}

const request = vi.mocked(
  fetch as unknown as (path: string, options: Request) => Promise<unknown>
);
const proof = vi.mocked(getProof);

/** Today's puzzle, which is the only one that a solve of can be posted */
const puzzle = getPuzzleID();
const history = [`bcaefd`, `abcefd`, `abcdef`];
const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const ranking = [{ did: alice.did, handle: alice.handle, moves: 2 }];

/** Every score that was sent to the server */
const posts = (): Request[] =>
  request.mock.calls
    .map(([, options]) => options)
    .filter(({ method }) => method === `POST`);

let score: Score;
/** The game that was played, for those that need to be something other than the usual one */
let played = history;

const Game: React.FC<{ win: boolean }> = ({ win }) => {
  // oxlint-disable-next-line react/globals -- hands the hook's result to the tests, which then read it
  score = useScore(puzzle, win, played);

  return <output>{score.status}</output>;
};

describe(`useScore`, () => {
  let root: Root;
  let container: HTMLElement;

  const render = async (win: boolean): Promise<void> => {
    await act(async () => {
      root.render(<Game win={win} />);
    });
  };

  beforeEach(() => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
    // The leaderboard is read with a GET, and a score is posted with a POST
    request.mockImplementation(async (_path, { method }) =>
      method === `POST` ? ranking[0] : ranking
    );
    proof.mockResolvedValue(`a-token`);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    setPlayer(null);
    localStorage.clear();
    played = history;
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it(`does nothing while the puzzle is still being played`, async () => {
    // Every request counts against a daily allowance, and none is needed until there is a solve to report
    setPlayer(alice);
    await render(false);

    expect(request).not.toHaveBeenCalled();
    expect(score.status).toBeNull();
  });

  it(`waits for the player to say who they are`, async () => {
    // Playing never requires an account, so a solve is held rather than sent
    await render(true);

    expect(score.status).toBe(`signed-out`);
    expect(score.scores).toStrictEqual(ranking);
    expect(posts()).toHaveLength(0);
  });

  it(`posts the solve of a player who is signed in`, async () => {
    setPlayer(alice);
    await render(true);

    expect(score.status).toBe(`posted`);
    // The whole game is sent, as the server scores it by replaying it, along with proof of who played it
    expect(posts()).toStrictEqual([
      {
        method: `POST`,
        body: { puzzle, history },
        headers: { authorization: `Bearer a-token` }
      }
    ]);
    expect(proof).toHaveBeenCalledExactlyOnceWith(alice.did, SUBMIT_SCORE);
  });

  it(`posts a solve once the player signs in afterwards`, async () => {
    // Signing in is only asked for at the moment that it's needed, which is after the puzzle is solved
    await render(true);
    await act(async () => {
      setPlayer(alice);
    });

    expect(score.status).toBe(`posted`);
    expect(posts()).toHaveLength(1);
  });

  it(`posts a solve only once`, async () => {
    // A solved puzzle is found solved again every time that it's opened
    setPlayer(alice);
    await render(true);
    await act(async () => {
      root.unmount();
    });
    root = createRoot(container);
    await render(true);

    expect(score.status).toBe(`posted`);
    expect(posts()).toHaveLength(1);
  });

  it(`doesn't post a solve that was made after the puzzle's day ended`, async () => {
    // The server would turn it away, so sending it would only spend a request to be told so
    vi.useFakeTimers({ toFake: [`Date`] });
    vi.setSystemTime(Date.now() + 2 * 24 * 60 * 60 * 1000);
    setPlayer(alice);
    await render(true);

    expect(score.status).toBe(`closed`);
    expect(posts()).toHaveLength(0);
  });

  it(`says so when the player's sign-in has run out`, async () => {
    // The player has to sign in again, which trying again on their behalf can't do
    proof.mockRejectedValue(new SignedOutError());
    setPlayer(alice);
    await render(true);

    expect(score.status).toBe(`expired`);
    expect(posts()).toHaveLength(0);
  });

  it(`takes the server's word for it that a puzzle's leaderboard has closed`, async () => {
    // A device whose clock is wrong can believe that a solve is in time when it isn't
    request.mockImplementation(async (_path, { method }) => {
      if (method === `POST`) throw new FetchError(403);
      return ranking;
    });
    setPlayer(alice);
    await render(true);

    expect(score.status).toBe(`missed`);
  });

  it(`doesn't say that a player finished late when it was the posting that was`, async () => {
    // They solved it in time, and being told otherwise would be wrong as well as unkind
    setPlayer(alice);
    recordSolve(puzzle, alice.did);
    vi.useFakeTimers({ toFake: [`Date`] });
    vi.setSystemTime(Date.now() + 2 * 24 * 60 * 60 * 1000);
    await render(true);

    expect(score.status).toBe(`missed`);
    expect(posts()).toHaveLength(0);
  });

  it(`posts a solve from a device whose clock is behind`, async () => {
    // The server gave them the puzzle, so their solve happened during its day whatever their clock says
    vi.useFakeTimers({ toFake: [`Date`] });
    vi.setSystemTime(getPuzzleStart(puzzle) - 5 * 60 * 1000);
    setPlayer(alice);
    await render(true);

    expect(posts()).toHaveLength(1);
  });

  it(`doesn't offer to post a game that's too long to be checked`, async () => {
    // The server would turn it away every time, so trying again could only ever disappoint
    played = Array.from({ length: MAX_MOVES + 2 }, () => `abcdef`);
    setPlayer(alice);
    await render(true);

    expect(score.status).toBe(`too-long`);
    expect(posts()).toHaveLength(0);
  });

  it(`forgets what became of a solve once it's no longer on the board`, async () => {
    // What was posted as one player says nothing about the game of whoever comes next
    setPlayer(alice);
    await render(true);

    expect(score.status).toBe(`posted`);

    await render(false);

    expect(score.status).toBeNull();
  });

  it(`can try again to post a solve that didn't get through`, async () => {
    // A lost connection shouldn't cost a player their place, so long as the puzzle's day hasn't ended
    request.mockImplementationOnce(async () => ranking);
    request.mockImplementationOnce(async () => {
      throw new FetchError(500);
    });
    setPlayer(alice);
    await render(true);

    expect(score.status).toBe(`failed`);
    // What went wrong is kept, for whoever has to work out why
    expect(score.detail).toBe(`The server answered 500`);

    await act(async () => {
      score.retry();
    });

    expect(score.status).toBe(`posted`);
    expect(posts()).toHaveLength(2);
  });
});
