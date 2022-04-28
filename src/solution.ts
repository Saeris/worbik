import { randomize } from "./utils";

export const solution = [
  ["t", "e", "a", "c", "h"],
  ["g", "o", "o", "s", "e"],
  ["r", "e", "a", "c", "t"],
  ["f", "a", "n", "c", "y"],
  ["c", "l", "o", "s", "e"]
];

export const jumbled = randomize(solution.slice());
