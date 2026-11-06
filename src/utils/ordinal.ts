const suffixes: Partial<Record<Intl.LDMLPluralRule, string>> = {
  one: `st`,
  two: `nd`,
  few: `rd`
};

const rules = new Intl.PluralRules(`en`, { type: `ordinal` });

/** A place in a ranking as it's spoken: 1st, 2nd, 3rd, 4th, and so on */
export const ordinal = (place: number): string =>
  `${place}${suffixes[rules.select(place)] ?? `th`}`;
