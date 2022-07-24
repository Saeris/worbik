import type { GetStaticPaths } from "next";

const getPermutations = (): string[] =>
  [5, 6, 7, 8].reduce<string[]>((acc, words, _, arr) => {
    for (const size of arr) {
      const path =
        words === 5 && size === 5
          ? null
          : `/${words}${size === 5 ? `` : `/${size}`}`;
      if (path) {
        acc.push(path);
      }
    }

    return acc;
  }, []);

export const getStaticPaths: GetStaticPaths<{
  size: string;
  words: string;
}> = () => ({
  paths: getPermutations(),
  fallback: `blocking`
});
