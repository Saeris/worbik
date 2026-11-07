// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { fetch } from "void/client";
import { setPlayer } from "../../auth/player";
import { getPuzzleID } from "../../utils";
import { useScore, type Score } from "../useScore";

vi.mock(`void/client`, () => ({
  fetch: vi.fn<() => Promise<unknown>>(),
  FetchError: class extends Error {}
}));

// What a page sees once a deployment has replaced the file that it would have fetched
vi.mock(`../../auth/oauth`, () => {
  throw new TypeError(`Failed to fetch dynamically imported module`);
});

const history = [`bcaefd`, `abcefd`, `abcdef`];
let score: Score;

const Solved: React.FC = () => {
  // oxlint-disable-next-line react/globals -- hands the hook's result to the test, which then reads it
  score = useScore(getPuzzleID(), true, history);

  return null;
};

describe(`useScore`, () => {
  it(`says so when the code for posting a score can't be fetched`, async () => {
    // This used to fail while working out why it had failed, and left the player watching "Posting your score…" for good
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    vi.spyOn(console, `error`).mockImplementation(() => {});
    vi.mocked(fetch as unknown as () => Promise<unknown>).mockResolvedValue([]);
    setPlayer({ did: `did:plc:alice`, handle: `alice.test` });

    const root = createRoot(document.createElement(`div`));

    await act(async () => {
      root.render(<Solved />);
    });
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
    });

    expect(score.status).toBe(`failed`);
    setPlayer(null);
  });
});
