import { defineHandler, defineHead, type InferProps } from "void";
import { getGameProps } from "#server/puzzles";
import { getGameHead } from "#server/seo";

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async () => getGameProps());

export const head = defineHead<Props>((c) => getGameHead(c.req.url));
