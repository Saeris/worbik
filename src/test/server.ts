import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** The network, as a Worker sees it */
export const server = setupServer(...handlers);
