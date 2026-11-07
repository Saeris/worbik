import { delay, http } from "msw";
import { page } from "vite-plus/test/browser";
import { render } from "vitest-browser-react";
import { DeleteAccount } from "#components/DeleteAccount";
import { Profile } from "#components/Profile";
import { PuzzleState, type PuzzleStateInit } from "#state";
import { body } from "#test/game";
import { network } from "#test/network";
import { signInAs } from "#test/session";
import { getPuzzleID } from "#utils";
import { usePuzzle } from "../usePuzzleState";
import { useScore, type Score } from "../useScore";

// The real limit is ten seconds, and what's being tested is that there is one
vi.mock(`#utils/withTimeout`, async (importOriginal) => ({
  ...(await importOriginal<object>()),
  REQUEST_TIMEOUT: 50
}));

const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const solution = `abcdef`;
const init: PuzzleStateInit = [
  3 as PuzzleStateInit[0],
  PuzzleState.compare(`bcaefd`, solution),
  2
];

/** Has a route take in a request and never answer it, as one does over a connection that has quietly died */
const hang = (route: ReturnType<typeof http.get>): void => {
  network.use(route);
};

const silence = async (): Promise<undefined> => {
  await delay(`infinite`);

  return undefined;
};

describe(`a request that never gets an answer`, () => {
  const nothing = vi.fn<() => void>();

  beforeEach(() => {
    vi.spyOn(console, `error`).mockImplementation(() => {});
  });

  it(`says that a move couldn't be checked`, async () => {
    let puzzle: ReturnType<typeof usePuzzle> | undefined;

    const Board: React.FC = () => {
      // oxlint-disable-next-line react/globals -- hands the hook's result to the test, which then drives it
      puzzle = usePuzzle(`12-31-2099_3x2`, init, false);

      return null;
    };

    hang(http.get(`*/api/check`, silence));
    await render(<Board />);
    puzzle?.rotate(0, `right`);

    await expect.poll(() => puzzle?.stalled).toBe(true);
  });

  it(`says that a score couldn't be posted`, async () => {
    let score: Score | undefined;
    const history = [`bcaefd`, `abcefd`, `abcdef`];

    const Solved: React.FC = () => {
      // oxlint-disable-next-line react/globals -- hands the hook's result to the test, which then reads it
      score = useScore(getPuzzleID(), true, history);

      return null;
    };

    hang(http.post(`*/api/scores`, silence));
    await signInAs(alice);
    await render(<Solved />);

    await expect.poll(() => score?.status).toBe(`failed`);
  });

  it(`says that a profile couldn't be loaded`, async () => {
    hang(http.get(`*/api/profile`, silence));
    await signInAs(alice);
    await render(<Profile onSignIn={nothing} />);

    await expect.element(body).toMatchTextContent(`Couldn’t load your profile`);
  });

  it(`says that a player's data couldn't be deleted`, async () => {
    hang(http.delete(`*/api/account`, silence));
    await signInAs(alice);
    await render(<DeleteAccount onSignIn={nothing} />);
    await page.getByRole(`textbox`).fill(alice.handle);
    await page.getByRole(`button`, { name: `Delete my Worbik data` }).click();

    await expect
      .element(body)
      .toMatchTextContent(`Couldn’t delete your Worbik data`);
  });
});
