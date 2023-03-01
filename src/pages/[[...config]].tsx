import type { GetStaticPaths, GetStaticProps } from "next/types";
import { createClient } from "@vercel/edge-config";
import { Game } from "../routes/Game";
import { getDateKey, parseSize, puzzleSchema, sizes } from "../utils";
import type { GameProps } from "../routes/Game";

export const getStaticProps: GetStaticProps<GameProps | {}> = async (ctx) => {
  const size = parseSize(ctx.params?.config?.[0]);
  if (!size) {
    return {
      props: {}
    };
  }
  const config = puzzleSchema.parse(size);
  const puzzleID = getDateKey(config, 0);
  const edgeConfig = createClient(process.env.EDGE_CONFIG);
  const cachedPuzzle = await edgeConfig.get<{
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

export const getStaticPaths: GetStaticPaths = () => ({
  paths: sizes.map(([width, height]) => `/${width}x${height}` as const),
  fallback: `blocking`
});

export default Game;
