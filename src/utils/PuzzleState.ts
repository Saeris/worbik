import { between } from "./between";
import { Grid } from "./Grid";
import { group } from "./group";
import { isUppercase } from "./isUppercase";
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
  #win = false;
  #listeners = new Set<() => void>();

  get initial(): Grid {
    return Grid.fromString(this.#history[0]);
  }

  get current(): Grid {
    return this.#grid;
  }

  get config(): { width: number; height: number } {
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
    return this.#history.length - 1;
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

  get snapshot(): string {
    return `${this.#history.join(`|`)}|${this.#hints.flat().join(``)}`;
  }

  constructor(init: string) {
    const parsed = puzzleRegex.exec(init);

    if (!parsed?.groups || !parsed.groups.chars || !parsed.groups.perRow) {
      throw new Error(`Could not parse init string! Received: ${init}`);
    }

    this.#grid = Grid.fromString(init);
    this.#history = [this.#grid.toString().toLowerCase()];
    this.#hints = group(new Array(this.#grid.size).fill(` `), this.#grid.width);
    this.#target = toInt(parsed.groups.target);
    this.validate(this.#grid.toString());
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

  #checkWin = (state: string | string[]): PuzzleState => {
    const check = (value: string): void => {
      if (
        !this.#win &&
        this.#hints
          .flat()
          .every((char, i) => char.toLowerCase() === value.charAt(i))
      ) {
        this.#win = true;
        const winningState = `${this.#grid.width}${value}`;
        // Set #current to the winning grid state
        this.#grid = Grid.fromString(winningState);
        // Discard history after the first time a winning state was achieved
        this.#history.length = this.#history.indexOf(winningState) + 1;
      }
    };

    Array.isArray(state) ? state.forEach(check) : check(state);

    return this.#update();
  };

  restore = (snapshot: string): PuzzleState => {
    const history = snapshot.split(`|`);
    const hint = history.pop();
    const current = history[history.length - 1];
    if (!hint || !current) {
      throw new Error(`Could not parse snapshot ${snapshot}`);
    }
    this.#grid = Grid.fromString(current);
    this.#history = history;
    this.#hints = group(hint.split(``), this.#grid.width);
    return this.#checkWin(this.current.flat().join(``));
  };

  getNextState = (
    rowOrCol: number,
    // true = left/down, false = right/up
    dir: `up` | `down` | `left` | `right`
  ): PuzzleState => {
    // skip if we're already in a winning state
    if (!this.#win) {
      // true = horizontal, false = vertical
      const axis = [`left`, `right`].includes(dir);
      if (
        !between(rowOrCol, 0, (axis ? this.#grid.height : this.#grid.width) - 1)
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
      this.#history.push(next.toLowerCase());

      return this.#checkWin(next.toLowerCase());
    }
    return this;
  };

  validate = (next: string | string[]): PuzzleState => {
    // skip if we're already in a winning state
    if (!this.#win) {
      const updateHints = (value: string): string => {
        const parsed = puzzleRegex.exec(value);
        if (!parsed?.groups && !parsed?.groups?.chars) {
          throw new Error(`Could not parse state string ${value}`);
        }
        const chars = parsed.groups.chars;

        this.#hints = group(
          this.#hints
            .flat()
            .map((c, i) =>
              isUppercase(c)
                ? c
                : isUppercase(chars.charAt(i))
                ? chars.charAt(i)
                : ` `
            ),
          this.#grid.width
        );

        return chars.toLowerCase();
      };

      return this.#checkWin(
        Array.isArray(next) ? next.map(updateHints) : updateHints(next)
      );
    }

    return this;
  };

  randomize = (min = 25, max = 250): PuzzleState => {
    // Generate a random number of moves between our bounds
    // Then simulate user inputs to take our initial solved
    // state to randomize it into an unsolved state
    repeat(randomInt(min, max))(() => {
      // true = horizontal / word size, false = vertical / num of words
      const dir = ([`up`, `down`, `left`, `right`] as const)[randomInt(0, 3)];
      const axis = [`left`, `right`].includes(dir);
      const limit = (axis ? this.#grid.height : this.#grid.width) - 1;
      const pos = randomInt(0, limit);
      //const pair = [pos, dir, limit, axis]; //?
      this.getNextState(pos, dir);
    });

    return this;
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
