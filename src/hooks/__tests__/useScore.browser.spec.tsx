import { delay, http, HttpResponse } from "msw";
import { render } from "vitest-browser-react";
import { setPlayer } from "#auth/player";
import { MAX_MOVES } from "#state";
import { neverHappens } from "#test/game";
import { network } from "#test/network";
import { signInAs } from "#test/session";
import { getPuzzleID } from "#utils/getPuzzleID";
import { getPuzzleStart } from "#utils/isOpenForScores";
import { SUBMIT_SCORE } from "#utils/service";
import { recordSolve } from "#utils/solves";
import { useScore, type Score } from "../useScore";

/** Today's puzzle, which is the only one that a solve of can be posted */
const puzzle = getPuzzleID();
const history = [`bcaefd`, `abcefd`, `abcdef`];
const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const alices = { did: alice.did, handle: alice.handle, moves: 2 };
const ranking = { scores: [alices], total: 1, you: { ...alices, place: 1 } };

let score: Score;
/** The game that was played, for those that need to be something other than the usual one */
let played = history;

const Game: React.FC<{ win: boolean }> = ({ win }) => {
  // oxlint-disable-next-line react/globals -- hands the hook's result to the tests, which then read it
  score = useScore(puzzle, win, played);

  return <output>{score.status}</output>;
};

