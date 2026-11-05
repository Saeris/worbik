import { addHours, differenceInHours, parse, startOfToday } from "date-fns";
import { dateKeyRegex } from "./dateKeyRegex";
import type { DateKey } from "./getDateKey";

export const DAYS_UNTIL_EXPIRED = 2;

export const isExpired = (puzzleID: DateKey): boolean => {
  if (!dateKeyRegex.test(puzzleID)) {
    throw new Error(`Could not parse puzzleID: ${puzzleID}`);
  }
  return (
    differenceInHours(
      /* regenerates at */
      addHours(startOfToday(), 10),
      /* puzzle genereration time */
      parse(`${puzzleID.split(`_`)[0]} 06 +00`, `MM-dd-yyyy kk x`, new Date())
    ) > 48
  );
};
