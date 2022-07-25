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
    if (chars.length % perRow !== 0) {
      throw new Error(`Chars cannot be evenly devided by ${perRow}`);
    }
    this.#width = perRow;
    this.#height = chars.length / perRow;
    this.#size = chars.length;
    this.#matrix = this.#group(chars);
  }

  static fromString(str: string): Grid {
    const parsed = /^(?<perRow>\d+)(?<chars>[a-z]+)$/i.exec(str);
    if (!parsed?.groups || !parsed.groups.chars || !parsed.groups.perRow) {
      throw new Error(`Could not parse string into a Grid!`);
    }

    const perRow = parseInt(parsed.groups.perRow, 10);

    return new Grid(parsed.groups.chars.split(``), perRow);
  }

  #group = (arr: string[]): string[][] =>
    Array.from({ length: this.#height }, () => arr.splice(0, this.#width));

  #rotateLeft = (arr: string[]): string[] => {
    if (arr.length) arr.unshift(arr.pop()!);
    return arr;
  };

  #rotateRight = (arr: string[]): string[] => {
    if (arr.length) arr.push(arr.shift()!);
    return arr;
  };

  #remapCol = (col: number, values: string[]): void => {
    this.#matrix = values.reduce((matrix, val, row) => {
      matrix[row][col] = val;
      return matrix;
    }, this.#matrix);
  };

  rotateColUp = (col: number): Grid => {
    this.#remapCol(col, this.#rotateRight(this.#matrix.map((row) => row[col])));
    return this;
  };

  rotateColDown = (col: number): Grid => {
    this.#remapCol(col, this.#rotateLeft(this.#matrix.map((row) => row[col])));
    return this;
  };

  rotateRowLeft = (row: number): Grid => {
    this.#rotateLeft(this.#matrix[row]);
    return this;
  };

  rotateRowRight = (row: number): Grid => {
    this.#rotateRight(this.#matrix[row]);
    return this;
  };

  flat = (): string[] => this.#matrix.flat();

  toString = (): string => `${this.#width}${this.flat().join(``)}`;
}

const grid = Grid.fromString(`5enemyflashinputwoodyvivid`);
grid
  .rotateRowLeft(1)
  .rotateColUp(0)
  .rotateColDown(0)
  .rotateRowRight(1)
  .toString(); //?
