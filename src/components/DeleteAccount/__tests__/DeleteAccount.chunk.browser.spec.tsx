import { http, HttpResponse } from "msw";
import { page } from "vite-plus/test/browser";
import { render } from "vitest-browser-react";
import { getPlayer, setPlayer } from "#auth/player";
import { body } from "#test/game";
import { network } from "#test/network";
import { navigation } from "#utils/navigation";
import { DeleteAccount } from "../DeleteAccount";

const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;

describe(`deleteAccount, on a page that's out of date`, () => {
  const onSignIn = vi.fn<() => void>();
  let deleted: boolean;

  const remove = async (): Promise<void> => {
    await render(<DeleteAccount onSignIn={onSignIn} />);
    await page.getByRole(`textbox`).fill(alice.handle);
    await page.getByRole(`button`, { name: `Delete my Worbik data` }).click();
  };

  beforeEach(() => {
    deleted = false;
    // What a page sees once a deployment has replaced the file that it would have fetched, which fails for real
    network.use(
      http.get(`*/src/auth/oauth.ts`, () =>
        HttpResponse.text(`Not found`, { status: 404 })
      ),
      http.delete(`*/api/account`, () => {
        deleted = true;

        return HttpResponse.json({ deleted: true });
      })
    );
    setPlayer(alice);
  });

  it(`asks the player to reload rather than doing it for them`, async () => {
    // A page that reloaded by itself would look like a deletion that had gone through
    const reload = vi.spyOn(navigation, `reload`).mockReturnValue();

    await remove();

    await expect.element(body).toMatchTextContent(`Nothing was deleted`);
    expect(reload).not.toHaveBeenCalled();

    await page.getByRole(`button`, { name: `Reload` }).click();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it(`deletes nothing and keeps the player`, async () => {
    await remove();

    await expect.element(body).toMatchTextContent(`Nothing was deleted`);
    expect(deleted).toBe(false);
    expect(getPlayer()).toStrictEqual(alice);
  });

  it(`doesn't blame an update for a lost connection`, async () => {
    // Reloading without a connection would only lose the page
    vi.spyOn(navigator, `onLine`, `get`).mockReturnValue(false);
    await remove();

    await expect.element(body).toMatchTextContent(`Try again in a moment`);
    await expect.element(body).not.toMatchTextContent(`Reload`);
  });
});
