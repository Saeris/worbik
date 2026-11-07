import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/** The network, as a page sees it */
export const network = setupWorker(...handlers);
