import {
  between,
  group,
  isUppercase,
  randomInt,
  repeat,
  type Random,
  type Size
} from "../utils";
import { Grid } from "./Grid";

export type PuzzleStateInit = [perRow: Size, chars: string, target?: number];

export type Challenge = [target: number, challenge: string, solution: string];

export type Snapshot = [
  width: Size,
  historyString: string,
  hint: string,
  /** How many moves the game took, for one that was played on another device and whose moves aren't known. It's a string when read back from storage. */
  moves?: number | string
];

export class PuzzleState {
  #initialized = false;
  #grid: Grid;
  #history: string[];
  #hints: string[][];
  #target: number;
  #win = false;
  #reportedMoves: number | null = null;
  #listeners = new Set<() => void>();

  get initial(): Grid {
    return new Grid(this.#history[0], this.#grid.width);
  }

  get current(): Grid {
    return this.#grid;
  }

  get config(): { width: Size; height: Size } {
    return {
      width: this.#grid.width,
      height: this.#grid.height
    };
  }

  get history(): string[] {
    return this.#history;
  }

  get moves(): number {
    // exclude the initial state to get # of moves
    return this.#reportedMoves ?? this.#history.length - 1;
  }

  get hints(): string[][] {
    return this.#hints;
  }

  get target(): number {
    return this.#target;
  }

  get win(): boolean {
    return this.#win;
  }

  get snapshot(): Snapshot {
    const history = this.#history.join(`,`);
    const hints = this.#hints.flat().join(``);

    return this.#reportedMoves === null
      ? [this.#grid.width, history, hints]
      : [this.#grid.width, history, hints, this.#reportedMoves];
  }

  constructor(init: PuzzleStateInit) {
    if (!Array.isArray(init)) {
      throw new Error(`Init value is not an array!`);
    }

    const [perRow, chars, target = 0] = init;

    if (typeof perRow !== `number` || !chars) {
      throw new Error(
        `Received invalid initialization array! Received: ${perRow} ${chars}`
      );
    }

    this.#grid = new Grid(chars, perRow);
    this.#history = [this.#grid.toString().toLowerCase()];
    this.#hints = group(new Array(chars.length).fill(` `), perRow);
    this.#target = target;
    this.validate(this.#grid.toString());
    this.#initialized = true;
  }

  static compare = (guess: string, solution: string): string =>
    guess
      .toLowerCase()
      .split(``)
      .map((c, i) => (solution.charAt(i) === c ? c.toUpperCase() : c))
      .join(``);

  #update = (): this => {
    if (this.#initialized) {
      this.#listeners.forEach((l) => {
        l();
      });
    }
    return this;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      // unsubscribe
      this.#listeners.delete(listener);
    };
  };

  #updateHints = (chars: string): string => {
    if (!chars.length) {
      throw new Error(`Could not parse state string ${chars}`);
    }

    this.#hints = group(
      this.#hints
        .flat()
        .map((char, idx) =>
          isUppercase(char)
            ? char
            : isUppercase(chars.charAt(idx))
              ? chars.charAt(idx)
              : ` `
        ),
      this.#grid.width
    );

    return chars.toLowerCase();
  };

  #check = (value: string): void => {
    if (
      !this.#win &&
      this.#hints
        .flat()
        .every((char, i) => char.toLowerCase() === value.charAt(i))
    ) {
      this.#win = true;
      const winningState = value;
      // Set #current to the winning grid state
      this.#grid = new Grid(winningState, this.#grid.width);
      // Discard history after the first time a winning state was achieved
      this.#history.length = this.#history.indexOf(winningState) + 1;
      this.#update();
    }
  };

  #checkWin = (state: string[] | string): this => {
    if (this.#win) return this;

    Array.isArray(state) ? state.forEach(this.#check) : this.#check(state);

    return this.#update();
  };

  restore = ([width, historyString, hint, moves]: Snapshot): this => {
    const history = historyString.split(`,`); //?
    const current = history.at(-1); //?
    if (!hint || !current) {
      throw new Error(`Could not parse snapshot!`);
    }
    this.#grid = new Grid(current, width);
    this.#history = history;
    this.#hints = group(hint.split(``), width);
    this.#reportedMoves = Number(moves) || null;
    this.#checkWin(this.current.flat().join(``));
    // A game that was already won is left alone by that check, but may have just been replaced
    return this.#update();
  };

  getNextState = (
    rowOrCol: number,
    // true = left/down, false = right/up
    dir: `down` | `left` | `right` | `up`
  ): this => {
    // skip if we're already in a winning state
    if (this.#win) return this;
    // true = horizontal, false = vertical
    const axis = [`left`, `right`].includes(dir);

    if (
      !between(rowOrCol, 0, (axis ? this.#grid.height : this.#grid.width) - 1)
    ) {
      throw new Error(
        `${axis ? `Row` : `Column`} value ${rowOrCol} is invalid!`
      );
    }

    const moves = {
      left: this.#grid.rotateRowLeft,
      right: this.#grid.rotateRowRight,
      up: this.#grid.rotateColUp,
      down: this.#grid.rotateColDown
    };

    const next = moves[dir](rowOrCol).toString();

    this.#history.push(next.toLowerCase());

    return this.#checkWin(next.toLowerCase());
  };

  getHintAt = (x: number, y: number): string => this.#hints[x][y];

  isRowCorrect = (row: number): boolean =>
    this.#grid.matrix[row].join(``).toUpperCase() === this.#hints[row].join(``);

  validate = (next: string[] | string): this =>
    // skip if we're already in a winning state
    this.#win
      ? this
      : this.#checkWin(
          Array.isArray(next)
            ? next.map(this.#updateHints)
            : this.#updateHints(next)
        );

  randomize = (min = 25, max = 250, random?: Random): this => {
    // Generate a random number of moves between our bounds
    // Then simulate user inputs to take our initial solved
    // state to randomize it into an unsolved state
    repeat(randomInt(min, max, random))(() => {
      // true = horizontal / word size, false = vertical / num of words
      const dir = ([`up`, `down`, `left`, `right`] as const)[
        randomInt(0, 3, random)
      ];
      const axis = [`left`, `right`].includes(dir);
      const limit = (axis ? this.#grid.height : this.#grid.width) - 1;
      const pos = randomInt(0, limit, random);
      //const pair = [pos, dir, limit, axis]; //?
      this.getNextState(pos, dir);
    });

    return this;
  };

  toChallenge = (): Challenge => [
    this.moves,
    PuzzleState.compare(String(this.current), String(this.initial)),
    this.initial.toString()
  ];

  toString = (): string => String(this.current);

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
