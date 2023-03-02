import { DAYS_UNTIL_EXPIRED } from "./isExpired";
import { toDateString } from "./toDateString";

export const getDateFromToday = (
  difference: number = -DAYS_UNTIL_EXPIRED
): string => {
  const date = new Date();
  date.setDate(date.getDate() + difference);
  return toDateString(date);
};
