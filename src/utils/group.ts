export const group = <T>(arr: T[], width: number): T[][] => {
  if (arr.length % width !== 0) {
    throw new Error(`Array cannot be evenly divided into groups of ${width}`);
  }
  return Array.from({ length: arr.length / width }, () => arr.splice(0, width));
};
