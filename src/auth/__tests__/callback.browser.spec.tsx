import { http, HttpResponse } from "msw";
import { render } from "vitest-browser-react";
import { body } from "#test/game";
import { carol, PDS } from "#test/handlers";
import { network } from "#test/network";
import { Router } from "#test/router";
import { arriveFromServer } from "#test/session";
import { navigation } from "#utils/navigation";
import { getAccounts, getPlayer } from "../player";

const puzzle = `12-31-2099_5x5`;

/** Each is its own copy of the page, as one can only finish signing in once */
let visits = 0;

describe(`the page that a player returns to`, () => {
  const open = async (): Promise<void> => {
    visits += 1;

    const url = new URL(`../../pages/oauth/callback.tsx`, import.meta.url);
    const { default: Page } = (await import(
      /* @vite-ignore */ `${url.pathname}?visit=${visits}`
    )) as { default: React.FC };

    await render(
      <Router>
        <Page />
      </Router>
    );
  };

  afterEach(() => {
    history.replaceState(null, ``, location.pathname + location.search);
  });

  it(`signs the player in, and returns them to their puzzle`, async () => {
    const leave = vi.spyOn(navigation, `replace`).mockReturnValue();

    await arriveFromServer({ from: `/6x6` });
    await open();

    await expect.poll(() => leave.mock.calls).toStrictEqual([[`/6x6`]]);
    expect(getPlayer()).toStrictEqual(carol);
  });

  it(`remembers the account, for the next time they sign in`, async () => {
    const leave = vi.spyOn(navigation, `replace`).mockReturnValue();

    await arriveFromServer({ from: `/` });
    await open();

    await expect.poll(() => leave.mock.calls).toHaveLength(1);
    expect(getAccounts()).toStrictEqual([carol]);
  });

  it(`brings along the game that they signed in to post`, async () => {
    // This is how a score gets posted when the puzzle was solved first, so without it the solve is lost
    const leave = vi.spyOn(navigation, `replace`).mockReturnValue();

    localStorage.setItem(puzzle, `a game`);
    await arriveFromServer({ from: `/` });
    await open();

    await expect.poll(() => leave.mock.calls).toHaveLength(1);
    expect(localStorage.getItem(`${carol.did}/${puzzle}`)).toBe(`a game`);
  });

  it(`says so when it can't finish, and changes nothing`, async () => {
    const leave = vi.spyOn(navigation, `replace`).mockReturnValue();

    network.use(
      http.post(`${PDS}/oauth/token`, () =>
        HttpResponse.json({ error: `invalid_grant` }, { status: 400 })
      )
    );
    await arriveFromServer({ from: `/` });
    await open();

    await expect.element(body).toMatchTextContent(`Couldn’t sign you in`);
    expect(getPlayer()).toBeNull();
    expect(leave).not.toHaveBeenCalled();
  });
});
