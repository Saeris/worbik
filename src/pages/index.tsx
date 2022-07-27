import type { GetServerSideProps } from "next";
import { Game } from "../routes/Game";
import type { RawPuzzleSchema } from "../utils";
import { generate, puzzleSchema, PuzzleState } from "../utils";
import type { GameProps } from "../routes/Game";

export const getServerSideProps: GetServerSideProps<
  GameProps,
  RawPuzzleSchema
> = async (ctx) => {
  const puzzle = generate(puzzleSchema.parse(ctx.query));
  const solution = puzzle.initial.toString();
  const challenge = PuzzleState.compare(puzzle.toString(), solution);
  // For some reason, Nextjs doesn't tree-shake out Redis
  // eslint-disable-next-line no-console
  console.log({ challenge, solution });
  const redis = (await import(`@upstash/redis`)).Redis.fromEnv();
  await redis.set(challenge, solution, { ex: 86400, nx: true });
  ctx.res.setHeader(`Cache-Control`, `max-age=0, s-maxage=86400`);
  return {
    props: {
      challenge
    }
  };
};

export default Game;
