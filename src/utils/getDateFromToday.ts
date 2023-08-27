import { DAYS_UNTIL_EXPIRED } from "./isExpired.ts";
import { type DateString, toDateString } from "./toDateString.ts";

export const getDateFromToday = (
  difference: number = -DAYS_UNTIL_EXPIRED
): DateString => {
  const date = new Date();
  date.setDate(date.getDate() + difference);
  return toDateString(date);
};
