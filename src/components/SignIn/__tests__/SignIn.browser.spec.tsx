import { delay, http } from "msw";
import { page } from "vite-plus/test/browser";
import { render } from "vitest-browser-react";
import { body, neverHappens } from "#test/game";
import { carol, PDS } from "#test/handlers";
import { network } from "#test/network";
import { navigation } from "#utils/navigation";
import { SignIn } from "../SignIn";

describe(`signIn`, () => {
  const field = page.getByRole(`combobox`);
  const proceed = page.getByRole(`button`, { name: `Continue` });

  it(`sends a player to their server`, async () => {
    const leave = vi.spyOn(navigation, `assign`).mockReturnValue();

    await render(<SignIn />);
    await field.fill(carol.handle);
    await proceed.click();

    await expect.poll(() => leave.mock.calls).toHaveLength(1);
    expect(String(leave.mock.calls[0][0])).toContain(PDS);
  });

  it(`says what went wrong, in words meant for the player`, async () => {
    await render(<SignIn />);
    await field.fill(`nobody.test`);
    await proceed.click();

    await expect
      .element(body)
      .toMatchTextContent(`Couldn’t find an account with that handle`);
  });

  it(`can be tried again after that`, async () => {
    await render(<SignIn />);
    await field.fill(`nobody.test`);
    await proceed.click();

    await expect.element(proceed).toBeEnabled();
  });

  it(`can't be pressed twice while it's under way`, async () => {
    network.use(
      http.get(`${PDS}/.well-known/oauth-protected-resource`, async () => {
        await delay(`infinite`);
      })
    );
    await render(<SignIn />);
    await field.fill(carol.handle);
    await proceed.click();

    await expect.element(proceed).toBeDisabled();
  });

  it(`can be used again after coming back with the back button`, async () => {
    // The page comes back just as it was left, which is with its buttons turned off for a trip that's over
    network.use(
      http.get(`${PDS}/.well-known/oauth-protected-resource`, async () => {
        await delay(`infinite`);
      })
    );
    await render(<SignIn />);
    await field.fill(carol.handle);
    await proceed.click();
    await expect.element(proceed).toBeDisabled();

    window.dispatchEvent(
      new PageTransitionEvent(`pageshow`, { persisted: true })
    );

    await expect.element(proceed).toBeEnabled();
  });

  it(`leaves its buttons alone when a page is simply loaded`, async () => {
    network.use(
      http.get(`${PDS}/.well-known/oauth-protected-resource`, async () => {
        await delay(`infinite`);
      })
    );
    await render(<SignIn />);
    await field.fill(carol.handle);
    await proceed.click();
    await expect.element(proceed).toBeDisabled();

    window.dispatchEvent(new PageTransitionEvent(`pageshow`));

    await neverHappens(
      () => !(proceed.element() as HTMLButtonElement).disabled
    );
  });

  it(`points someone without an account to where they can get one`, async () => {
    // Worbik must never seem to create accounts of its own
    await render(<SignIn />);

    await expect
      .element(body)
      .toMatchTextContent(`Worbik doesn’t create accounts`);
  });
});
