import { memo, useCallback, useId, useState } from "react";
import { fetch } from "void/client";
import { normalizeHandle } from "#auth/handle";
import { forgetAccount, setPlayer } from "#auth/player";
import { usePlayer } from "#hooks";
import { DELETE_ACCOUNT } from "#utils/service";
import { forgetGames } from "#utils/solves";
import styles from "./DeleteAccount.module.css";

export interface DeleteAccountProps {
  /** Called when a player's sign-in is too old to delete their account with */
  onSignIn: () => void;
}

/** What has become of an attempt to delete the player's account */
type Status = `deleted` | `deleting` | `expired` | `failed` | `idle`;

/**
 * Deletes a player's scores from Worbik, which is everything that it knows
 * about them.
 *
 * There's no getting them back, so the player has to type their handle
 * before it can be done. It's a deliberate step that a stray tap can't take,
 * and it also has them read whose account this is.
 */
export const DeleteAccount: React.FC<DeleteAccountProps> = memo(
  ({ onSignIn }) => {
    const id = useId();
    const player = usePlayer();
    const [typed, setTyped] = useState(``);
    const [status, setStatus] = useState<Status>(`idle`);
    const name = player?.handle ?? player?.did ?? ``;
    const confirmed =
      name !== `` && normalizeHandle(typed) === normalizeHandle(name);

    const change = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
      ({ currentTarget }) => {
        setTyped(currentTarget.value);
      },
      []
    );

    const remove = useCallback(async (did: string) => {
      setStatus(`deleting`);

      // Only fetched by those who have signed in
      const { getProof, signOut, SignedOutError } = await import(`#auth/oauth`);

      try {
        await fetch(`/api/account`, {
          method: `DELETE`,
          headers: {
            authorization: `Bearer ${await getProof(did, DELETE_ACCOUNT)}`
          }
        });
      } catch (cause) {
        setStatus(cause instanceof SignedOutError ? `expired` : `failed`);
        return;
      }

      setStatus(`deleted`);
      forgetGames(did);
      forgetAccount(did);
      setPlayer(null);
      await signOut(did);
    }, []);

    const submit = useCallback(
      (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (player && confirmed) void remove(player.did);
      },
      [player, confirmed, remove]
    );

    if (status === `deleted`) {
      return (
        <div className={styles.delete}>
          <output>
            <strong>Your account has been deleted.</strong>
          </output>
          <p>
            Your scores are gone from every leaderboard, and you’ve been signed
            out. You can sign in again at any time to start over.
          </p>
        </div>
      );
    }

    return (
      <form className={styles.delete} onSubmit={submit}>
        <p>
          This permanently deletes everything that Worbik has for{` `}
          <strong>{player?.handle ? `@${name}` : name}</strong>:
        </p>
        <ul>
          <li>your scores, from every leaderboard</li>
          <li>your streak, and your history of days played</li>
          <li>the results that your shared links show</li>
        </ul>
        <p>
          <strong>This can’t be undone.</strong> Your scores can’t be recovered,
          by you or by anyone else.
        </p>
        <p>
          The account itself isn’t affected, as it doesn’t belong to Worbik. You
          can sign in with it again at any time, and you’ll start over with
          nothing.
        </p>
        <label htmlFor={`${id}-confirm`}>
          To confirm, type <strong>{name}</strong> below
        </label>
        <input
          id={`${id}-confirm`}
          className={styles.field}
          type="text"
          value={typed}
          onChange={change}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          // Not a username or an email address, so password managers and the browser's own suggestions are asked to keep out
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          data-form-type="other"
        />
        {status === `failed` && (
          <p role="alert" className={styles.error}>
            Couldn’t delete your account, and nothing was changed. Try again in
            a moment.
          </p>
        )}
        {status === `expired` && (
          <p role="alert" className={styles.error}>
            You need to sign in again before you can do this. Nothing was
            changed.{` `}
            <button type="button" className={styles.link} onClick={onSignIn}>
              Sign in again
            </button>
          </p>
        )}
        <button
          type="submit"
          className={styles.danger}
          disabled={!confirmed || status === `deleting`}
        >
          {status === `deleting` ? `Deleting…` : `Delete my account`}
        </button>
      </form>
    );
  }
);

DeleteAccount.displayName = `DeleteAccount`;
