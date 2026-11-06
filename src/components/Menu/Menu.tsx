import { memo, useCallback, useId } from "react";
import { DialogDisclosure, useDialogStore } from "@ariakit/react";
import { Link } from "@void/react";
import { cx } from "class-variance-authority";
import {
  PiCaretRightThin,
  PiGearThin,
  PiInfoThin,
  PiListThin,
  PiTrophyThin,
  PiUserThin
} from "react-icons/pi";
import { usePlayer } from "#hooks";
import type { Size } from "#utils";
import { Config } from "../Config";
import { Guide } from "../Guide";
import { LEADERBOARD } from "../Leaderboard";
import { Sheet } from "../Sheet";
import { SIGN_IN } from "../SignIn";
import styles from "./Menu.module.css";

export interface MenuProps {
  /** The width of the board that is being played, which the guide describes */
  width: Size;
  /** The height of the board that is being played, which the guide describes */
  height: Size;
  /** Called when the leaderboard is opened, so that it can be loaded */
  onLeaderboard: () => void;
  className?: string;
}

/**
 * The one way to everything that isn't the puzzle itself, so that the
 * puzzle has the screen to itself
 */
export const Menu: React.FC<MenuProps> = memo(
  ({ width, height, onLeaderboard, className }) => {
    const menu = useDialogStore();
    const player = usePlayer();
    const id = useId();
    const guide = `${id}-guide`;
    const settings = `${id}-settings`;

    const showLeaderboard = useCallback(() => {
      menu.hide();
      onLeaderboard();
    }, [menu, onLeaderboard]);

    // The same items are a list in a sheet on a small screen, and a row of links in the bar on a large one
    const items = (
      <>
        <li>
          {player ? (
            <Link href="/profile" onClick={menu.hide}>
              <PiUserThin aria-hidden />
              {player.handle ? `@${player.handle}` : `Profile`}
              <PiCaretRightThin aria-hidden />
            </Link>
          ) : (
            <button
              type="button"
              command="show-modal"
              commandfor={SIGN_IN}
              onClick={menu.hide}
            >
              <PiUserThin aria-hidden />
              Sign in
              <PiCaretRightThin aria-hidden />
            </button>
          )}
        </li>
        <li>
          <button
            type="button"
            command="show-modal"
            commandfor={LEADERBOARD}
            onClick={showLeaderboard}
          >
            <PiTrophyThin aria-hidden />
            Leaderboard
            <PiCaretRightThin aria-hidden />
          </button>
        </li>
        <li>
          <button
            type="button"
            command="show-modal"
            commandfor={guide}
            onClick={menu.hide}
          >
            <PiInfoThin aria-hidden />
            How to play
            <PiCaretRightThin aria-hidden />
          </button>
        </li>
        <li>
          <button
            type="button"
            command="show-modal"
            commandfor={settings}
            onClick={menu.hide}
          >
            <PiGearThin aria-hidden />
            Settings
            <PiCaretRightThin aria-hidden />
          </button>
        </li>
      </>
    );

    return (
      <>
        <DialogDisclosure
          store={menu}
          className={cx(styles.open, className)}
          aria-label="Menu"
        >
          <PiListThin aria-hidden />
        </DialogDisclosure>
        <nav className={cx(styles.links, className)} aria-label="Menu">
          <ul>{items}</ul>
        </nav>
        <Sheet store={menu} aria-label="Menu">
          <ul className={styles.items}>{items}</ul>
        </Sheet>
        <Guide id={guide} width={width} height={height} />
        <Config id={settings} />
      </>
    );
  }
);

Menu.displayName = `Menu`;
