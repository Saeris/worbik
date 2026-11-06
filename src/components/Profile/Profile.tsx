import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore
} from "react";
import { Link } from "@void/react";
import { PiCaretLeftThin, PiCaretRightThin } from "react-icons/pi";
import { fetch } from "void/client";
import type { Player } from "#auth/player";
import { usePlayer } from "#hooks";
import { getPuzzleID, getPuzzleStart } from "#utils";
import { getMonthLength, getWeeks, toDayKey } from "#utils/calendar";
import { ordinal } from "#utils/ordinal";
import { getStreaks } from "#utils/streak";
import { SignIn } from "../SignIn";
import styles from "./Profile.module.css";

/** What a player has done, as the server tells it */
interface History {
  /** Every day that they solved a puzzle on, as `MM-DD-YYYY`, and how many of that day's puzzles they solved */
  readonly days: Array<{ day: string; solved: number }>;
  /** Their latest results, newest first */
  readonly recent: Array<{
    puzzle: string;
    moves: number;
    place: number;
  }>;
}

type View = `month` | `year`;

const MONTHS = Array.from(
  { length: 12 },
  (_, month) => new Date(Date.UTC(2026, month, 1))
);

const monthFormat = new Intl.DateTimeFormat(undefined, {
  month: `long`,
  year: `numeric`,
  timeZone: `UTC`
});

const shortMonthFormat = new Intl.DateTimeFormat(undefined, {
  month: `short`,
  timeZone: `UTC`
});

const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: `short`,
  month: `short`,
  day: `numeric`,
  timeZone: `UTC`
});

const longDayFormat = new Intl.DateTimeFormat(undefined, {
  month: `long`,
  day: `numeric`,
  timeZone: `UTC`
});

const weekdayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: `narrow`,
  timeZone: `UTC`
});

const longWeekdayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: `long`,
  timeZone: `UTC`
});

/** The days of a week, from Sunday. The fourth of January 1970 was one. */
const WEEKDAYS = Array.from(
  { length: 7 },
  (_, day) => new Date(Date.UTC(1970, 0, 4 + day))
);

