import { between } from "../between";
import { PuzzleState } from "../PuzzleState";

describe(`PuzzleState`, () => {
  it(`can be instantiated from a string`, () => {
    expect(() => new PuzzleState(`2abcd`)).not.toThrow();
  });

  it(`throws when instantiaed with an invalid string`, () => {
    expect(() => new PuzzleState(`foo`)).toThrow(
      `Could not parse init string!`
    );
  });

  it(`returns expected values for property getters`, () => {
    const state = new PuzzleState(`2abcd`);
    const grid = {
      height: 2,
      matrix: [
        [`a`, `b`],
        [`c`, `d`]
      ],
      size: 4,
      width: 2
    };
    const history = [`2abcd`];
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
    expect(state.moves).toStrictEqual(0);
    expect(state.target).toStrictEqual(0);
    expect(state.toString()).toStrictEqual(`2abcd0`);
    expect(state.toJSON()).toStrictEqual(obj);
  });

  it(`can generate new states`, () => {
    const state = new PuzzleState(`2abcd`);
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
    const history = [`2abcd`, `2cbad`, `2cdab`, `2dcab`, `2dcba`];
    state
      .getNextState(0, `up`)
      .getNextState(1, `down`)
      .getNextState(0, `left`)
      .getNextState(1, `right`);
    expect(state.current).toStrictEqual(expect.objectContaining(final));
    expect(state.moves).toStrictEqual(4);
    expect(state.history).toStrictEqual(history);
    expect(state.initial).toStrictEqual(expect.objectContaining(initial));
  });

  it(`can compare two states`, () => {
    const guess = `5rcaet69`;
    const solution = `5react`;
    const actual = PuzzleState.compare(guess, solution);
    const expected = `5RcAeT69`;
    expect(actual).toStrictEqual(expected);
  });

  it(`caches hints`, () => {
    const init = `5rcaet`;
    const state = new PuzzleState(init);
    const solution = PuzzleState.compare(init, `5react`);
    state.cacheHints(solution);
    const expected = [[`R`, ` `, `A`, ` `, `T`]];
    expect(state.hints).toStrictEqual(expected);
  });

  it(`notifies subscribers of updates`, () => {
    const state = new PuzzleState(`2abcd`);
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
      `5react`,
      `5reactgoose`,
      `5reactgooseteach`,
      `5reactgooseteachdrink`,
      `5reactgooseteachdrinkclear`,
      `7emotion`,
      `7emotionfreedom`,
      `7emotionfreedomhelpful`,
      `7emotionfreedomhelpfulmagical`,
      `7emotionfreedomhelpfulmagicalalright`,
      `7emotionfreedomhelpfulmagicalalrightfighter`,
      `7emotionfreedomhelpfulmagicalalrightfightermonster`
    ];

    for (const val of cases) {
      const listener = jest.fn();
      const state = new PuzzleState(val);
      state.subscribe(listener);
      const result = state.randomize().toString();
      expect(result).not.toStrictEqual(val);
      expect(between(listener.mock.calls.length, 25, 250)).toStrictEqual(true);
    }
  });

  it(`can validate a winning state`, () => {
    const solution = `6worbik`;
    const state = new PuzzleState(solution);
    state.cacheHints(PuzzleState.compare(state.toString(), solution));
    expect(state.win).toStrictEqual(true);
  });
});
