import { addHours, differenceInHours, parse, startOfToday } from "date-fns";
import { dateKeyRegex } from "./dateKeyRegex";
import type { DateKey } from "./getDateKey";

export const DAYS_UNTIL_EXPIRED = 2 as const;

export const isExpired = (puzzleID: DateKey): boolean => {
  if (!dateKeyRegex.test(puzzleID)) {
    throw new Error(`Could not parse puzzleID: ${puzzleID}`);
  }
  const format = `MM-dd-yyyy kk x`;
  const genereratedOn = parse(
    `${puzzleID.split(`_`)[0]} 06 +00`,
    format,
    new Date()
  ); //?
  const regenerateOn = addHours(startOfToday(), 10); //?
  return differenceInHours(regenerateOn, genereratedOn) > 48;
};
