import { http, HttpResponse } from "msw";
import { page } from "vite-plus/test/browser";
import { render } from "vitest-browser-react";
import { getPlayer, setPlayer } from "#auth/player";
import { body } from "#test/game";
import { PDS } from "#test/handlers";
import { network } from "#test/network";
import { hasSession, signInAs } from "#test/session";
import { Config } from "../Config";

const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;

describe(`config`, () => {
  const onDelete = vi.fn<() => void>();

  const open = async (): Promise<void> => {
    await render(<Config onDelete={onDelete} />);
  };

  const scheme = (value: string): HTMLInputElement | null =>
    document.querySelector(`input[value="${value}"]`);

  const pick = async (name: string): Promise<void> => {
    await page.getByRole(`radio`, { name }).click({ force: true });
  };

  const press = async (name: string): Promise<void> => {
    await page.getByRole(`button`, { name }).click();
  };

  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  describe(`the color scheme`, () => {
    it(`follows the system until told otherwise`, async () => {
      await open();

      expect(scheme(`system`)?.checked).toBe(true);
      expect(document.documentElement.dataset.theme).toBeUndefined();
    });

    it(`applies a choice, and remembers it`, async () => {
      await open();
      await pick(`Dark`);

      expect(document.documentElement.dataset.theme).toBe(`dark`);
      expect(localStorage.getItem(`theme`)).toBe(`dark`);
    });

    it(`picks up where a player left off`, async () => {
      // The same key that `next-themes` used, so that returning players keep their choice
      localStorage.setItem(`theme`, `light`);
      await open();

      expect(scheme(`light`)?.checked).toBe(true);
      expect(document.documentElement.dataset.theme).toBe(`light`);
    });

    it(`forgets a choice when going back to the system's`, async () => {
      await open();
      await pick(`Dark`);
      await pick(`Match system`);

      expect(document.documentElement.dataset.theme).toBeUndefined();
      expect(localStorage.getItem(`theme`)).toBeNull();
    });

    it(`ignores whatever else has been kept under that name`, async () => {
      localStorage.setItem(`theme`, `sepia`);
      await open();

      expect(scheme(`system`)?.checked).toBe(true);
      expect(document.documentElement.dataset.theme).toBeUndefined();
    });

    it(`follows a change made in another tab`, async () => {
      await open();
      localStorage.setItem(`theme`, `dark`);
      window.dispatchEvent(new StorageEvent(`storage`));

      expect(scheme(`dark`)?.checked).toBe(true);
      expect(document.documentElement.dataset.theme).toBe(`dark`);
    });

    it(`tells the phone's status bar, which is outside of the page`, async () => {
      const meta = document.head.appendChild(document.createElement(`meta`));

      meta.name = `theme-color`;
      document.body.style.backgroundColor = `rgb(1, 2, 3)`;
      onTestFinished(() => {
        meta.remove();
        document.body.style.backgroundColor = ``;
      });
      await open();

      expect(meta.getAttribute(`content`)).toBe(`rgb(1, 2, 3)`);
    });
  });

  describe(`the account`, () => {
    it(`has nothing to offer someone who hasn't signed in`, async () => {
      await open();

      await expect.element(body).not.toMatchTextContent(`Sign out`);
      await expect
        .element(body)
        .not.toMatchTextContent(`Delete my Worbik data`);
    });

    it(`says who is signed in`, async () => {
      setPlayer(alice);
      await open();

      await expect.element(body).toMatchTextContent(`@alice.test`);
    });

    it(`names a player without a handle by their identity`, async () => {
      setPlayer({ did: alice.did, handle: null });
      await open();

      await expect.element(body).toMatchTextContent(alice.did);
    });

    it(`signs a player out here straight away, and tells their server`, async () => {
      // On a shared device, being signed out can't wait on a server that may not answer
      const held = Promise.withResolvers<undefined>();
      let told = false;

      network.use(
        http.post(`${PDS}/oauth/revoke`, async () => {
          told = true;
          await held.promise;

          return HttpResponse.json({});
        })
      );
      await signInAs(alice);
      await open();
      await press(`Sign out`);

      expect(getPlayer()).toBeNull();
      await expect.poll(() => told).toBe(true);

      held.resolve(undefined);
      await expect.poll(() => hasSession(alice.did)).toBe(false);
    });

    it(`signs a player out even when their server can't be told`, async () => {
      network.use(http.post(`${PDS}/oauth/revoke`, () => HttpResponse.error()));
      await signInAs(alice);
      await open();
      await press(`Sign out`);

      expect(getPlayer()).toBeNull();
      await expect.poll(() => hasSession(alice.did)).toBe(false);
    });

    it(`leads to deleting a player's data, without doing anything yet`, async () => {
      setPlayer(alice);
      await open();
      await press(`Delete my Worbik data`);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(getPlayer()).toStrictEqual(alice);
    });
  });
});
