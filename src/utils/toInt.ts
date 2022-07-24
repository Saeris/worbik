/** Converts a Query Parameter to an Integer */
export const toInt = (param?: string | string[] | null): number =>
  parseInt((Array.isArray(param) ? param[0] : param) ?? `0`, 10) || 0;
