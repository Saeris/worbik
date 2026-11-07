// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { setPlayer } from "../../../auth/player";
import type { Ranking } from "../../../hooks";
import { Result, type ResultProps } from "../Result";

vi.mock(`void/client`, () => ({
  fetch: vi.fn<() => Promise<unknown>>(),
  FetchError: class extends Error {}
}));

const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const alices = { did: alice.did, handle: alice.handle, moves: 2 };
const ranking: Ranking = {
  scores: [alices],
  total: 1,
  you: { ...alices, place: 1 }
};

describe(`result`, () => {
  const retry = vi.fn<() => void>();
  const nothing = vi.fn<() => void>();
  let root: Root;
  let container: HTMLElement;

  const render = async (props: Partial<ResultProps>): Promise<void> => {
    await act(async () => {
      root.render(
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
          onLeaderboard={nothing}
          onSignIn={nothing}
          {...props}
        />
      );
    });
  };

  const getRetry = (): HTMLButtonElement | undefined =>
    [...container.querySelectorAll(`button`)].find((button) =>
      /Try(ing)? again/u.test(button.textContent)
    );

  beforeEach(() => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
    setPlayer(alice);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    setPlayer(null);
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it(`says where a posted score placed`, async () => {
    await render({});

    expect(container.textContent).toContain(`1st of 1 today`);
    expect(getRetry()).toBeUndefined();
  });

  it(`offers another try when the leaderboard couldn't be loaded`, async () => {
    // Left alone, a player whose score was posted would be told nothing about it, and wouldn't know that anything had gone wrong
    await render({ ranking: null });

    expect(container.textContent).toContain(`Your score is posted`);

    await act(async () => {
      getRetry()?.click();
    });

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it(`won't try again while it's already trying`, async () => {
    await render({ ranking: null, retrying: true });

    expect(getRetry()?.disabled).toBe(true);
    expect(getRetry()?.textContent).toBe(`Trying again…`);
  });

  it(`keeps a failure on show while the solve is posted again`, async () => {
    // The whole result would jump otherwise, at the moment that the button is pressed
    await render({ status: `posting`, ranking: null, retrying: true });

    expect(container.textContent).toContain(`Couldn’t post your score`);
  });

  it(`says nothing of the leaderboard before a score is posted`, async () => {
    // There's nothing wrong with a leaderboard that nobody has asked for yet
    await render({ status: `posting`, ranking: null });

    expect(container.textContent).not.toContain(
      `Couldn’t load the leaderboard`
    );
  });
});
