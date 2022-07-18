/** Converts a Query Parameter to an Integer */
export const toInt = (param: string | null): number =>
  parseInt(param ?? `0`, 10) || 0;
