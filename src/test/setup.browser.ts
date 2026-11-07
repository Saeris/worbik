import { cleanup } from "vitest-browser-react";
import { setPlayer } from "#auth/player";
import { network } from "./network";

beforeAll(async () => {
  await network.start({
    quiet: true,
    // The page's own code comes from the test server. Anything else that isn't answered for is a test reaching the outside world.
    onUnhandledFrame: ({ frame, defaults }) => {
      if (frame.protocol !== `http`) return;

      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- what a frame carries depends on its protocol, which is checked above
      const { url } = (frame.data as { request: Request }).request;
      const { origin, pathname } = new URL(url);

      if (origin !== location.origin || pathname.startsWith(`/api/`)) {
        defaults.error();
      }
    }
  });
});

afterEach(async () => {
  // Whatever was rendered goes first, or it would go on reacting to what's cleared up after it
  await cleanup();
  vi.useRealTimers();
  setPlayer(null);
  localStorage.clear();
  network.resetHandlers();
});
