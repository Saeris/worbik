/** Converts a Query Parameter to an Integer */
export const toInt = (param: string | string[]): number =>
  // Query params can be either a string or an array of
  // string (accounting for duplicate params), so if it
  // is an Array, we'll take the first assigned string,
  // otherwise if param is a string, we'll use that. In
  // both cases, if param is an empty string, we'll use
  // `"0"` as the default value. We'll default further to
  // `0` in case parseInt comes back as `NaN`.
  parseInt(
    (Array.isArray(param)
      ? param.find((val) => typeof val === `string`)
      : param) ?? `0`,
    10
  ) || 0;
