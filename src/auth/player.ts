import type { Did } from "@atcute/lexicons";
import { isDid } from "@atcute/lexicons/syntax";
import * as v from "valibot";

/** The player that is signed in, as much as is known of them */
export interface Player {
  readonly did: Did;
  /** The handle that their identity names, for showing them who they're signed in as */
  readonly handle: string | null;
}

const KEY = `worbik:player`;

const schema = v.object({
  did: v.custom<Did>((value) => typeof value === `string` && isDid(value)),
  handle: v.nullable(v.string())
});

const listeners = new Set<() => void>();

/** What was last read from storage, so that the same player is returned for as long as it's unchanged */
let last: { stored: string | null; player: Player | null } | undefined;

/**
 * Who is signed in on this device, if anyone.
 *
 * This only says who the player is. What lets them act as themselves is
 * held by the browser's sign-in with the server that hosts their account,
 * and that can run out or be withdrawn while this still names them.
 */
export const getPlayer = (): Player | null => {
  let stored: string | null;

  try {
    stored = localStorage.getItem(KEY);
  } catch {
    // Storage can be unavailable, e.g. when site data is blocked
    stored = null;
  }

  if (last?.stored !== stored) {
    let player: Player | null = null;

    try {
      player = stored === null ? null : v.parse(schema, JSON.parse(stored));
    } catch {
      // Whatever is stored isn't a player, which is the same as nobody being signed in
    }

    last = { stored, player };
  }

  return last.player;
};

/** Remembers who has signed in, or forgets them when given `null` */
export const setPlayer = (player: Player | null): void => {
  try {
    if (player) {
      localStorage.setItem(KEY, JSON.stringify(player));
    } else {
      localStorage.removeItem(KEY);
    }
  } catch {
    // Without storage the player is signed in for as long as this page is open
    last = { stored: null, player };
  }

  listeners.forEach((listener) => {
    listener();
  });
};

/** Calls back whenever a player signs in or out, in this tab or any other */
export const subscribeToPlayer = (listener: () => void): (() => void) => {
  listeners.add(listener);
  window.addEventListener(`storage`, listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener(`storage`, listener);
  };
};

const ACCOUNTS_KEY = `worbik:accounts`;

/** How many of the accounts that have signed in on this device are remembered */
const MAX_ACCOUNTS = 5;

const accountsSchema = v.array(
  v.object({
    did: v.custom<Did>((value) => typeof value === `string` && isDid(value)),
    handle: v.string()
  })
);

/** An account that has signed in on this device before, which is offered when signing in again */
export type Account = v.InferOutput<typeof accountsSchema>[number];

/** The accounts that have signed in on this device, latest first */
export const getAccounts = (): Account[] => {
  try {
    return v.parse(
      accountsSchema,
      JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? `[]`)
    );
  } catch {
    // Nothing is offered when storage is unavailable, or holds something else
    return [];
  }
};

/**
 * Remembers an account that has signed in, so that its handle doesn't have
 * to be typed out the next time. Signing out doesn't forget it: that is
 * exactly when it's useful.
 */
export const rememberAccount = ({ did, handle }: Player): void => {
  // An account without a handle has nothing to offer in a field for handles
  if (!handle) return;

  try {
    localStorage.setItem(
      ACCOUNTS_KEY,
      JSON.stringify(
        [
          { did, handle },
          ...getAccounts().filter((account) => account.did !== did)
        ].slice(0, MAX_ACCOUNTS)
      )
    );
  } catch {
    // The handle can always be typed again
  }
};

/** Stops suggesting an account when signing in, for a player who has deleted it */
export const forgetAccount = (did: string): void => {
  try {
    localStorage.setItem(
      ACCOUNTS_KEY,
      JSON.stringify(getAccounts().filter((account) => account.did !== did))
    );
  } catch {
    // Without storage there are no accounts to forget
  }
};
