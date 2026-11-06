import { useEffect, useMemo, useState } from "react";
import {
  Combobox,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxItem,
  ComboboxLabel,
  ComboboxPopover,
  ComboboxProvider
} from "@ariakit/react";
import * as v from "valibot";
import { normalizeHandle } from "#auth/handle";
import { getAccounts } from "#auth/player";
import styles from "./SignIn.module.css";

/**
 * A field for typing a handle, which suggests accounts as it's typed:
 * first those that have signed in on this device, then those across the
 * network that match.
 *
 * It isn't a username field, and is marked so that browsers and password
 * managers leave it alone. A handle isn't an email address, and no password
 * is asked for here: the account's own server does that.
 */

interface Actor {
  readonly did: string;
  readonly handle: string;
  readonly displayName?: string;
  readonly avatar?: string;
}

/** Where accounts are looked up by what has been typed: Bluesky's public directory, which lists accounts on any server */
const DIRECTORY = `https://public.api.bsky.app/xrpc/app.bsky.actor.searchActorsTypeahead`;

/** How long typing has to pause for before the directory is asked, in milliseconds */
const PAUSE = 200;

/** The fewest characters that are worth asking the directory about */
const MIN_TERM = 2;

/** The directory's answer. It's a service that Worbik doesn't run, so an answer of any other shape suggests nothing. */
const answer = v.object({
  actors: v.array(
    v.object({
      did: v.string(),
      handle: v.string(),
      displayName: v.optional(v.string()),
      avatar: v.optional(v.string())
    })
  )
});

/** The accounts across the network that match what has been typed, once typing pauses */
const useMatches = (term: string): Actor[] => {
  const [found, setFound] = useState<{ term: string; actors: Actor[] }>({
    term: ``,
    actors: []
  });

  useEffect(() => {
    if (term.length < MIN_TERM) return undefined;

    // Set when more is typed, so that an answer about less doesn't replace the suggestions for it
    const stale = new AbortController();

    const search = async (): Promise<void> => {
      let actors: Actor[] = [];

      try {
        const url = new URL(DIRECTORY);
        url.searchParams.set(`q`, term);
        url.searchParams.set(`limit`, `6`);

        const response = await fetch(url, { signal: stale.signal });
        const body = v.safeParse(answer, await response.json());

        if (response.ok && body.success) actors = body.output.actors;
      } catch {
        // Suggestions are a convenience, and a handle can always be typed out in full
      }

      if (!stale.signal.aborted) setFound({ term, actors });
    };

    const pause = setTimeout(() => {
      void search();
    }, PAUSE);

    return (): void => {
      clearTimeout(pause);
      stale.abort();
    };
  }, [term]);

  // What was found for a shorter term goes on being shown while a longer one is looked up, as most of it still matches
  return term.length < MIN_TERM ? [] : found.actors;
};

const Who: React.FC<Omit<Actor, "did">> = ({ handle, displayName, avatar }) => (
  <>
    {avatar ? (
      <img src={avatar} alt="" width={24} height={24} loading="lazy" />
    ) : (
      <span aria-hidden />
    )}
    <span>
      {displayName ? (
        <>
          {`${displayName} `}
          <small>{`@${handle}`}</small>
        </>
      ) : (
        `@${handle}`
      )}
    </span>
  </>
);

export interface HandleFieldProps {
  /** What has been typed */
  value: string;
  /** Called with what is typed, or with the handle of a suggestion that is picked */
  onChange: (value: string) => void;
}

export const HandleField: React.FC<HandleFieldProps> = ({
  value,
  onChange
}) => {
  const [open, setOpen] = useState(false);
  const term = normalizeHandle(value);
  // Read once, as the accounts on this device don't change while signing in to one of them
  const remembered = useMemo(() => getAccounts(), []);
  const matches = useMatches(term);
  const mine = remembered.filter(({ handle }) => handle.includes(term));
  const others = matches.filter(
    ({ did }) => !mine.some((account) => account.did === did)
  );

  return (
    <ComboboxProvider
      inputValue={value}
      setInputValue={onChange}
      // An empty list of suggestions isn't worth opening
      open={open && mine.length + others.length > 0}
      setOpen={setOpen}
    >
      <ComboboxLabel className={styles.label}>Your handle</ComboboxLabel>
      <div className={styles.field}>
        <span aria-hidden>@</span>
        <Combobox
          name="atproto-handle"
          placeholder="you.bsky.social"
          required
          showOnClick
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          // Not a username or an email address, so password managers and the browser's own suggestions are asked to keep out
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          data-form-type="other"
        />
      </div>
      <ComboboxPopover gutter={4} sameWidth className={styles.suggestions}>
        {mine.length > 0 && (
          <ComboboxGroup>
            <ComboboxGroupLabel>On this device</ComboboxGroupLabel>
            {mine.map(({ did, handle }) => (
              <ComboboxItem key={did} value={handle}>
                <Who handle={handle} />
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        )}
        {others.length > 0 && (
          <ComboboxGroup>
            <ComboboxGroupLabel>Accounts</ComboboxGroupLabel>
            {others.map(({ did, ...actor }) => (
              <ComboboxItem key={did} value={actor.handle}>
                <Who {...actor} />
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        )}
      </ComboboxPopover>
    </ComboboxProvider>
  );
};
