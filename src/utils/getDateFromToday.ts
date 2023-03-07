import { DAYS_UNTIL_EXPIRED } from "./isExpired";
import { type DateString, toDateString } from "./toDateString";

export const getDateFromToday = (
  difference: number = -DAYS_UNTIL_EXPIRED
): DateString => {
  const date = new Date();
  date.setDate(date.getDate() + difference);
  return toDateString(date);
};
