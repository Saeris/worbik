import { useEffect, useState } from "react";
import { Link } from "@void/react";
import { rememberAccount, setPlayer } from "#auth/player";
import { adoptGames } from "#utils/solves";
import styles from "./callback.module.css";

/**
 * Signing in can only be finished once, as the answer from the player's
 * server is used up by it. This holds on to that one attempt, so that being
 * rendered twice, as React does during development, doesn't make a second.
 */
let finishing: Promise<string> | undefined;

const signIn = async (): Promise<string> => {
  const { completeSignIn } = await import(`#auth/oauth`);
  const { player, from } = await completeSignIn();
  setPlayer(player);
  rememberAccount(player);
  // The game that brought them here comes with them, as it's what they signed in to post
  adoptGames(player.did);
  return from;
};

const finish = async (): Promise<string> => {
  finishing ??= signIn();
  return finishing;
};

/**
 * Where the server that hosts a player's account sends them back to, once
 * they have approved signing in. It finishes signing them in, then returns
 * them to the puzzle that they left.
 */
const Page: React.FC = () => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const goBack = async (): Promise<void> => {
      try {
        // Loads the puzzle afresh, so that it picks up who has signed in
        location.replace(await finish());
      } catch {
        setFailed(true);
      }
    };

    void goBack();
  }, []);

  return (
    <main className={styles.main}>
      {failed ? (
        <>
          <h1>Couldn’t sign you in</h1>
          <p>
            Your account’s server didn’t confirm who you are. Nothing was
            changed, and you can try again from the menu.
          </p>
          <Link href="/">Back to the puzzle</Link>
        </>
      ) : (
        <output>Signing you in…</output>
      )}
    </main>
  );
};

export default Page;
