import { http, HttpResponse } from "msw";
import { page } from "vite-plus/test/browser";
import { render } from "vitest-browser-react";
import { getAccounts, getPlayer, rememberAccount } from "#auth/player";
import { body } from "#test/game";
import { PDS } from "#test/handlers";
import { network } from "#test/network";
import { hasSession, signInAs } from "#test/session";
import { DELETE_DATA, SUBMIT_SCORE } from "#utils/service";
import { getGameKey } from "#utils/solves";
import { DeleteAccount } from "../DeleteAccount";

const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const puzzle = `12-31-2099_5x5`;
const key = getGameKey(puzzle, alice.did);

describe(`deleteAccount`, () => {
  const onSignIn = vi.fn<() => void>();
  const field = page.getByRole(`textbox`);
  const button = page.getByRole(`button`, { name: `Delete my Worbik data` });
  /** Proof of who asked, for each deletion that reached the server */
  let deletions: (string | null)[];
  /** Whether the player's server has been told that they've signed out */
  let signedOut: boolean;

  const says = async (words: string): Promise<void> => {
    await expect.element(body).toMatchTextContent(words);
  };

  const remove = async (): Promise<void> => {
    await field.fill(alice.handle);
    await button.click();
  };

  /** Deletes a player's data, and sees it through to the end, which is the player being signed out */
  const removeAll = async (): Promise<void> => {
    await remove();
    await expect.poll(() => hasSession(alice.did)).toBe(false);
  };

  beforeEach(async () => {
    deletions = [];
    signedOut = false;
    network.use(
      http.delete(`*/api/account`, ({ request }) => {
        deletions.push(request.headers.get(`authorization`));

        return HttpResponse.json({ deleted: true });
      }),
      http.post(`${PDS}/oauth/revoke`, () => {
        signedOut = true;

        return HttpResponse.json({});
      })
    );
    await signInAs(alice);
    rememberAccount(alice);
    localStorage.setItem(key, `a game`);
    await render(<DeleteAccount onSignIn={onSignIn} />);
  });

  it(`says that only Worbik's data is deleted`, async () => {
    // "Account" could be read as the one they use for Bluesky, which Worbik has no way to touch
    await says(`Delete my Worbik data`);
    await says(`Bluesky or other Atmosphere account isn’t touched`);
  });

  it(`warns that it's permanent`, async () => {
    await says(`can’t be undone`);
    await says(`every leaderboard`);
  });

  it(`can't be done until the player has typed their handle`, async () => {
    // This can't be reversed, so it must never be one stray tap away
    await expect.element(button).toBeDisabled();

    await field.fill(`alice.tes`);
    await expect.element(button).toBeDisabled();

    await field.fill(`bob.test`);
    await expect.element(button).toBeDisabled();

    await field.fill(alice.handle);
    await expect.element(button).toBeEnabled();
  });

  it(`takes a handle however it's usually written`, async () => {
    // Handles are shown with an @, and phones capitalize what's typed
    await field.fill(`@Alice.Test `);

    await expect.element(button).toBeEnabled();
  });

  it(`does nothing if it's submitted without the handle`, async () => {
    // Pressing Enter in the field doesn't care whether the button is enabled
    await field.fill(`nope`);
    document
      .querySelector(`form`)
      ?.dispatchEvent(new Event(`submit`, { bubbles: true, cancelable: true }));

    await expect.element(button).toBeDisabled();
    expect(deletions).toHaveLength(0);
  });

  it(`asks the server with a proof that's only good for this`, async () => {
    await removeAll();

    await expect
      .poll(() => deletions)
      .toStrictEqual([`Bearer proof-of-${DELETE_DATA}`]);
    expect(deletions[0]).not.toContain(SUBMIT_SCORE);
  });

  it(`leaves nothing of the player on this device`, async () => {
    await removeAll();

    await says(`has been deleted`);
    expect(getPlayer()).toBeNull();
    expect(getAccounts()).toStrictEqual([]);
    expect(localStorage.getItem(key)).toBeNull();
    expect(signedOut).toBe(true);
  });

  it(`says that it's done, and that they can come back`, async () => {
    await removeAll();

    await says(`has been deleted`);
    await says(`sign in again at any time`);
  });

  it(`changes nothing if the server can't do it`, async () => {
    // Being told that their data is gone when it isn't would be worse than being told to try again
    network.use(http.delete(`*/api/account`, () => HttpResponse.error()));
    await remove();

    await says(`Couldn’t delete your Worbik data`);
    expect(getPlayer()).toStrictEqual(alice);
    expect(localStorage.getItem(key)).toBe(`a game`);
  });

  it(`asks a player to sign in again if their sign-in doesn't cover this`, async () => {
    localStorage.removeItem(`atcute-oauth:sessions:${alice.did}`);
    await remove();

    await says(`You need to sign in again`);
    expect(deletions).toHaveLength(0);
    expect(getPlayer()).toStrictEqual(alice);

    await page.getByRole(`button`, { name: `Sign in again` }).click();

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it(`says so when their server won't vouch for them`, async () => {
    network.use(
      http.get(`${PDS}/xrpc/com.atproto.server.getServiceAuth`, () =>
        HttpResponse.json({ error: `Nope` }, { status: 400 })
      )
    );
    await remove();

    await says(`Couldn’t delete your Worbik data`);
    expect(deletions).toHaveLength(0);
  });
});
