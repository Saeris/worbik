import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogDismiss, useDialogStore } from "@ariakit/react";
import {
  PiCaretLeftThin,
  PiCaretRightThin,
  PiGearThin,
  PiInfoThin,
  PiTrophyThin,
  PiUserThin,
  PiXThin
} from "react-icons/pi";
import { usePlayer } from "#hooks";
import type { Size } from "#utils";
import { Config } from "../Config";
import { Guide } from "../Guide";
import { Leaderboard } from "../Leaderboard";
import { Profile } from "../Profile";
import { SignIn } from "../SignIn";
import styles from "./Drawer.module.css";

/** Each of the screens that the drawer can show, other than the menu that leads to them */
export type Screen =
  | `guide`
  | `leaderboard`
  | `profile`
  | `settings`
  | `sign-in`;

/** What the drawer is showing: the menu, or one of its screens */
export type View = Screen | `menu`;

export interface DrawerProps {
  /** What the drawer is showing, or `null` while it's closed */
  view: View | null;
  /** Called to show something else, or with `null` to close the drawer */
  onView: (view: View | null) => void;
  /** The ID of the puzzle that is being played, whose leaderboard is the one first shown */
  puzzleID: string;
  width: Size;
  height: Size;
  /** Whether the puzzle has been solved, which is when signing in is for posting its score */
  solved: boolean;
}

/** What is behind the drawer, where the drawer doesn't cover the screen */
const backdrop = <div className={styles.backdrop} />;

/**
 * Everything that isn't the puzzle: the menu, and the screens that it leads
 * to.
 *
 * On a phone it's a drawer that slides in over the whole screen, and the
 * screens that the menu leads to slide in over the menu, with a way back to
 * it. That gives each of them the room of a page, where a dialog would have
 * to scroll within a box. On a large screen the same screens are opened
 * straight from the bar, and each is shown as a dialog in the middle of it.
 */
export const Drawer: React.FC<DrawerProps> = memo(
  ({ view, onView, puzzleID, width, height, solved }) => {
    const player = usePlayer();
    const heading = useRef<HTMLHeadingElement>(null);
    // The screen that was last shown, which goes on being drawn while it slides out of view
    const [screen, setScreen] = useState<Screen>(`guide`);
    // Whether the menu is what led to the screen that's showing, and so whether there is a way back to it
    const [viaMenu, setViaMenu] = useState(false);

    if (view && view !== `menu` && view !== screen) setScreen(view);
    if (view === `menu` && !viaMenu) setViaMenu(true);
    if (view === null && viaMenu) setViaMenu(false);

    const store = useDialogStore({
      open: view !== null,
      setOpen: (open) => {
        if (!open) onView(null);
      }
    });

    const titles = {
      "sign-in": solved ? `Post your score` : `Sign in`,
      leaderboard: `Leaderboard`,
      profile: `Profile`,
      guide: `How to play`,
      settings: `Settings`
    } satisfies Record<Screen, string>;

    // Moving between the menu and a screen replaces everything on show, so focus moves to what has replaced it
    useEffect(() => {
      if (view) heading.current?.focus();
    }, [view]);

    const back = useCallback(() => {
      onView(`menu`);
    }, [onView]);

    const signIn = useCallback(() => {
      onView(`sign-in`);
    }, [onView]);

    const show = useCallback<React.MouseEventHandler<HTMLButtonElement>>(
      ({ currentTarget }) => {
        const { screen: next } = currentTarget.dataset;

        if (
          next === `guide` ||
          next === `leaderboard` ||
          next === `profile` ||
          next === `settings` ||
          next === `sign-in`
        ) {
          onView(next);
        }
      },
      [onView]
    );

    return (
      <Dialog
        store={store}
        // Nothing in it is needed while it's closed, and its leaderboard shouldn't load until it's asked for
        unmountOnHide
        className={styles.drawer}
        backdrop={backdrop}
        aria-label={view === `menu` ? `Menu` : titles[screen]}
      >
        <div
          className={styles.track}
          data-shifted={(viaMenu && view !== `menu`) || undefined}
        >
          {viaMenu && (
            <section className={styles.pane} inert={view !== `menu`}>
              <header className={styles.header}>
                <h2 ref={view === `menu` ? heading : undefined} tabIndex={-1}>
                  Menu
                </h2>
                <DialogDismiss aria-label="Close">
                  <PiXThin aria-hidden />
                </DialogDismiss>
              </header>
              <ul className={styles.items}>
                <li>
                  {player ? (
                    <button type="button" data-screen="profile" onClick={show}>
                      <PiUserThin aria-hidden />
                      {player.handle ? `@${player.handle}` : `Profile`}
                      <PiCaretRightThin aria-hidden />
                    </button>
                  ) : (
                    <button type="button" data-screen="sign-in" onClick={show}>
                      <PiUserThin aria-hidden />
                      Sign in
                      <PiCaretRightThin aria-hidden />
                    </button>
                  )}
                </li>
                <li>
                  <button
                    type="button"
                    data-screen="leaderboard"
                    onClick={show}
                  >
                    <PiTrophyThin aria-hidden />
                    Leaderboard
                    <PiCaretRightThin aria-hidden />
                  </button>
                </li>
                <li>
                  <button type="button" data-screen="guide" onClick={show}>
                    <PiInfoThin aria-hidden />
                    How to play
                    <PiCaretRightThin aria-hidden />
                  </button>
                </li>
                <li>
                  <button type="button" data-screen="settings" onClick={show}>
                    <PiGearThin aria-hidden />
                    Settings
                    <PiCaretRightThin aria-hidden />
                  </button>
                </li>
              </ul>
            </section>
          )}
          <section className={styles.pane} inert={view === `menu`}>
            <header className={styles.header}>
              {viaMenu && (
                <button
                  type="button"
                  aria-label="Back to the menu"
                  onClick={back}
                >
                  <PiCaretLeftThin aria-hidden />
                </button>
              )}
              <h2 ref={view === `menu` ? undefined : heading} tabIndex={-1}>
                {titles[screen]}
              </h2>
              <DialogDismiss aria-label="Close">
                <PiXThin aria-hidden />
              </DialogDismiss>
            </header>
            <div className={styles.body}>
              {screen === `sign-in` && <SignIn />}
              {screen === `leaderboard` && (
                <Leaderboard
                  puzzleID={puzzleID}
                  width={width}
                  height={height}
                  onSignIn={signIn}
                />
              )}
              {screen === `profile` && <Profile onSignIn={signIn} />}
              {screen === `guide` && <Guide width={width} height={height} />}
              {screen === `settings` && <Config />}
            </div>
          </section>
        </div>
      </Dialog>
    );
  }
);

Drawer.displayName = `Drawer`;
