import { defineHandler } from "void";
import {
  OAUTH_CALLBACK,
  OAUTH_CLIENT_METADATA,
  OAUTH_SCOPE
} from "#utils/service";

/**
 * Describes Worbik to the server that hosts a player's account, which
 * fetches this when the player signs in. It's how that server knows what to
 * call this app, what it's asking for, and where to send the player back to.
 *
 * It's written for wherever it's served from, as its own address is what
 * identifies the app. So a preview deployment is a different app to the
 * live one, and each can only send players back to itself.
 */
export const GET = defineHandler((c) => {
  const { origin } = new URL(c.req.url);

  return {
    client_id: `${origin}${OAUTH_CLIENT_METADATA}`,
    client_name: `Worbik`,
    client_uri: origin,
    redirect_uris: [`${origin}${OAUTH_CALLBACK}`],
    scope: OAUTH_SCOPE,
    grant_types: [`authorization_code`, `refresh_token`],
    response_types: [`code`],
    // Worbik runs in the browser, where there is nowhere to keep a secret that would prove it's the one asking
    token_endpoint_auth_method: `none`,
    application_type: `web`,
    dpop_bound_access_tokens: true
  };
});
