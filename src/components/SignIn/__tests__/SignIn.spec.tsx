// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SignIn } from "../SignIn";

vi.mock(`void/client`, () => ({ fetch: vi.fn<() => Promise<unknown>>() }));

// What a page sees once a deployment has replaced the file that it would have fetched
vi.mock(`../../../auth/oauth`, () => {
  throw new TypeError(`Failed to fetch dynamically imported module`);
});

describe(`signIn, on a page that's out of date`, () => {
  const reload = vi.fn<() => void>();
  let root: Root;
  let container: HTMLElement;

  const press = async (): Promise<void> => {
    await act(async () => {
      root.render(<SignIn />);
    });
    await act(async () => {
      [...container.querySelectorAll(`button`)]
        .find((button) => button.textContent === `Sign in with Bluesky`)
        ?.click();
    });
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
    });
  };

  beforeEach(() => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    vi.stubGlobal(`location`, { reload });
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    reload.mockClear();
  });

  it(`loads the page again, as nothing less would let them sign in`, async () => {
    // They only have to press the button again, while telling them to try again would never have worked
    await press();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it(`says that it isn't working when there's no connection`, async () => {
    // Loading the page again without one would only lose it
    vi.spyOn(navigator, `onLine`, `get`).mockReturnValue(false);
    await press();

    expect(reload).not.toHaveBeenCalled();
    expect(container.textContent).toContain(`Signing in isn’t working`);
  });
});
