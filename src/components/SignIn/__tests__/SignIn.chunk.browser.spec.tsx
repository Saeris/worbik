import { http, HttpResponse } from "msw";
import { page } from "vite-plus/test/browser";
import { render } from "vitest-browser-react";
import { body } from "#test/game";
import { network } from "#test/network";
import { navigation } from "#utils/navigation";
import { SignIn } from "../SignIn";

describe(`signIn, on a page that's out of date`, () => {
  const press = async (): Promise<void> => {
    await render(<SignIn />);
    await page.getByRole(`button`, { name: `Sign in with Bluesky` }).click();
  };

  beforeEach(() => {
    // What a page sees once a deployment has replaced the file that it would have fetched, which fails for real
    network.use(
      http.get(`*/src/auth/oauth.ts`, () =>
        HttpResponse.text(`Not found`, { status: 404 })
      )
    );
  });

  it(`loads the page again, as nothing less would let them sign in`, async () => {
    // They only have to press the button again, while telling them to try again would never have worked
    const reload = vi.spyOn(navigation, `reload`).mockReturnValue();

    await press();

    await expect.poll(() => reload.mock.calls).toHaveLength(1);
  });

  it(`says that it isn't working when there's no connection`, async () => {
    // Loading the page again without one would only lose it
    const reload = vi.spyOn(navigation, `reload`).mockReturnValue();

    vi.spyOn(navigator, `onLine`, `get`).mockReturnValue(false);
    await press();

    await expect.element(body).toMatchTextContent(`Signing in isn’t working`);
    expect(reload).not.toHaveBeenCalled();
  });
});
