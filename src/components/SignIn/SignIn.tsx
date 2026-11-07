import { memo, useCallback, useState } from "react";
import { cx } from "class-variance-authority";
import { HandleField } from "./HandleField";
import styles from "./SignIn.module.css";

export interface SignInProps {
  className?: string;
}

/**
 * Asks a player who they are, and sends them to the server that hosts their
 * account to prove it.
 *
 * Worbik has no accounts of its own to sign up for. Someone who has none is
 * pointed to where they can make one, and comes back with it.
 */
export const SignIn: React.FC<SignInProps> = memo(({ className }) => {
  const [handle, setHandle] = useState(``);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const begin = useCallback(async (account?: string) => {
    setPending(true);
    setError(null);

    // Signing in is the only thing that needs this, so it's only fetched by those who do
    const { signIn, SignInError } = await import(`#auth/oauth`);

    try {
      // Leaves the page when it succeeds
      await signIn(account);
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
      void begin(handle);
    },
    [begin, handle]
  );

  const withBluesky = useCallback(() => {
    void begin();
  }, [begin]);

  return (
    <div className={cx(styles.signIn, className)}>
      <p>
        Sign in with your Atmosphere account: the one you use for Bluesky and
        other apps.
      </p>
      <form className={styles.form} onSubmit={withHandle}>
        <HandleField value={handle} onChange={setHandle} />
        <p className={styles.note}>
          You will approve this on your account’s own sign-in page. Worbik never
          sees your password. By signing in you agree to the{` `}
          <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
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
    </div>
  );
});

SignIn.displayName = `SignIn`;
