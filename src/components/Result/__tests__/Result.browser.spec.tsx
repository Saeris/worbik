import { page } from "vite-plus/test/browser";
import { render } from "vitest-browser-react";
import { setPlayer } from "#auth/player";
import type { Ranking } from "#hooks";
import { body } from "#test/game";
import { Result, type ResultProps } from "../Result";

const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const alices = { did: alice.did, handle: alice.handle, moves: 2 };
const ranking: Ranking = {
  scores: [alices],
  total: 1,
  you: { ...alices, place: 1 }
};

describe(`result`, () => {
  const retry = vi.fn<() => void>();
  const onSignIn = vi.fn<() => void>();
  const onLeaderboard = vi.fn<() => void>();
  const tryAgain = page.getByRole(`button`, { name: /^Try(ing)? again/u });
  const today = page.getByRole(`link`, { name: `Play today’s 5×5` });

  const show = async (props: Partial<ResultProps>): Promise<void> => {
    await render(
      <Result
        puzzleID="11-07-2026_5x5"
        width={5}
        height={5}
        moves={2}
        target={3}
        status="posted"
        ranking={ranking}
        detail={null}
        retrying={false}
        retry={retry}
        onLeaderboard={onLeaderboard}
        onSignIn={onSignIn}
        {...props}
      />
    );
  };

  const says = async (words: string): Promise<void> => {
    await expect.element(body).toMatchTextContent(words);
  };

  beforeEach(() => {
    setPlayer(alice);
  });

  it(`says where a posted score placed`, async () => {
    await show({});

    await says(`1st of 1 today`);
    await expect.element(tryAgain).not.toBeInTheDocument();
  });

  it(`offers another try when the leaderboard couldn't be loaded`, async () => {
    // Left alone, a player whose score was posted would be told nothing about it, and wouldn't know that anything had gone wrong
    await show({ ranking: null });

    await says(`Your score is posted`);

    await tryAgain.click();

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it(`keeps the score on a shared link when the leaderboard couldn't be loaded`, async () => {
    // The score is posted either way, and the link finds it by who the player is
    await show({ ranking: null });
    await page.getByRole(`button`, { name: `Share`, exact: true }).click();

    await says(`/s/11-07-2026/5x5/${alice.did}`);
  });

  it(`won't try again while it's already trying`, async () => {
    await show({ ranking: null, retrying: true });

    await expect.element(tryAgain).toBeDisabled();
    await expect.element(tryAgain).toHaveTextContent(`Trying again…`);
  });

  it(`keeps a failure on show while the solve is posted again`, async () => {
    // The whole result would jump otherwise, at the moment that the button is pressed
    await show({ status: `posting`, ranking: null, retrying: true });

    await says(`Couldn’t post your score`);
  });

  it.each([
    // It wasn't their doing that the post came too late, and being told that they finished late would be wrong as well as unkind
    [`closed`, `day ended before you finished`],
    [`missed`, `closed before your score could be`],
    [`too-long`, `can be ranked`]
  ] as const)(
    `explains what became of a solve that's %s`,
    async (status, words) => {
      await show({ status, ranking: null });

      await says(words);
    }
  );

  it.each([`closed`, `missed`] as const)(
    `points to today's puzzle once a solve is %s`,
    async (status) => {
      // Nothing more can be done with this one, and a new day's is waiting
      await show({ status, ranking: null });

      await expect.element(today).toBeVisible();
    }
  );

  it(`doesn't send a player off to today's puzzle while a solve still counts`, async () => {
    await show({ status: `failed`, ranking: null });

    await says(`Couldn’t post your score`);
    await expect.element(today).not.toBeInTheDocument();
  });

  it(`asks a player whose sign-in has run out to sign in again`, async () => {
    await show({ status: `expired`, ranking: null });

    await says(`Your sign-in has run out`);

    await page.getByRole(`button`, { name: `Sign in again` }).click();

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it(`says nothing of the leaderboard before a score is posted`, async () => {
    // There's nothing wrong with a leaderboard that nobody has asked for yet
    await show({ status: `posting`, ranking: null });

    await says(`Posting your score…`);
    await expect
      .element(body)
      .not.toMatchTextContent(`Couldn’t load the leaderboard`);
  });
});
