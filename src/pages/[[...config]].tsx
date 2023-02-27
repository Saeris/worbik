import type { GetStaticPaths, GetStaticProps } from "next/types";
import { get, getAll } from "@vercel/edge-config";
import { Game } from "../routes/Game";
import { getDateKey, puzzleSchema, sizes } from "../utils";
import type { GameProps } from "../routes/Game";

export const getStaticProps: GetStaticProps<GameProps> = async (ctx) => {
  const [width, height] = (
    typeof ctx.params?.config === `undefined` ? `5x5` : ctx.params.config[0]
  ).split(`x`);
  const config = puzzleSchema.parse({ width, height });
  const puzzleID = getDateKey(config);
  const cachedPuzzle = await get<{
    challenge: string;
    solution: string;
  }>(puzzleID);

  if (typeof cachedPuzzle === `undefined`) {
    throw new Error(`Unable to retrieve cached puzzle id: ${puzzleID}`);
  }

  return {
    props: {
      puzzleID,
      challenge: cachedPuzzle.challenge
    }
  };
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: sizes.map(([width, height]) => `/${width}x${height}` as const),
    fallback: "blocking"
  };
};

export default Game;
