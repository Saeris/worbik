import { memo, useCallback } from "react";
import { cx } from "class-variance-authority";
import { PiListThin } from "react-icons/pi";
import { usePlayer } from "#hooks";
import type { View } from "../Drawer";
import styles from "./Menu.module.css";

export interface MenuProps {
  /** Whether what this opens is open, for the button to say so */
  open: boolean;
  /** Called to open the menu, or one of the screens that it leads to */
  onOpen: (view: View) => void;
  className?: string;
}

/**
 * The way to everything that isn't the puzzle itself.
 *
 * On a phone that is one button, which opens the menu, so that the puzzle
 * has the screen to itself. A large screen has room in its bar for
 * everything that the menu holds, so each is laid out there instead.
 */
export const Menu: React.FC<MenuProps> = memo(({ open, onOpen, className }) => {
  const player = usePlayer();

  const show = useCallback<React.MouseEventHandler<HTMLButtonElement>>(
    ({ currentTarget }) => {
      const { view } = currentTarget.dataset;

      if (
        view === `menu` ||
        view === `guide` ||
        view === `leaderboard` ||
        view === `profile` ||
        view === `settings` ||
        view === `sign-in`
      ) {
        onOpen(view);
      }
    },
    [onOpen]
  );

  return (
    <>
      <button
        type="button"
        className={cx(styles.open, className)}
        data-view="menu"
        aria-label="Menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={show}
      >
        <PiListThin aria-hidden />
      </button>
      <nav className={cx(styles.links, className)} aria-label="Menu">
        <ul>
          <li>
            {player ? (
              <button type="button" data-view="profile" onClick={show}>
                {player.handle ? `@${player.handle}` : `Profile`}
              </button>
            ) : (
              <button type="button" data-view="sign-in" onClick={show}>
                Sign in
              </button>
            )}
          </li>
          <li>
            <button type="button" data-view="leaderboard" onClick={show}>
              Leaderboard
            </button>
          </li>
          <li>
            <button type="button" data-view="guide" onClick={show}>
              How to play
            </button>
          </li>
          <li>
            <button type="button" data-view="settings" onClick={show}>
              Settings
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
});

Menu.displayName = `Menu`;
