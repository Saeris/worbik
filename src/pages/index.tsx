import { Game } from "#components/Game";
import type { Props } from "./index.server";

// Keyed so that switching between puzzles starts from a clean slate, rather than carrying over the last game's state
const Page: React.FC<Props> = (props) => (
  <Game key={props.puzzleID} {...props} />
);

export default Page;
