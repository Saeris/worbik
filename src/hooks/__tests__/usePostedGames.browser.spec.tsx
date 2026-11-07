import { http, HttpResponse } from "msw";
import { render } from "vitest-browser-react";
import { getPlayer, setPlayer } from "#auth/player";
import { neverHappens } from "#test/game";
import { PDS } from "#test/handlers";
import { network } from "#test/network";
import { signInAs } from "#test/session";
import { getProgress } from "#utils/progress";
import { GET_SOLVES, OAUTH_SCOPE } from "#utils/service";
import { getGameKey, recordSolve } from "#utils/solves";
import { usePostedGames } from "../usePostedGames";

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

describe(`usePostedGames`, () => {
  const resume = vi.fn<(saved: string | null) => void>();
  /** Every request for a list of what was posted, and for the games themselves */
  let lists = 0;
  let fetches: { authorization: string | null; body: unknown }[];

  const Game: React.FC<{ win?: boolean }> = ({ win = false }) => (
    <p>{usePostedGames(puzzle, win, resume) ? `Sign in again` : null}</p>
  );

  /** Answers as the server would for a player with the given games posted */
  const serve = (...games: (typeof solved)[]): void => {
    network.use(
      http.get(`*/api/solves`, () => {
        lists += 1;

        return HttpResponse.json(
          games.map(({ puzzle: id, moves }) => ({ puzzle: id, moves }))
        );
      }),
      http.post(`*/api/solves`, async ({ request }) => {
        fetches.push({
          authorization: request.headers.get(`authorization`),
          body: await request.json()
        });

        return HttpResponse.json(games);
      })
    );
  };

  const shown = (): string | null | undefined =>
    document.querySelector(`p`)?.textContent;

  beforeEach(() => {
    lists = 0;
    fetches = [];
    serve();
  });

  it(`asks nothing about someone who hasn't signed in`, async () => {
    // There is nobody to ask about, and every request counts against a daily allowance
    await render(<Game />);

    await neverHappens(() => lists > 0);
  });

  it(`puts a puzzle that was solved on another device in its solved state`, async () => {
    // This is the bug: a player could sign in on a second device and play the day's puzzle again
    serve(solved);
    await signInAs(alice);
    await render(<Game />);

    await expect
      .poll(() => resume.mock.calls)
      .toStrictEqual([[`5|bcaefd,abcdef|ABCDEF|42`]]);
  });

  it(`asks for the solutions with proof of who is asking`, async () => {
    // Leaderboards name who has solved a puzzle, so anyone could name a player. Only the player can prove to be them.
    serve(solved);
    await signInAs(alice);
    await render(<Game />);

    await expect
      .poll(() => fetches)
      .toStrictEqual([
        { authorization: `Bearer proof-of-${GET_SOLVES}`, body: { day } }
      ]);
  });

  it(`brings the rest of the day's puzzles up to date as well`, async () => {
    // Otherwise the list of the day's puzzles would show them as unplayed, and each could be played again
    serve(solved, { ...solved, puzzle: other, moves: 7 });
    await signInAs(alice);
    await render(<Game />);

    await expect
      .poll(() =>
        getProgress(localStorage.getItem(getGameKey(other, alice.did)))
      )
      .toStrictEqual({ moves: 7, solved: true });
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it(`never posts a solve that came from another device`, async () => {
    // It's already on the leaderboard
    serve(solved);
    await signInAs(alice);
    await render(<Game />);

    await expect.poll(() => resume.mock.calls).toHaveLength(1);
    expect(recordSolve(puzzle, alice.did).posted).toBe(true);
  });

  it(`takes what was posted over a different solve on this device`, async () => {
    // A player's first solve is the one that's kept, so that is the score they have
    localStorage.setItem(getGameKey(puzzle, alice.did), savedSolve(30));
    serve(solved);
    await signInAs(alice);
    await render(<Game />);

    await expect
      .poll(() => resume.mock.calls)
      .toStrictEqual([[`5|bcaefd,abcdef|ABCDEF|42`]]);
  });

  it(`asks for no proof when this device is up to date`, async () => {
    // This is what happens nearly every time, and asking means a trip to the server that hosts their account
    let vouched = 0;

    network.use(
      http.get(`${PDS}/xrpc/com.atproto.server.getServiceAuth`, () => {
        vouched += 1;

        return HttpResponse.json({ token: `a-token` });
      })
    );
    localStorage.setItem(getGameKey(puzzle, alice.did), savedSolve(42));
    serve(solved);
    await signInAs(alice);
    await render(<Game />);

    await expect.poll(() => lists).toBe(1);
    await neverHappens(() => vouched > 0 || fetches.length > 0);
    expect(resume).not.toHaveBeenCalled();
  });

  it(`leaves a game under way alone when nothing has been posted`, async () => {
    await signInAs(alice);
    await render(<Game />);

    await expect.poll(() => lists).toBe(1);
    await neverHappens(() => fetches.length > 0);
    expect(resume).not.toHaveBeenCalled();
  });

  it(`looks again once the puzzle is solved`, async () => {
    // The first look may have failed, or the other device may have been used since
    await signInAs(alice);

    const { rerender } = await render(<Game />);

    await expect.poll(() => lists).toBe(1);
    serve(solved);
    await rerender(<Game win />);

    await expect.poll(() => resume.mock.calls).toHaveLength(1);
  });

  describe(`when a sign-in can't fetch a player's games`, () => {
    beforeEach(() => {
      serve(solved);
    });

    it(`asks them to sign in again when there's no session`, async () => {
      // Signing in again is the only way to bring this device up to date, so it has to be said
      setPlayer(alice);
      await render(<Game />);

      await expect.poll(shown).toBe(`Sign in again`);
    });

    it(`does the same for a sign-in from before this was needed`, async () => {
      await signInAs(alice, OAUTH_SCOPE.replace(GET_SOLVES, `a-method`));
      await render(<Game />);

      await expect.poll(shown).toBe(`Sign in again`);
    });

    it(`leaves the player signed in until they do`, async () => {
      // Signing them out would swap the game they're playing for a different one, with nothing to say why
      setPlayer(alice);
      await render(<Game />);

      await expect.poll(shown).toBe(`Sign in again`);
      expect(getPlayer()).toStrictEqual(alice);
    });

    it(`doesn't ask the next player to sign in again`, async () => {
      // It was the last player's sign-in that ran out, and this one's is fine
      setPlayer(alice);
      await render(<Game />);
      await expect.poll(shown).toBe(`Sign in again`);
      serve();
      setPlayer({ did: `did:plc:bob`, handle: `bob.test` });

      await expect.poll(shown).toBe(``);
    });
  });

  it(`says nothing when the server can't be reached`, async () => {
    // A lost connection says nothing about their sign-in, and asking them to sign in wouldn't help
    network.use(http.get(`*/api/solves`, () => HttpResponse.error()));
    setPlayer(alice);
    await render(<Game />);

    await neverHappens(() => shown() !== ``);
    expect(getPlayer()).toStrictEqual(alice);
  });
});
