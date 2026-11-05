type Month =
  | `01`
  | `02`
  | `03`
  | `04`
  | `05`
  | `06`
  | `07`
  | `08`
  | `09`
  | `10`
  | `11`
  | `12`;

type Day =
  | `01`
  | `02`
  | `03`
  | `04`
  | `05`
  | `06`
  | `07`
  | `08`
  | `09`
  | `10`
  | `11`
  | `12`
  | `13`
  | `14`
  | `15`
  | `16`
  | `17`
  | `18`
  | `19`
  | `20`
  | `21`
  | `22`
  | `23`
  | `24`
  | `25`
  | `26`
  | `27`
  | `28`
  | `29`
  | `30`
  | `31`;

export type DateString = `${Month}-${Day}-${number}`;

/**
 * Formats a date as `MM-DD-YYYY`, in the local timezone of
 * the runtime unless an explicit IANA `timeZone` is given.
 */
export const toDateString = (date: Date, timeZone?: string): DateString =>
  date
    .toLocaleDateString(`en-US`, {
      month: `2-digit`,
      day: `2-digit`,
      year: `numeric`,
      timeZone
    })
    .replaceAll(`/`, `-`) as DateString;
