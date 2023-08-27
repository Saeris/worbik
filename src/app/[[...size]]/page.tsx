import React from "react";
// eslint-disable-next-line import/no-unresolved
import { get } from "@vercel/edge-config";
import {
  sizes,
  type Size,
  puzzleSchema,
  parseSize,
  getDateKey,
  type Challenge
} from "#utils";
import { Game } from "#components/Game";

export const dynamicParams = true;

type SizeString = `${Size}x${Size}`;

export const generateStaticParams = (): Array<{
  size: readonly [SizeString];
}> =>
  sizes.map(([width, height]) => ({ size: [`${width}x${height}`] as const }));

const Page = async ({
  params
}: {
  params: { size?: readonly [SizeString, ...string[]] };
}): Promise<React.ReactElement> => {
  const config = puzzleSchema.parse(parseSize(params.size?.[0] ?? `5x5`));
  const puzzleID = getDateKey(config, 0);
  const cachedPuzzle = await get<Challenge>(puzzleID);
  if (typeof cachedPuzzle === `undefined`) {
    throw new Error(`Unable to retrieve cached puzzle id: ${puzzleID}`);
  }

  return (
    <Game
      puzzleID={puzzleID}
      init={[config.width ?? 5, cachedPuzzle[1], cachedPuzzle[0]]}
    />
  );
};

export default Page;
