import type { GetServerSideProps } from "next";
import { Redis } from "@upstash/redis";
import { Game } from "../routes/Game";
import type { RawPuzzleSchema } from "../utils";
import { generate, puzzleSchema, PuzzleState } from "../utils";
import type { GameProps } from "../routes/Game";

export const getServerSideProps: GetServerSideProps<
  GameProps,
  RawPuzzleSchema
> = async (ctx) => {
  const debug = Boolean(ctx.query.debug);
  const config = puzzleSchema.parse(ctx.query);
  const puzzle = debug
    ? new PuzzleState(`6worbikworbikworbik`).getNextState(0, `left`)
    : generate(config);
  const solution = puzzle.initial.toString();
  const challenge = PuzzleState.compare(puzzle.toString(), solution);
  // eslint-disable-next-line no-console
  console.log({ challenge, solution });
  await Redis.fromEnv().set(challenge.toLowerCase(), solution, {
    ex: 86400,
    nx: true
  });
  ctx.res.setHeader(`Cache-Control`, `max-age=0, s-maxage=86400`);
  return {
    props: {
      challenge
    }
  };
};

export default Game;
