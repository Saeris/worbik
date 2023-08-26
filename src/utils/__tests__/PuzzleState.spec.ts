import { between } from "../between";
import { PuzzleState, type PuzzleStateInit } from "../PuzzleState";

describe(`puzzleState`, () => {
  it(`can be instantiated from a an init array`, () => {
    // @ts-expect-error
    expect(() => new PuzzleState([2, `abcd`])).not.toThrow();
  });

  it(`can restore state from a snapshot`, () => {
    const solution = `abcd`;
    // @ts-expect-error
    const expected = new PuzzleState([2, `cabd`]);
    expected.validate(
      PuzzleState.compare(expected.getNextState(0, `down`).toString(), solution)
    );
    expected.validate(
      PuzzleState.compare(
        expected.getNextState(0, `right`).toString(),
        solution
      )
    );
    // @ts-expect-error
    const actual = new PuzzleState([2, `cabd`]).restore([
      // @ts-expect-error
      2,
      `cabd,bacd,abcd`,
      `ABCD`
    ]);

    expect(actual.history).toStrictEqual(expected.history);
    expect(actual.toString()).toStrictEqual(expected.toString());
    expect(actual.moves).toStrictEqual(expected.moves);
    expect(actual.hints.flat().join(``)).toStrictEqual(
      expected.hints.flat().join(``)
    );
    expect(actual.win).toStrictEqual(expected.win);
  });

  it(`can generate a challenge`, () => {
    // @ts-expect-error
    const puzzle = new PuzzleState([2, `abcd`, 25]);
    // Simulate randomize increasing the move count
    puzzle.getNextState(0, `up`);
    puzzle.getNextState(0, `down`);
    const actual = puzzle.toChallenge(); //?
    const expected = [2, `ABCD`, `abcd`];
    expect(puzzle.moves).toBe(2);
    expect(puzzle.target).toBe(25);
    expect(actual).toStrictEqual(expected);
  });

  it(`throws when instantiaed with an invalid init value`, () => {
    // @ts-expect-error
    expect(() => new PuzzleState(`foo`)).toThrow(`Init value is not an array!`);
    // @ts-expect-error
    expect(() => new PuzzleState([0, ``])).toThrow(
      `Received invalid initialization array! Received: `
    );
  });

  it(`returns expected values for property getters`, () => {
    // @ts-expect-error
    const state = new PuzzleState([2, `abcd`]);
    const grid = {
      height: 2,
      matrix: [
        [`a`, `b`],
        [`c`, `d`]
      ],
      size: 4,
      width: 2
    };
    const history = [`abcd`];
    const hints = [
      [` `, ` `],
      [` `, ` `]
    ];
    const obj = {
      current: grid,
      hints,
      history,
      initial: grid,
      moves: 0,
      target: 0
    };
    expect(state.initial).toStrictEqual(expect.objectContaining(grid));
    expect(state.current).toStrictEqual(expect.objectContaining(grid));
    expect(state.history).toStrictEqual(history);
    expect(state.hints).toStrictEqual(hints);
    expect(state.moves).toBe(0);
    expect(state.target).toBe(0);
    expect(state.toString()).toBe(`abcd`);
    expect(state.toJSON()).toStrictEqual(obj);
  });

  it(`can generate new states`, () => {
    // @ts-expect-error
    const state = new PuzzleState([2, `abcd`]);
    const initial = {
      height: 2,
      matrix: [
        [`a`, `b`],
        [`c`, `d`]
      ],
      size: 4,
      width: 2
    };
    const final = {
      height: 2,
      matrix: [
        [`d`, `c`],
        [`b`, `a`]
      ],
      size: 4,
      width: 2
    };
    const history = [`abcd`, `cbad`, `cdab`, `dcab`, `dcba`];
    state
      .getNextState(0, `up`)
      .getNextState(1, `down`)
      .getNextState(0, `left`)
      .getNextState(1, `right`);
    expect(state.current).toStrictEqual(expect.objectContaining(final));
    expect(state.moves).toBe(4);
    expect(state.history).toStrictEqual(history);
    expect(state.initial).toStrictEqual(expect.objectContaining(initial));
  });

  it(`can compare two states`, () => {
    const guess = `5_rcaet69`;
    const solution = `5_react`;
    const actual = PuzzleState.compare(guess, solution);
    const expected = `5_RcAeT69`;
    expect(actual).toStrictEqual(expected);
  });

  it(`caches hints`, () => {
    const init = [5, `rcaet`] as PuzzleStateInit;
    const state = new PuzzleState(init);
    const solution = PuzzleState.compare(init[1], `react`);
    state.validate(solution);
    const expected = [[`R`, ` `, `A`, ` `, `T`]];
    expect(state.hints).toStrictEqual(expected);
  });

  it(`notifies subscribers of updates`, () => {
    // @ts-expect-error
    const state = new PuzzleState([2, `abcd`]);
    const listener = jest.fn();
    const unsubscribe = state.subscribe(listener);
    state.getNextState(0, `up`);
    state.getNextState(0, `up`);
    state.getNextState(0, `up`);
    state.getNextState(0, `up`);
    expect(listener).toHaveBeenCalledTimes(4);
    unsubscribe();
    state.getNextState(1, `down`);
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it(`can randomize it's state`, () => {
    const cases = [
      [5, `react`],
      [5, `reactgoose`],
      [5, `reactgooseteach`],
      [5, `reactgooseteachdrink`],
      [5, `reactgooseteachdrinkclear`],
      [7, `emotion`],
      [7, `emotionfreedom`],
      [7, `emotionfreedomhelpful`],
      [7, `emotionfreedomhelpfulmagical`],
      [7, `emotionfreedomhelpfulmagicalalright`],
      [7, `emotionfreedomhelpfulmagicalalrightfighter`],
      [7, `emotionfreedomhelpfulmagicalalrightfightermonster`]
    ] as PuzzleStateInit[];

    for (const val of cases) {
      const listener = jest.fn();
      const state = new PuzzleState(val);
      state.subscribe(listener);
      const result = state.randomize().toString();
      expect(result).not.toStrictEqual(val);
      expect(between(listener.mock.calls.length, 25, 250)).toBe(true);
    }
  });

  it(`can validate a winning state`, () => {
    const listener = jest.fn();
    const solution = `worbik`;
    const history = [`kworbi`, `worbik`, `kworbi`, `worbik`];
    const truncated = [`kworbi`, `worbik`];
    const state = new PuzzleState([6, `kworbi`]);
    state.subscribe(listener);
    state.getNextState(0, `left`); // win state 1
    state.getNextState(0, `right`);
    state.getNextState(0, `left`); // win state 2
    expect(state.moves).toBe(3);
    expect(state.history).toStrictEqual(history);
    state.validate(PuzzleState.compare(state.toString(), solution));
    expect(state.win).toBe(true);
    // Don't trigger another update if a winning state has been reached
    state.getNextState(0, `left`);
    state.validate(solution);
    expect(state.moves).toBe(1);
    expect(state.toString()).toBe(`worbik`);
    expect(state.history).toStrictEqual(truncated);
    expect(listener).toHaveBeenCalledTimes(3);
  });
});
