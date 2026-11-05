import { memo } from "react";
import { Link } from "@void/react";
import {
  PiGearThin,
  PiMoonStars,
  PiMoonStarsFill,
  PiSun,
  PiSunFill,
  PiYinYang,
  PiYinYangFill
} from "react-icons/pi";
import { sizes } from "#utils";
import { Modal } from "../Modal";
import styles from "./Config.module.css";

// The same key and values that were used by `next-themes`, so returning players keep their choice
const STORAGE_KEY = `theme`;

const schemes = [`system`, `light`, `dark`] as const;

type Scheme = (typeof schemes)[number];

/** How each scheme is presented: an outlined icon, and a filled one for when it's the selected scheme */
const options = {
  system: {
    label: `Match system`,
    Icon: PiYinYang,
    SelectedIcon: PiYinYangFill
  },
  light: { label: `Light`, Icon: PiSun, SelectedIcon: PiSunFill },
  dark: { label: `Dark`, Icon: PiMoonStars, SelectedIcon: PiMoonStarsFill }
} as const satisfies Record<Scheme, unknown>;

/** Reads the color scheme the player last chose, which is `system` unless they've overridden it */
const getScheme = (): Scheme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === `light` || stored === `dark` ? stored : `system`;
  } catch {
    // Storage can be unavailable, e.g. when site data is blocked
    return `system`;
  }
};

/**
 * The theme's colors all key off of the `data-theme` attribute of the root
 * element, so switching schemes is only a matter of updating it. The same
 * is done by an inline script in the document's head before first paint.
 */
const applyScheme = (scheme: Scheme): void => {
  if (scheme === `system`) {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = scheme;
  }
};

const changeScheme: React.ChangeEventHandler<HTMLInputElement> = ({
  currentTarget
}) => {
  const scheme =
    schemes.find((value) => value === currentTarget.value) ?? `system`;
  try {
    if (scheme === `system`) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, scheme);
    }
  } catch {
    // The scheme still applies to this page, even when it can't be persisted
  }
  applyScheme(scheme);
};

/**
 * Selects the option for the stored color scheme once the options are in
 * the document, and again whenever the scheme is changed from another tab
 */
const syncScheme = (group: HTMLDivElement): (() => void) => {
  const sync = (): void => {
    const scheme = getScheme();
    const option = group.querySelector<HTMLInputElement>(
      `input[value="${scheme}"]`
    );
    if (option) option.checked = true;
    applyScheme(scheme);
  };
  sync();
  window.addEventListener(`storage`, sync);
  return () => {
    window.removeEventListener(`storage`, sync);
  };
};

const SizeButtons: React.FC = memo(() => (
  <>
    {sizes.map(([width, height]) => {
      const size = `${width}×${height}`;
      return (
        <Link key={size} className={styles.size} href={`/${width}x${height}`}>
          {size}
        </Link>
      );
    })}
  </>
));

SizeButtons.displayName = `SizeButtons`;

export const Config: React.FC = memo(() => (
  <Modal label={<PiGearThin />} aria-label="Config" title="Settings:">
    <h1 id="color-scheme" className={styles.header}>
      Theme Mode
    </h1>
    <div
      ref={syncScheme}
      role="radiogroup"
      aria-labelledby="color-scheme"
      className={styles.schemes}
    >
      {schemes.map((scheme) => {
        const { label, Icon, SelectedIcon } = options[scheme];
        return (
          <label key={scheme} className={styles.scheme} title={label}>
            <input
              type="radio"
              name="color-scheme"
              value={scheme}
              defaultChecked={scheme === `system`}
              onChange={changeScheme}
              aria-label={label}
            />
            <Icon aria-hidden />
            <SelectedIcon aria-hidden />
          </label>
        );
      })}
    </div>
    <h1 className={styles.header}>Board Size</h1>
    <article className={styles.frame}>
      <SizeButtons />
    </article>
  </Modal>
));

Config.displayName = `Config`;