describe(`useScore`, () => {
  /** Every score that reached the server, along with what it was sent with */
  let posts: { body: unknown; authorization: string | null }[];
  /** How many times a leaderboard was read */
  let reads: number;

  const settled = async (status: Score[`status`]): Promise<void> => {
    await expect.poll(() => score.status).toBe(status);
  };

  beforeEach(() => {
    vi.spyOn(console, `error`).mockImplementation(() => {});
    posts = [];
    reads = 0;
    played = history;
    network.use(
      http.get(`*/api/ranking`, () => {
        reads += 1;

        return HttpResponse.json(ranking);
      }),
      http.post(`*/api/scores`, async ({ request }) => {
        posts.push({
          body: await request.json(),
          authorization: request.headers.get(`authorization`)
        });

        return HttpResponse.json(alices);
      })
    );
  });

  it(`does nothing while the puzzle is still being played`, async () => {
    // Every request counts against a daily allowance, and none is needed until there is a solve to report
    await signInAs(alice);
    await render(<Game win={false} />);

    await neverHappens(() => reads + posts.length > 0);
    expect(score.status).toBeNull();
  });

  it(`waits for the player to say who they are`, async () => {
    // Playing never requires an account, so a solve is held rather than sent
    await render(<Game win />);

    await settled(`signed-out`);
    expect(score.ranking).toStrictEqual(ranking);
    expect(posts).toHaveLength(0);
  });

  it(`posts the solve of a player who is signed in`, async () => {
    await signInAs(alice);
    await render(<Game win />);

    await settled(`posted`);
    // The whole game is sent, as the server scores it by replaying it, along with proof of who played it
    expect(posts).toStrictEqual([
      {
        body: { puzzle, history },
        authorization: `Bearer proof-of-${SUBMIT_SCORE}`
      }
    ]);
  });

  it(`posts a solve once the player signs in afterwards`, async () => {
    // Signing in is only asked for at the moment that it's needed, which is after the puzzle is solved
    await render(<Game win />);
    await settled(`signed-out`);
    await signInAs(alice);

    await settled(`posted`);
    expect(posts).toHaveLength(1);
  });

  it(`posts a solve only once`, async () => {
    // A solved puzzle is found solved again every time that it's opened
    await signInAs(alice);

    const { unmount } = await render(<Game win />);

    await settled(`posted`);
    await unmount();
    await render(<Game win />);

    await settled(`posted`);
    expect(posts).toHaveLength(1);
  });

  it(`doesn't post a solve that was made after the puzzle's day ended`, async () => {
    // The server would turn it away, so sending it would only spend a request to be told so
    vi.useFakeTimers({ toFake: [`Date`] });
    vi.setSystemTime(Date.now() + 2 * 24 * 60 * 60 * 1000);
    await signInAs(alice);
    await render(<Game win />);

    await settled(`closed`);
    expect(posts).toHaveLength(0);
  });

  it(`says so when the player's sign-in has run out`, async () => {
    // The player has to sign in again, which trying again on their behalf can't do
    setPlayer(alice);
    await render(<Game win />);

    await settled(`expired`);
    expect(posts).toHaveLength(0);
  });

  it(`takes the server's word for it that a puzzle's leaderboard has closed`, async () => {
    // A device whose clock is wrong can believe that a solve is in time when it isn't
    network.use(
      http.post(`*/api/scores`, () =>
        HttpResponse.json({ message: `Closed` }, { status: 403 })
      )
    );
    await signInAs(alice);
    await render(<Game win />);

    await settled(`missed`);
  });

  it(`doesn't say that a player finished late when it was the posting that was`, async () => {
    // They solved it in time, and being told otherwise would be wrong as well as unkind
    await signInAs(alice);
    recordSolve(puzzle, alice.did);
    vi.useFakeTimers({ toFake: [`Date`] });
    vi.setSystemTime(Date.now() + 2 * 24 * 60 * 60 * 1000);
    await render(<Game win />);

    await settled(`missed`);
    expect(posts).toHaveLength(0);
  });

  it(`posts a solve from a device whose clock is behind`, async () => {
    // The server gave them the puzzle, so their solve happened during its day whatever their clock says
    await signInAs(alice);
    vi.useFakeTimers({ toFake: [`Date`] });
    vi.setSystemTime(getPuzzleStart(puzzle) - 5 * 60 * 1000);
    await render(<Game win />);

    await settled(`posted`);
    expect(posts).toHaveLength(1);
  });

  it(`doesn't offer to post a game that's too long to be checked`, async () => {
    // The server would turn it away every time, so trying again could only ever disappoint
    played = Array.from({ length: MAX_MOVES + 2 }, () => `abcdef`);
    await signInAs(alice);
    await render(<Game win />);

    await settled(`too-long`);
    expect(posts).toHaveLength(0);
  });

  it(`forgets what became of a solve once it's no longer on the board`, async () => {
    // What was posted as one player says nothing about the game of whoever comes next
    await signInAs(alice);

    const { rerender } = await render(<Game win />);

    await settled(`posted`);
    await rerender(<Game win={false} />);

    await settled(null);
  });

  it(`can try again to post a solve that didn't get through`, async () => {
    // A lost connection shouldn't cost a player their place, so long as the puzzle's day hasn't ended
    network.use(
      http.post(
        `*/api/scores`,
        () => HttpResponse.json({ message: `Broken` }, { status: 500 }),
        { once: true }
      )
    );
    await signInAs(alice);
    await render(<Game win />);

    await settled(`failed`);
    // What went wrong is kept, for whoever has to work out why
    expect(score.detail).toBe(`The server answered 500: Broken`);

    score.retry();

    await settled(`posted`);
    expect(posts).toHaveLength(1);
  });

  it(`doesn't let a leaderboard that won't load hold up a solve`, async () => {
    // Waiting on it first meant that one slow answer could keep a score from ever being sent
    network.use(
      http.get(`*/api/ranking`, async () => {
        await delay(`infinite`);
      })
    );
    await signInAs(alice);
    await render(<Game win />);

    await expect.poll(() => posts).toHaveLength(1);
  });

  it(`reads the leaderboard once for each solve that it posts`, async () => {
    // It's only worth reading once the score is on it, and every request counts against a daily allowance
    await signInAs(alice);
    await render(<Game win />);

    await settled(`posted`);
    expect(reads).toBe(1);
  });

  it(`can load a leaderboard that didn't load the first time`, async () => {
    // The score is safe by then, so it's only the leaderboard that needs asking for again
    network.use(
      http.get(`*/api/ranking`, () => HttpResponse.error(), { once: true }),
      http.get(`*/api/ranking`, () => HttpResponse.error(), { once: true })
    );
    await signInAs(alice);
    await render(<Game win />);

    await settled(`posted`);
    expect(score.ranking).toBeNull();

    score.retry();

    await expect.poll(() => score.ranking).toStrictEqual(ranking);
    expect(score.retrying).toBe(false);
    expect(posts).toHaveLength(1);
  });

  it(`says that another try is under way until it has finished`, async () => {
    // Pressing a button that seems to do nothing only gets it pressed again
    network.use(
      http.get(`*/api/ranking`, () => HttpResponse.error(), { once: true }),
      http.get(`*/api/ranking`, () => HttpResponse.error(), { once: true })
    );
    await signInAs(alice);
    await render(<Game win />);
    await settled(`posted`);

    const held = Promise.withResolvers<undefined>();

    network.use(
      http.get(`*/api/ranking`, async () => {
        await held.promise;

        return HttpResponse.json(ranking);
      })
    );
    score.retry();

    await expect.poll(() => score.retrying).toBe(true);

    held.resolve(undefined);

    await expect.poll(() => score.retrying).toBe(false);
  });
});
