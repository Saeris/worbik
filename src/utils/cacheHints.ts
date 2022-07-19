export const cacheHints = (prev: string, next: string = prev): string[] => {
  const isUppercase = (str: string): boolean => /^[A-Z]*$/.test(str);
  return prev
    .split(``)
    .map((c, i) =>
      isUppercase(c) ? c : isUppercase(next.charAt(i)) ? next.charAt(i) : ` `
    );
};
