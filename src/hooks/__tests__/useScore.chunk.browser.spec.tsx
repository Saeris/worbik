import { http, HttpResponse } from "msw";
import { render } from "vitest-browser-react";
import { setPlayer } from "#auth/player";
import { network } from "#test/network";
import { getPuzzleID } from "#utils";
import { navigation } from "#utils/navigation";
import { useScore, type Score } from "../useScore";

const history = [`bcaefd`, `abcefd`, `abcdef`];
let score: Score;

const Solved: React.FC = () => {
  // oxlint-disable-next-line react/globals -- hands the hook's result to the test, which then reads it
  score = useScore(getPuzzleID(), true, history);

  return null;
};

describe(`useScore, on a page that's out of date`, () => {
  const solve = async (): Promise<void> => {
    await render(<Solved />);
    await expect.poll(() => score.status).toBe(`failed`);
  };

  beforeEach(() => {
    vi.spyOn(console, `error`).mockImplementation(() => {});
    // What a page sees once a deployment has replaced the file that it would have fetched, which fails for real
    network.use(
      http.get(`*/src/auth/oauth.ts`, () =>
        HttpResponse.text(`Not found`, { status: 404 })
      )
    );
    setPlayer({ did: `did:plc:alice`, handle: `alice.test` });
  });

  it(`says so when the code for posting a score can't be fetched`, async () => {
    // This used to fail while working out why it had failed, and left the player watching "Posting your score…" for good
    await solve();
  });

  it(`loads the page again to try again, as nothing less would help`, async () => {
    // A browser can go on failing to import what it failed to import once, so trying again from here could never work
    const reload = vi.spyOn(navigation, `reload`).mockReturnValue();

    await solve();
    score.retry();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it(`doesn't load the page again without a connection`, async () => {
    // It wouldn't come back, and the player would lose their result as well
    const reload = vi.spyOn(navigation, `reload`).mockReturnValue();

    vi.spyOn(navigator, `onLine`, `get`).mockReturnValue(false);
    await solve();
    score.retry();

    expect(reload).not.toHaveBeenCalled();
  });
});
