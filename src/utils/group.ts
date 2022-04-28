type Group = <T>(arr: T[], len: number) => T[][];

export const group: Group = (arr, len) => {
  const acc: any[][] = [];
  while (arr.length) {
    acc.push(arr.splice(0, len));
  }
  return acc;
};
