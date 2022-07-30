import { group } from "./group";
import { puzzleRegex } from "./puzzleRegex";

export class Grid {
  #matrix: string[][];
  #width: number;
  #height: number;
  #size: number;

  get matrix(): string[][] {
    return this.#matrix;
  }

  get width(): number {
    return this.#width;
  }

  get height(): number {
    return this.#height;
  }

  get size(): number {
    return this.#size;
  }

  constructor(chars: string[], perRow: number) {
    this.#matrix = group(chars.slice(), perRow);
    this.#width = perRow;
    this.#height = chars.length / perRow;
    this.#size = chars.length;
  }

  static fromString(str: string): Grid {
    const parsed = puzzleRegex.exec(str);
    if (!parsed?.groups || !parsed.groups.chars || !parsed.groups.perRow) {
      throw new Error(`Could not parse string into a Grid! Received: ${str}`);
    }

    const perRow = parseInt(parsed.groups.perRow, 10);

    return new Grid(parsed.groups.chars.split(``), perRow);
  }

  #rotateLeft = (arr: string[]): string[] => {
    if (arr.length) arr.push(arr.shift()!);
    return arr;
  };

  #rotateRight = (arr: string[]): string[] => {
    if (arr.length) arr.unshift(arr.pop()!);
    return arr;
  };

  #remapRow = (row: number, values: string[]): void => {
    this.#matrix = values.reduce((matrix, val, col) => {
      matrix[row][col] = val;
      return matrix;
    }, this.#matrix);
  };

  #remapCol = (col: number, values: string[]): void => {
    this.#matrix = values.reduce((matrix, val, row) => {
      matrix[row][col] = val;
      return matrix;
    }, this.#matrix);
  };

  rotateColUp = (col: number): Grid => {
    this.#remapCol(col, this.#rotateLeft(this.#matrix.map((row) => row[col])));
    return this;
  };

  rotateColDown = (col: number): Grid => {
    this.#remapCol(col, this.#rotateRight(this.#matrix.map((row) => row[col])));
    return this;
  };

  rotateRowLeft = (row: number): Grid => {
    this.#remapRow(row, this.#rotateLeft(this.#matrix[row].slice(0)));
    return this;
  };

  rotateRowRight = (row: number): Grid => {
    this.#remapRow(row, this.#rotateRight(this.#matrix[row].slice(0)));
    return this;
  };

  flat = (): string[] => this.#matrix.flat();

  toString = (): string => `${this.#width}${this.flat().join(``)}`;

  toJSON = (): {
    matrix: string[][];
    width: number;
    height: number;
    size: number;
  } => ({
    matrix: this.#matrix,
    width: this.#width,
    height: this.#height,
    size: this.#size
  });
}
