import { server } from "./server";

// This has to come before anything is imported that holds on to `fetch`, which is why it's here
server.listen({ onUnhandledFrame: `error` });

afterEach(() => {
  server.resetHandlers();
});