const plural = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`;

interface CalendarProps {
  /** How many puzzles were solved on each day that any were, by `MM-DD-YYYY` */
  readonly solved: ReadonlyMap<string, number>;
  /** The day of the puzzle that is being played, as the year, the month from zero, and the date */
  readonly today: readonly [year: number, month: number, date: number];
}

interface StepperProps {
  readonly label: string;
  readonly detail?: string;
  readonly earlier: string;
  readonly later: string;
  /** Whether there is anything later to step to */
  readonly atEnd: boolean;
  readonly onStep: (by: number) => void;
}

/** Steps back and forth through months or years */
const Stepper: React.FC<StepperProps> = ({
  label,
  detail,
  earlier,
  later,
  atEnd,
  onStep
}) => {
  const back = useCallback(() => {
    onStep(-1);
  }, [onStep]);

  const forward = useCallback(() => {
    onStep(1);
  }, [onStep]);

  return (
    <div className={styles.stepper}>
      <button type="button" aria-label={earlier} onClick={back}>
        <PiCaretLeftThin aria-hidden />
      </button>
      <p aria-live="polite">
        {label}
        {detail && <small>{detail}</small>}
      </p>
      <button
        type="button"
        aria-label={later}
        disabled={atEnd}
        onClick={forward}
      >
        <PiCaretRightThin aria-hidden />
      </button>
    </div>
  );
};

/**
 * A month, with the days that a puzzle was solved on filled in. Days that
 * follow one another are joined, so that a streak can be seen as one shape.
 */
const Month: React.FC<CalendarProps> = ({ solved, today }) => {
  // How many months before the present one
  const [ago, setAgo] = useState(0);
  const first = new Date(Date.UTC(today[0], today[1] - ago, 1));
  const year = first.getUTCFullYear();
  const month = first.getUTCMonth();
  const played = (date: number | null): boolean =>
    date !== null && solved.has(toDayKey(year, month, date));

  const step = useCallback((by: number) => {
    setAgo((months) => Math.max(0, months - by));
  }, []);

  return (
    <>
      <Stepper
        label={monthFormat.format(first)}
        earlier="Earlier month"
        later="Later month"
        atEnd={ago === 0}
        onStep={step}
      />
      <table className={styles.month}>
        <thead>
          <tr>
            {WEEKDAYS.map((day) => (
              <th
                key={day.getTime()}
                scope="col"
                abbr={longWeekdayFormat.format(day)}
              >
                {weekdayFormat.format(day)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getWeeks(year, month).map((week, index) => (
            // oxlint-disable-next-line react/no-array-index-key -- the weeks of a month have no identity but their order
            <tr key={index}>
              {week.map((date, column) => {
                if (date === null) {
                  // A day of another month, which takes up its place in the week and says nothing
                  // oxlint-disable-next-line react/no-array-index-key -- the empty days at either end of a month have no identity but their place
                  return <td key={`blank-${column}`}>{` `}</td>;
                }

                const count = solved.get(toDayKey(year, month, date)) ?? 0;
                const isToday = ago === 0 && date === today[2];

                return (
                  <td
                    key={date}
                    data-played={count > 0 || undefined}
                    // A run is drawn towards whichever neighbors were also played, without crossing from one week to the next
                    data-before={
                      (count > 0 && column > 0 && played(week[column - 1])) ||
                      undefined
                    }
                    data-after={
                      (count > 0 && column < 6 && played(week[column + 1])) ||
                      undefined
                    }
                    data-later={(ago === 0 && date > today[2]) || undefined}
                    aria-current={isToday ? `date` : undefined}
                  >
                    <span>{date}</span>
                    {count > 0 && (
                      <small>{`, ${plural(count, `puzzle`, `puzzles`)} solved`}</small>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

/** Which of four shades a day is given, by how many of its puzzles were solved */
const getLevel = (count: number): number =>
  count === 0 ? 0 : count === 1 ? 1 : count < 5 ? 2 : 3;

/**
 * A year, with every day shaded by how many of its puzzles were solved.
 * Where the month shows whether each day was played, this shows how much.
 */
const Year: React.FC<CalendarProps> = ({ solved, today }) => {
  // How many years before the present one
  const [ago, setAgo] = useState(0);
  const year = today[0] - ago;
  const months = MONTHS.map((name, month) => {
    const counts = Array.from(
      { length: getMonthLength(year, month) },
      (_, index) => solved.get(toDayKey(year, month, index + 1)) ?? 0
    );

    return {
      month,
      name: shortMonthFormat.format(name),
      blanks: new Date(Date.UTC(year, month, 1)).getUTCDay(),
      counts,
      puzzles: counts.reduce((sum, count) => sum + count, 0),
      days: counts.filter(Boolean).length
    };
  });
  const puzzles = months.reduce((sum, month) => sum + month.puzzles, 0);
  const days = months.reduce((sum, month) => sum + month.days, 0);

  const step = useCallback((by: number) => {
    setAgo((years) => Math.max(0, years - by));
  }, []);

  return (
    <>
      <Stepper
        label={String(year)}
        detail={`${plural(puzzles, `puzzle`, `puzzles`)} on ${plural(days, `day`, `days`)}`}
        earlier="Earlier year"
        later="Later year"
        atEnd={ago === 0}
        onStep={step}
      />
      <div className={styles.year}>
        {months.map(({ month, name, blanks, counts, ...total }) => (
          <figure
            key={month}
            // A month is described once, as its squares say nothing by themselves
            aria-label={`${name}: ${plural(total.puzzles, `puzzle`, `puzzles`)} on ${plural(total.days, `day`, `days`)}`}
          >
            <figcaption aria-hidden>{name}</figcaption>
            <div>
              {Array.from({ length: blanks }, (_, blank) => (
                // oxlint-disable-next-line react/no-array-index-key -- the empty days before a month begins have no identity
                <span key={`blank-${blank}`} />
              ))}
              {counts.map((count, index) => (
                <i
                  // oxlint-disable-next-line react/no-array-index-key -- a day of a month is identified by its place in it
                  key={index}
                  data-level={getLevel(count) || undefined}
                  data-later={
                    (ago === 0 &&
                      (month > today[1] ||
                        (month === today[1] && index + 1 > today[2]))) ||
                    undefined
                  }
                />
              ))}
            </div>
          </figure>
        ))}
      </div>
      <p className={styles.legend} aria-hidden>
        Fewer
        <i />
        <i data-level={1} />
        <i data-level={2} />
        <i data-level={3} />
        More sizes solved in a day
      </p>
    </>
  );
};

interface DetailsProps {
  readonly player: Player;
  readonly history: History;
}

const Details: React.FC<DetailsProps> = ({ player, history }) => {
  const id = useId();
  const [view, setView] = useState<View>(`month`);
  const [day] = getPuzzleID().split(`_`);
  const [month, date, year] = day.split(`-`).map(Number);
  const today = [year, month - 1, date] as const;
  const solved = new Map(
    history.days.map((entry) => [entry.day, entry.solved])
  );
  const streaks = getStreaks([...solved.keys()], day);
  const total = history.days.reduce((sum, entry) => sum + entry.solved, 0);
  const name = player.handle ? `@${player.handle}` : player.did;

  const pickView: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    ({ currentTarget }) => {
      setView(currentTarget.value === `year` ? `year` : `month`);
    },
    []
  );

  return (
    <>
      <div className={styles.person}>
        <span aria-hidden>
          {(player.handle ?? `?`).charAt(0).toUpperCase()}
        </span>
        <strong>{name}</strong>
      </div>
      <dl className={styles.stats}>
        <div>
          <dd>{streaks.current}</dd>
          <dt>Day streak</dt>
        </div>
        <div>
          <dd>{streaks.best}</dd>
          <dt>Best streak</dt>
        </div>
        <div>
          <dd>{total}</dd>
          <dt>Puzzles solved</dt>
        </div>
      </dl>
      <div role="radiogroup" aria-label="Show" className={styles.views}>
        {([`month`, `year`] as const).map((option) => (
          <label key={option}>
            <input
              type="radio"
              name={`${id}-view`}
              value={option}
              checked={view === option}
              onChange={pickView}
            />
            {option === `month` ? `Month` : `Year`}
          </label>
        ))}
      </div>
      {view === `month` ? (
        <Month solved={solved} today={today} />
      ) : (
        <Year solved={solved} today={today} />
      )}
      {view === `month` && history.recent.length > 0 && (
        <section className={styles.recent}>
          <h2>Recent</h2>
          <ol>
            {history.recent.map(({ puzzle, moves, place }) => {
              const [when, size] = puzzle.split(`_`);

              return (
                <li key={puzzle}>
                  <span>
                    {`${when === day ? `Today` : dayFormat.format(new Date(getPuzzleStart(puzzle)))} · ${size.replace(`x`, `×`)}`}
                  </span>
                  <span>{plural(moves, `move`, `moves`)}</span>
                  <span>{ordinal(place)}</span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
      {streaks.current > 0 && !solved.has(day) && (
        <p className={styles.nudge}>
          {`Solve any of today’s puzzles to keep your streak. It ends when ${longDayFormat.format(new Date(Date.UTC(year, month - 1, date)))}’s puzzles do.`}
        </p>
      )}
    </>
  );
};

/** What the server has for a player, `null` if it couldn't be reached, and `undefined` until it answers */
const useHistory = (did: string | undefined): History | null | undefined => {
  const [loaded, setLoaded] = useState<{
    did: string;
    history: History | null;
  } | null>(null);

  useEffect(() => {
    if (!did) return undefined;

    // Set when the player changes, so that someone else's history isn't shown as theirs
    const stale = new AbortController();

    const load = async (): Promise<void> => {
      let history: History | null = null;

      try {
        history = await fetch(`/api/profile`, { query: { player: did } });
      } catch {
        // Shown as a profile that couldn't be loaded, rather than as an empty one
      }

      if (!stale.signal.aborted) setLoaded({ did, history });
    };

    void load();

    return (): void => {
      stale.abort();
    };
  }, [did]);

  return loaded && loaded.did === did ? loaded.history : undefined;
};

/** Whether the page is running in a browser yet never changes once it is, so there is nothing to listen for */
const never = (): (() => void) => () => {};
const inBrowser = (): boolean => true;
const onServer = (): boolean => false;

/**
 * A player's own record: their streak, the days that they played on, and
 * their latest results.
 *
 * It's made of the scores that they have posted, so there is one only for
 * a player who has signed in.
 */
export const Profile: React.FC = () => {
  const player = usePlayer();
  const history = useHistory(player?.did);
  // The page is first drawn by the server, which can't know who the player is. Nothing is said about them until the browser has had its say.
  const ready = useSyncExternalStore(never, inBrowser, onServer);

  return (
    <main className={styles.main}>
      <header className={styles.bar}>
        <Link href="/" aria-label="Back to the puzzle">
          <PiCaretLeftThin aria-hidden />
        </Link>
        <h1>Profile</h1>
      </header>
      {!ready ? null : !player ? (
        <div className={styles.empty}>
          <strong>Sign in to keep a streak</strong>
          <p>
            Your streak and your results are made of the scores that you post,
            so they need an account to belong to. You can play without one.
          </p>
          <SignIn />
        </div>
      ) : history === undefined ? (
        <p className={styles.empty}>Loading…</p>
      ) : history === null ? (
        <p className={styles.empty}>
          Couldn’t load your profile. Check your connection and try again.
        </p>
      ) : (
        <Details player={player} history={history} />
      )}
    </main>
  );
};
