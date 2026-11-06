import { memo, useCallback, useId, useState } from "react";
import { Modal } from "../Modal";
import styles from "./SignIn.module.css";

/** Identifies the dialog to the buttons that open it, wherever they are in the game */
export const SIGN_IN = `sign-in`;

export interface SignInProps {
  /** What signing in is for, when it's something more specific than signing in */
  title?: string;
}

/**
 * Asks a player who they are, and sends them to the server that hosts their
 * account to prove it.
 *
 * Worbik has no accounts of its own to sign up for. Someone who has none is
 * pointed to where they can make one, and comes back with it.
 */
export const SignIn: React.FC<SignInProps> = memo(({ title = `Sign in` }) => {
  const id = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const begin = useCallback(async (handle?: string) => {
    setPending(true);
    setError(null);

    // Signing in is the only thing that needs this, so it's only fetched by those who do
    const { signIn, SignInError } = await import(`#auth/oauth`);

    try {
      // Leaves the page when it succeeds
      await signIn(handle);
    } catch (cause) {
      setPending(false);
      setError(
        cause instanceof SignInError
          ? cause.message
          : `Signing in isn’t working right now. Try again in a moment.`
      );
    }
  }, []);

  const withHandle = useCallback(
    (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      const handle = new FormData(event.currentTarget).get(`handle`);
      void begin(typeof handle === `string` ? handle : ``);
    },
    [begin]
  );

  const withBluesky = useCallback(() => {
    void begin();
  }, [begin]);

  return (
    <Modal id={SIGN_IN} title={title}>
      <p>
        Sign in with your Atmosphere account: the one you use for Bluesky and
        other apps.
      </p>
      <form className={styles.form} onSubmit={withHandle}>
        <label htmlFor={`${id}-handle`}>Your handle</label>
        <div className={styles.field}>
          <span aria-hidden>@</span>
          <input
            id={`${id}-handle`}
            name="handle"
            type="text"
            inputMode="email"
            placeholder="you.bsky.social"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            spellCheck={false}
            required
            aria-describedby={`${id}-note`}
          />
        </div>
        <p id={`${id}-note`} className={styles.note}>
          You will approve this on your account’s own sign-in page. Worbik never
          sees your password.
        </p>
        <button type="submit" className={styles.primary} disabled={pending}>
          Continue
        </button>
      </form>
      <p className={styles.or}>or</p>
      <button
        type="button"
        className={styles.button}
        disabled={pending}
        onClick={withBluesky}
      >
        Sign in with Bluesky
      </button>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <aside className={styles.aside}>
        <strong>No account yet?</strong>
        <p className={styles.note}>
          {`Worbik doesn’t create accounts. Make one with `}
          <a href="https://bsky.app" target="_blank" rel="noreferrer">
            Bluesky ↗
          </a>
          {` or any other Atmosphere service, then come back and sign in with it.`}
        </p>
      </aside>
    </Modal>
  );
});

SignIn.displayName = `SignIn`;
