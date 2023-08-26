import { group } from "./group.ts";
import type { Size } from "./sizes.ts";

export class Grid {
  #matrix: string[][];
  #width: Size;
  #height: Size;
  #size: number;

  get matrix(): string[][] {
    return this.#matrix;
  }

  get width(): Size {
    return this.#width;
  }

  get height(): Size {
    return this.#height;
  }

  get size(): number {
    return this.#size;
  }

  constructor(chars: string, perRow: Size) {
    this.#matrix = group(chars.split(``), perRow);
    this.#width = perRow;
    this.#height = (chars.length / perRow) as Size;
    this.#size = chars.length;
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

  rotateColUp = (col: number): this => {
    this.#remapCol(col, this.#rotateLeft(this.#matrix.map((row) => row[col])));
    return this;
  };

  rotateColDown = (col: number): this => {
    this.#remapCol(col, this.#rotateRight(this.#matrix.map((row) => row[col])));
    return this;
  };

  rotateRowLeft = (row: number): this => {
    this.#remapRow(row, this.#rotateLeft(this.#matrix[row].slice(0)));
    return this;
  };

  rotateRowRight = (row: number): this => {
    this.#remapRow(row, this.#rotateRight(this.#matrix[row].slice(0)));
    return this;
  };

  flat = (): string[] => this.#matrix.flat();

  toString = (): string => this.flat().join(``);

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
