import { useCallback } from "react";
import { Dialog, useDialogContext, type DialogProps } from "@ariakit/react";
import { cx } from "class-variance-authority";
import styles from "./Sheet.module.css";

/**
 * Whether a sheet has been swiped all the way off of the screen.
 *
 * A sheet rests at the end of a scroller that is laid out in reverse, which
 * is where such a scroller starts out. So an open sheet has a scroll offset
 * of zero, and swiping it away scrolls back to a negative offset that is as
 * long as the scroller's overflow.
 */
export const isSwipedAway = ({
  scrollTop,
  scrollHeight,
  clientHeight
}: Pick<
  HTMLElement,
  `clientHeight` | `scrollHeight` | `scrollTop`
>): boolean => {
  const travel = scrollHeight - clientHeight;
  // Browsers report fractional offsets, so the last pixel is given as leeway
  return travel > 0 && Math.abs(scrollTop) >= travel - 1;
};

export type SheetProps = DialogProps;

/**
 * A dialog that rises from the bottom edge of the screen, and that can be
 * swiped back down to dismiss it.
 *
 * Ariakit doesn't have a sheet of its own, so this is its `Dialog` given the
 * swipe from React Aria's sheet (https://react-aria.adobe.com/blog/sheet).
 * It takes the same props as `Dialog` and is used in its place, along with
 * the rest of Ariakit's dialog parts: `DialogDisclosure`, `DialogHeading`,
 * and `DialogDismiss`. Like those, it needs either a `store` or a
 * `DialogProvider` above it.
 *
 * The swipe isn't tracked by any script. The sheet sits in a scroller that
 * snaps to two positions: one with the sheet on screen, and one with it
 * scrolled off of the bottom edge. So the browser moves the sheet with the
 * finger, and settles it either open or shut when the finger lifts.
 */
export const Sheet: React.FC<SheetProps> = ({ className, ...props }) => {
  const context = useDialogContext();
  const store = props.store ?? context;

  const dismissOnSwipe = useCallback(
    (scroller: HTMLDivElement) => {
      const dismiss = (): void => {
        if (isSwipedAway(scroller)) store?.hide();
      };
      scroller.addEventListener(`scroll`, dismiss, { passive: true });
      return (): void => {
        scroller.removeEventListener(`scroll`, dismiss);
      };
    },
    [store]
  );

  const render = useCallback(
    (sheet: React.ComponentProps<`div`>) => (
      <div ref={dismissOnSwipe} className={styles.scroller}>
        <div className={styles.backdrop} />
        <div className={styles.rest}>
          <div {...sheet} />
        </div>
        <div className={styles.away} />
      </div>
    ),
    [dismissOnSwipe]
  );

  return (
    <Dialog
      // Each is left closed in the page otherwise, where its scroller would cover the game
      unmountOnHide
      {...props}
      // The backdrop is part of the scroller, so that it can fade as the sheet is swiped
      backdrop={false}
      className={cx(styles.sheet, className)}
      render={render}
    />
  );
};
