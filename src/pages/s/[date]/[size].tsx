import { Game } from "#components/Game";
import type { Props } from "./[size].server";

// Keyed so that switching between puzzles starts from a clean slate, rather than carrying over the last game's state
const Page: React.FC<Props> = ({ puzzleID, init }) => (
  <Game key={puzzleID} puzzleID={puzzleID} init={init} />
);

export default Page;
