import { memo } from "react";
import styles from "./About.module.css";

/**
 * A few words about the game, below the board.
 *
 * Everything else on the page is scrambled letters, which leaves a search
 * engine with nothing to go on, and somebody who followed a link with no idea
 * what they've found.
 */
export const About: React.FC = memo(() => (
  <footer className={styles.about}>
    <h2>A daily word puzzle</h2>
    <p>
      Every day brings new grids of scrambled letters, in sixteen sizes from 5×5
      to 8×8. Rotate the rows and columns until every row is a word, in as few
      moves as you can. A letter turns yellow when it’s in the right place, and
      a row turns green once its word is complete.
    </p>
    <p>
      You can play without an account. Sign in with the account you use for
      Bluesky and other Atmosphere apps to post your score to the day’s
      leaderboard, and to keep a streak.
    </p>
    <nav aria-label="About Worbik">
      <a href="https://bsky.app/profile/worbik.com">@worbik.com on Bluesky</a>
      <a href="https://github.com/Saeris/worbik">Source on GitHub</a>
      <a href="/terms">Terms of Service</a>
      <a href="/privacy">Privacy Policy</a>
    </nav>
  </footer>
));

About.displayName = `About`;
