import type { GetStaticProps } from "next";
import type { Matrix2D } from "../../utils";
import { generate, group, cacheHints, parseChallenge } from "../../utils";
import { puzzleSchema } from "../../utils/puzzleSchema";

export const getStaticProps: GetStaticProps<{
  challenge: string;
  hints: Matrix2D<string>;
}> = async (ctx) => {
  const config =
    ctx.params && Array.isArray(ctx.params.config) ? ctx.params.config : [];
  const { size, words } = puzzleSchema.parse({
    words: config[0],
    size: config[1]
  });
  const { challenge, solution } = generate(size, words);
  const { challenge: initial, length } = parseChallenge(challenge);
  // For some reason, Nextjs doesn't tree-shake out Redis
  const redis = (await import(`@upstash/redis`)).Redis.fromEnv();
  await redis.set(challenge, solution, { ex: 86400, nx: true });
  const hints = group(cacheHints(initial.flat().join(``)), length);
  return {
    props: {
      challenge,
      hints
    },
    revalidate: 86400 // Revalidate every 24hrs
  };
};
