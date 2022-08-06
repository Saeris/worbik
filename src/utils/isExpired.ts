import { differenceInHours, startOfToday } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { dateKeyRegex } from "./getDateKey";

export const isExpired = (puzzleID: string): boolean => {
  const parsed = dateKeyRegex.exec(puzzleID);
  if (!parsed?.groups && !parsed?.groups?.date) {
    throw new Error(`Could not parse puzzleID: ${puzzleID}`);
  }
  return (
    differenceInHours(
      utcToZonedTime(startOfToday(), `Europe/Dublin`),
      new Date(parsed.groups.date)
    ) > 32
  );
};
