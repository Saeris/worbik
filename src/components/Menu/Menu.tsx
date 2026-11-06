import { memo, useId } from "react";
import { DialogDisclosure, useDialogStore } from "@ariakit/react";
import { cx } from "class-variance-authority";
import {
  PiCaretRightThin,
  PiGearThin,
  PiInfoThin,
  PiListThin,
  PiUserThin
} from "react-icons/pi";
import { usePlayer } from "#hooks";
import type { Size } from "#utils";
import { Config } from "../Config";
import { Guide } from "../Guide";
import { Sheet } from "../Sheet";
import { SIGN_IN } from "../SignIn";
import styles from "./Menu.module.css";

export interface MenuProps {
  /** The width of the board that is being played, which the guide describes */
  width: Size;
  /** The height of the board that is being played, which the guide describes */
  height: Size;
  className?: string;
}

/**
 * The one way to everything that isn't the puzzle itself, so that the
 * puzzle has the screen to itself
 */
export const Menu: React.FC<MenuProps> = memo(
  ({ width, height, className }) => {
    const menu = useDialogStore();
    const player = usePlayer();
    const id = useId();
    const guide = `${id}-guide`;
    const settings = `${id}-settings`;

    return (
      <>
        <DialogDisclosure
          store={menu}
          className={cx(styles.open, className)}
          aria-label="Menu"
        >
          <PiListThin aria-hidden />
        </DialogDisclosure>
        <Sheet store={menu} aria-label="Menu">
          <ul className={styles.items}>
            <li>
              {player ? (
                <p>
                  <PiUserThin aria-hidden />
                  {player.handle ? `@${player.handle}` : `Signed in`}
                </p>
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
          </ul>
        </Sheet>
        <Guide id={guide} width={width} height={height} />
        <Config id={settings} />
      </>
    );
  }
);

Menu.displayName = `Menu`;
