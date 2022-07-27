import { Grid } from "./Grid";
import { group } from "./group";
import { puzzleRegex } from "./puzzleRegex";
import { randomInt } from "./randomInt";
import { repeat } from "./repeat";
import { toInt } from "./toInt";

export class PuzzleState {
  #initialized = false;
  #grid: Grid;
  #history: string[];
  #hints: string[][];
  #target: number;
  #listeners = new Set<() => void>();

  get initial(): Grid {
    return Grid.fromString(this.#history[0]);
  }

  get current(): Grid {
    return this.#grid;
  }

  get history(): string[] {
    return this.#history;
  }

  get moves(): number {
    // exclude the initial state to get # of moves
    return this.#history.length - 1;
  }

  get hints(): string[][] {
    return this.#hints;
  }

  get target(): number {
    return this.#target;
  }

  constructor(init: string) {
    const parsed = puzzleRegex.exec(init);

    if (!parsed?.groups || !parsed.groups.chars || !parsed.groups.perRow) {
      throw new Error(`Could not parse init string!`);
    }

    this.#grid = Grid.fromString(init);
    this.#history = [this.#grid.toString()];
    this.#hints = group(new Array(this.#grid.size).fill(` `), this.#grid.width);
    this.#target = toInt(parsed.groups.target);
    this.cacheHints(this.#grid.toString());
    this.#initialized = true;
  }

  static compare = (guess: string, solution: string): string =>
    guess
      .toLowerCase()
      .split(``)
      .map((c, i) => (solution.charAt(i) === c ? c.toUpperCase() : c))
      .join(``);

  #update = (): PuzzleState => {
    if (this.#initialized) this.#listeners.forEach((l) => l());
    return this;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      // unsubscribe
      this.#listeners.delete(listener);
    };
  };

  getNextState = (
    rowOrCol: number,
    // true = left/down, false = right/up
    dir: `up` | `down` | `left` | `right`
  ): PuzzleState => {
    // true = horizontal, false = vertical
    const axis = [`left`, `right`].includes(dir);
    if (
      rowOrCol < 0 ||
      rowOrCol > (axis ? this.#grid.width : this.#grid.height) - 1
    ) {
      throw new Error(
        `${axis ? `Row` : `Column`} value ${rowOrCol} is invalid!`
      );
    }
    switch (dir) {
      case `left`:
        this.#grid.rotateRowLeft(rowOrCol);
        break;
      case `right`:
        this.#grid.rotateRowRight(rowOrCol);
        break;
      case `down`:
        this.#grid.rotateColDown(rowOrCol);
        break;
      default:
        this.#grid.rotateColUp(rowOrCol);
    }
    const next = this.#grid.toString();
    this.#history.push(next);

    return this.#update();
  };

  cacheHints = (next: string): PuzzleState => {
    const parsed = puzzleRegex.exec(next);
    if (!parsed?.groups && !parsed?.groups?.chars) {
      throw new Error(`Could not parse state string ${next}`);
    }
    const chars = parsed.groups.chars;
    const isUppercase = (str: string): boolean => /^[A-Z]*$/.test(str);
    const hints = this.#hints
      .flat()
      .map((c, i) =>
        isUppercase(c)
          ? c
          : isUppercase(chars.charAt(i))
          ? chars.charAt(i)
          : ` `
      );
    this.#hints = group(hints, this.#grid.width);

    return this.#update();
  };

  randomize = (min = 25, max = 250): PuzzleState => {
    // Generate a random number of moves between our bounds
    const moves = randomInt(min, max); //?
    // Then simulate user inputs to take our initial solved
    // state to randomize it into an unsolved state
    repeat(moves)(() => {
      // true = horizontal / word size, false = vertical / num of words
      const dir = ([`up`, `down`, `left`, `right`] as const)[randomInt(0, 4)];
      const axis = [`left`, `right`].includes(dir);
      const pos = randomInt(
        0,
        (axis ? this.#grid.width : this.#grid.height) - 1
      );
      this.getNextState(pos, dir);
    });

    return this.#update();
  };

  toString = (): string => `${String(this.current)}${this.moves}`;

  toJSON = (): {
    current: ReturnType<Grid["toJSON"]>;
    hints: string[][];
    history: string[];
    initial: ReturnType<Grid["toJSON"]>;
    moves: number;
    target: number;
  } => ({
    current: this.current.toJSON(),
    hints: this.#hints,
    history: this.#history,
    initial: this.initial.toJSON(),
    moves: this.moves,
    target: this.#target
  });
}

/**
const solution = `7expulsevacancyflattenvirtualforsakevariousgoddess`;
const puzzle = new PuzzleState(solution).randomize();
const hints = PuzzleState.compare(puzzle.toString(), solution); //?
puzzle.cacheHints(hints);
puzzle.hints; //?
puzzle.history; //?
puzzle
  .getNextState(3, `up`)
  .getNextState(4, `left`)
  .getNextState(3, `right`)
  .getNextState(2, `down`)
  .toString(); //?
 */
