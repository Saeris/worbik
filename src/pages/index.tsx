import type { GetServerSideProps } from "next";
import { Redis } from "@upstash/redis";
import { Game } from "../routes/Game";
import type { RawPuzzleSchema } from "../utils";
import { generate, getDateKey, puzzleSchema, PuzzleState } from "../utils";
import type { GameProps } from "../routes/Game";

export const getServerSideProps: GetServerSideProps<
  GameProps,
  RawPuzzleSchema
> = async (ctx) => {
  ctx.res.setHeader(`Cache-Control`, `max-age=0, s-maxage=86400`);
  const config = puzzleSchema.parse(ctx.query);
  const puzzleID = getDateKey(config);
  const debug = Boolean(ctx.query.debug);
  // use debug value
  if (debug) {
    const puzzle = new PuzzleState(`6worbikworbikworbik`).getNextState(
      0,
      `left`
    );
    return {
      props: {
        puzzleID,
        challenge: PuzzleState.compare(
          puzzle.toString(),
          puzzle.initial.toString()
        )
      }
    };
  }
  // check if puzzle already exists
  const redis = Redis.fromEnv();
  const cachedPair = (await redis.get<string>(puzzleID))?.split(`|`);
  if (cachedPair) {
    const [puzzle, solution] = cachedPair;
    const challenge = PuzzleState.compare(puzzle, solution);
    // eslint-disable-next-line no-console
    console.log(`Returning cached puzzled:\n\n`, { challenge, solution });
    return {
      props: {
        puzzleID,
        challenge
      }
    };
  }
  // Generate new puzzle
  const puzzle = generate(config);
  const solution = puzzle.initial.toString();
  const challenge = PuzzleState.compare(puzzle.toString(), solution);
  // eslint-disable-next-line no-console
  console.log(`Generated new puzzle:\n\n`, { challenge, solution });
  await redis.set(puzzleID, `${challenge}|${solution}`, {
    ex: 86400,
    nx: true
  });
  return {
    props: {
      puzzleID,
      challenge
    }
  };
};

export default Game;
