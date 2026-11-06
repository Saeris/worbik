import type { Did, Nsid } from "@atcute/lexicons";
import { scope } from "@atcute/oauth-types";

/**
 * The one thing that a player's proof of identity may be used for.
 *
 * Under `temp` because none of this is settled: these names are placeholders
 * until Worbik's lexicons are published under a domain of their own.
 */
export const SUBMIT_SCORE: Nsid = `gg.saeris.worbik.temp.submitScore`;

/**
 * The identity of this service, which is the did:web of wherever it is
 * served from.
 *
 * A did:web may only name a port for `localhost`. During development the
 * game is served at 127.0.0.1, which signing in needs, so its identity says
 * `localhost` instead: the two are the same machine, and a player's server
 * would turn away anything else.
 */
export const serviceDid = (origin: string): Did<"web"> => {
  const { hostname, port } = new URL(origin);
  const host = hostname === `127.0.0.1` ? `localhost` : hostname;

  return `did:web:${host}${port ? `%3A${port}` : ``}`;
};

/**
 * Everything that Worbik asks of a player's account when they sign in.
 *
 * That is to know who they are, and to have the server that hosts their
 * account vouch for them when they submit a score. It can't read or write
 * anything in their account, which is why this isn't the catch-all
 * `transition:generic` that most apps ask for.
 */
export const OAUTH_SCOPE = `atproto ${scope.rpc({ lxm: [SUBMIT_SCORE], aud: `*` })}`;

/** Where a player's account sends them back to once they've approved signing in */
export const OAUTH_CALLBACK = `/oauth/callback`;

/** Where the document that describes Worbik to a player's account is served from */
export const OAUTH_CLIENT_METADATA = `/oauth/client-metadata.json`;
