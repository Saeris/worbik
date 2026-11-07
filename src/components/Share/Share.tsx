import { memo, useCallback, useMemo, useState } from "react";
import {
  DialogDisclosure,
  DialogDismiss,
  DialogHeading,
  useDialogStore
} from "@ariakit/react";
import { PiXThin } from "react-icons/pi";
import { getPuzzleStart } from "#utils";
import { Sheet } from "../Sheet";
import styles from "./Share.module.css";

export interface ShareProps {
  /** The ID of the puzzle that was solved */
  puzzleID: string;
  /** How many moves it was solved in */
  moves: number;
  /**
   * Who solved it, as their score is listed on the leaderboard: by their
   * handle, or by their identity if they have none. Only given once their
   * score has been posted, as a shared link can't show a score until then.
   */
  player?: string;
  /**
   * Called when the player asks to post their score, which begins with
   * signing in. Only given while that is what stands between the score and
   * the leaderboard.
   */
  onSignIn?: () => void;
  className?: string;
}

/** Where a post is written on Bluesky, with its words filled in. The player posts it from there, so Worbik needs no leave to write to their account. */
const COMPOSE = `https://bsky.app/intent/compose`;

/**
 * The screens that have the device's own way of sharing within reach. A
 * desktop has one too, but it's a window of apps that nobody expects from
 * a web page, so there the ways of sharing are spelled out instead.
 */
const HANDHELD = `not ((min-width: 768px) and (min-height: 541px))`;

const dayFormat = new Intl.DateTimeFormat(`en-US`, {
  month: `short`,
  day: `numeric`,
  // A puzzle's day is named for the date that it begins on, wherever it's being read
  timeZone: `UTC`
});

interface ContentsProps extends Omit<ShareProps, "className"> {
  /** Called once the result has been handed over to be shared */
  onShared: () => void;
}

/** The contents of the sheet, which only exist while it's open so that the card isn't fetched until then */
const Contents: React.FC<ContentsProps> = ({
  puzzleID,
  moves,
  player,
  onSignIn,
  onShared
}) => {
  const [copied, setCopied] = useState(false);
  const [day, dimensions] = puzzleID.split(`_`);
  const size = dimensions.replace(`x`, `×`);
  const path = [`/s`, day, dimensions, ...(player ? [player] : [])].join(`/`);
  const url = `${location.origin}${path}`;
  const card = `/api/card?${new URLSearchParams({ puzzle: puzzleID, ...(player && { player }) }).toString()}`;
  const text = `Worbik ${size} · ${dayFormat.format(new Date(getPuzzleStart(puzzleID)))} · ${moves} ${moves === 1 ? `move` : `moves`}`;
  const compose = `${COMPOSE}?${new URLSearchParams({ text: `${text}\n${url}` }).toString()}`;
  // Read once this is on screen, which is after the page has reached a browser
  const handheld = useMemo(
    () => `share` in navigator && matchMedia(HANDHELD).matches,
    []
  );

  const share = useCallback(() => {
    const hand = async (): Promise<void> => {
      try {
        await navigator.share({ text, url });
        onShared();
      } catch {
        // Deciding against sharing after all is no fault, and leaves the sheet open to try another way
      }
    };

    void hand();
  }, [text, url, onShared]);

  const copy = useCallback(() => {
    const write = async (): Promise<void> => {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        // The link is shown in full above the button, to be copied by hand where this isn't allowed
      }
    };

    void write();
  }, [url]);

  const post = useCallback(() => {
    // Signing in takes the place of this, rather than piling up on top of it
    onShared();
    onSignIn?.();
  }, [onShared, onSignIn]);

  return (
    <>
      <header className={styles.header}>
        <DialogHeading className={styles.heading}>
          Share your result
        </DialogHeading>
        <DialogDismiss className={styles.close} aria-label="Close">
          <PiXThin aria-hidden />
        </DialogDismiss>
      </header>
      <img
        className={styles.card}
        src={card}
        width={1200}
        height={630}
        alt={
          player
            ? `The card that your link shows: ${moves} moves on the ${size}, and an invitation to beat it.`
            : `The card that your link shows: the ${size}, and an invitation to solve it.`
        }
      />
      <p className={styles.message}>
        {text}
        <span>{url}</span>
      </p>
      {!player && (
        <p className={styles.note}>
          {onSignIn
            ? `Post your score to put it on the leaderboard, and on the card that your link shows. Or share the link as it is.`
            : `The card only shows a score that is on the leaderboard.`}
        </p>
      )}
      {onSignIn && (
        <button type="button" className={styles.post} onClick={post}>
          Post my score
        </button>
      )}
      <div className={styles.actions}>
        {handheld && (
          <button
            type="button"
            className={onSignIn ? styles.button : styles.primary}
            onClick={share}
          >
            Share…
          </button>
        )}
        <a
          className={onSignIn || handheld ? styles.button : styles.primary}
          href={compose}
          target="_blank"
          rel="noreferrer"
        >
          Post on Bluesky
        </a>
        <button type="button" className={styles.button} onClick={copy}>
          <span aria-live="polite">{copied ? `Copied` : `Copy link`}</span>
        </button>
      </div>
    </>
  );
};

/**
 * Shares a solve as a link, which shows as a picture wherever it's pasted.
 *
 * The link is handed to the device's own way of sharing, so that the one
 * button serves every app that the player might share to.
 */
export const Share: React.FC<ShareProps> = memo(({ className, ...solve }) => {
  const sheet = useDialogStore();

  return (
    <>
      <DialogDisclosure store={sheet} className={className}>
        Share
      </DialogDisclosure>
      <Sheet store={sheet}>
        <Contents {...solve} onShared={sheet.hide} />
      </Sheet>
    </>
  );
});

Share.displayName = `Share`;
