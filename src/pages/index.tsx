import type { GetServerSideProps } from "next";
import { Game } from "../routes/Game";
import { cacheHints, generate, group, parseChallenge } from "../utils";
import type { RawPuzzleSchema } from "../utils/puzzleSchema";
import { puzzleSchema } from "../utils/puzzleSchema";
import type { GameProps } from "../routes/Game";

export const getServerSideProps: GetServerSideProps<
  GameProps,
  RawPuzzleSchema
> = async (ctx) => {
  const { challenge, solution } = generate(puzzleSchema.parse(ctx.query));
  const { challenge: initial, length } = parseChallenge(challenge);
  // For some reason, Nextjs doesn't tree-shake out Redis
  // eslint-disable-next-line no-console
  console.log({ challenge, solution });
  const redis = (await import(`@upstash/redis`)).Redis.fromEnv();
  await redis.set(challenge, solution, { ex: 86400, nx: true });
  ctx.res.setHeader(`Cache-Control`, `max-age=0, s-maxage=86400`);
  return {
    props: {
      challenge,
      hints: group(cacheHints(initial.flat().join(``)), length)
    }
  };
};

export default Game;
