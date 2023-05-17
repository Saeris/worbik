import type { GetStaticPaths, GetStaticProps } from "next/types";
import { createClient } from "@vercel/edge-config";
import { Game } from "../routes/Game";
import {
  type Challenge,
  getDateKey,
  parseSize,
  puzzleSchema,
  sizes
} from "../utils";
import type { GameProps } from "../routes/Game";

export const getStaticProps: GetStaticProps<GameProps | {}> = async (ctx) => {
  const size = parseSize(ctx.params?.config?.[0]);
  const config = puzzleSchema.parse(size);
  const puzzleID = getDateKey(config, 0);
  const edgeConfig = createClient(process.env.EDGE_CONFIG);
  const cachedPuzzle = await edgeConfig.get<Challenge>(puzzleID);

  if (typeof cachedPuzzle === `undefined`) {
    throw new Error(`Unable to retrieve cached puzzle id: ${puzzleID}`);
  }

  const props = {
    puzzleID,
    init: [config.width ?? 5, cachedPuzzle[1], cachedPuzzle[0]]
  };

  // eslint-disable-next-line no-console
  console.log({ size, config, props });

  return {
    props
  };
};

export const getStaticPaths: GetStaticPaths = () => ({
  paths: sizes.map(([width, height]) => `/${width}x${height}` as const),
  fallback: `blocking`
});

export default Game;
