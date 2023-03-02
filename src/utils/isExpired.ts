import { differenceInHours, startOfToday } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { dateKeyRegex } from "./dateKeyRegex";

export const DAYS_UNTIL_EXPIRED = 2 as const;

export const isExpired = (puzzleID: string): boolean => {
  const parsed = dateKeyRegex.exec(puzzleID);
  if (!parsed?.groups && !parsed?.groups?.date) {
    throw new Error(`Could not parse puzzleID: ${puzzleID}`);
  }
  return (
    differenceInHours(
      utcToZonedTime(startOfToday(), `Europe/Dublin`),
      new Date(parsed.groups.date)
    ) >
    DAYS_UNTIL_EXPIRED * 24
  );
};
