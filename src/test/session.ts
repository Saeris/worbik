import { generateDpopKey } from "@atcute/oauth-crypto";
import { setPlayer, type Player } from "#auth/player";
import { OAUTH_SCOPE } from "#utils/service";
import { PDS } from "./handlers";

/**
 * Puts the page where a player's server sends them back to, with what was
 * left behind when they set off from Worbik. That can say anything at all, as
 * the address that a player comes back to is out of Worbik's hands.
 */
export const arriveFromServer = async (state: unknown): Promise<void> => {
  localStorage.setItem(
    `atcute-oauth:states:a-state`,
    JSON.stringify({
      value: {
        dpopKey: await generateDpopKey([`ES256`]),
        metadata: {
          issuer: PDS,
          token_endpoint: `${PDS}/oauth/token`,
          revocation_endpoint: `${PDS}/oauth/revoke`
        },
        verifier: `a-verifier`,
        state
      },
      expiresAt: Date.now() + 60_000,
      revision: 1
    })
  );
  history.replaceState(null, ``, `#state=a-state&code=a-code&iss=${PDS}`);
};

/** Whether a player's session is still on this device, which signing out leaves until last */
export const hasSession = (did: string): boolean =>
  localStorage.getItem(`atcute-oauth:sessions:${did}`) !== null;

/**
 * Signs a player in, leaving what a real sign-in leaves behind. The code that
 * signs players in reads it from there, and talks to their server for real.
 *
 * The scope is what they were granted, for a test of a sign-in from before
 * Worbik needed something that it needs now.
 */
export const signInAs = async (
  player: Player,
  scope: string = OAUTH_SCOPE
): Promise<void> => {
  localStorage.setItem(
    `atcute-oauth:sessions:${player.did}`,
    JSON.stringify({
      value: {
        dpopKey: await generateDpopKey([`ES256`]),
        info: {
          sub: player.did,
          aud: PDS,
          server: {
            issuer: PDS,
            token_endpoint: `${PDS}/oauth/token`,
            revocation_endpoint: `${PDS}/oauth/revoke`
          }
        },
        token: {
          scope,
          type: `DPoP`,
          access: `access`,
          refresh: `refresh`,
          expires_at: Date.now() + 60 * 60 * 1000
        }
      },
      expiresAt: null,
      revision: 1
    })
  );
  setPlayer(player);
};
