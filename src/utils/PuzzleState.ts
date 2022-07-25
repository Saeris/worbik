import { Grid } from "./Grid";
import { randomInt } from "./randomInt";
import { repeat } from "./repeat";

export class PuzzleState {
  #grid: Grid;
  #history: string[];
  #hints: string[][];

  get initial(): Grid {
    return Grid.fromString(this.#history[0]);
  }

  get current(): Grid {
    return this.#grid;
  }

  get moves(): number {
    // exclude the initial state to get # of moves
    return this.#history.length - 1;
  }

  get hints(): string[][] {
    return this.#hints;
  }

  constructor(init: string) {
    this.#grid = Grid.fromString(init);
    this.#history = [this.#grid.toString()];
    this.#hints = Array.from({ length: this.#grid.height }, () =>
      new Array(this.#grid.width).fill(` `)
    );
    this.cacheHints(this.#grid.toString());
  }

  static parse = (
    state: string
  ): {
    grid: Grid;
    moves: number;
  } => {
    const parsed = /^(?<length>\d+)(?<challenge>[a-z]+)(?<moves>\d+)$/i.exec(
      state
    );
    if (
      !parsed?.groups ||
      !parsed.groups.challenge ||
      !parsed.groups.length ||
      !parsed.groups.moves
    ) {
      throw new Error(`Could not parse state string!`);
    }

    const puzzle = new this(
      `${parsed.groups.length}${parsed.groups.challenge}`
    );

    return {
      grid: puzzle.current,
      moves: parseInt(parsed.groups.moves, 10)
    };
  };

  static compare = (guess: Grid, solution: string): string =>
    String(guess)
      .toLowerCase()
      .split(``)
      .map((c, i) => (solution.charAt(i) === c ? c.toUpperCase() : c))
      .join(``);

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
    return this;
  };

  cacheHints = (prev: string, next: string = prev): PuzzleState => {
    const isUppercase = (str: string): boolean => /^[A-Z]*$/.test(str);
    const hints = prev
      .split(``)
      .map((c, i) =>
        isUppercase(c) ? c : isUppercase(next.charAt(i)) ? next.charAt(i) : ` `
      );
    this.#hints = Array.from({ length: this.#hints.length }, () =>
      hints.splice(0, this.#hints[0].length)
    );
    return this;
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

    return this;
  };

  toString = (): string => `${String(this.current)}${this.moves}`;

  toJSON = (): [initial: string, current: string] => [
    String(this.initial),
    this.toString()
  ];
}

const puzzle = new PuzzleState(
  `7nAeerilzrGtauaiznujntdngwuyzzEpeflleiAeucEkhaabrE`
).randomize();
PuzzleState.compare(
  PuzzleState.parse(puzzle.toString()).grid,
  String(puzzle.initial)
); //?
puzzle.hints; //?
puzzle
  .getNextState(3, `up`)
  .getNextState(4, `left`)
  .getNextState(3, `right`)
  .getNextState(2, `down`)
  .toString(); //?
