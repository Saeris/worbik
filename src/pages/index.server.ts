import { defineHandler, type InferProps } from "void";
import { getGameProps } from "#server/puzzles";

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async () => getGameProps());
