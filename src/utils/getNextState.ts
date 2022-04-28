import { rotateCW } from "./rotateCW";
import { rotateCCW } from "./rotateCCW";
import { rotate2DCW } from "./rotate2DCW";
import { rotate2DCCW } from "./rotate2DCCW";

export const getNextState = (
  matrix: string[][],
  pos: number,
  dir: boolean,
  axis: boolean
): string[][] => {
  const temp = axis ? matrix : rotate2DCW(matrix);
  if (dir) {
    rotateCW(temp[pos]);
  } else {
    rotateCCW(temp[pos]);
  }
  return axis ? temp : rotate2DCCW(temp);
};
