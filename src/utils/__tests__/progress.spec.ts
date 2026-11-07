import { formatCountdown, getProgress, toSavedGame } from "../progress";

describe(`getProgress`, () => {
  it(`is nothing for a puzzle that hasn't been started`, () => {
    // A puzzle that was only looked at shouldn't be marked as under way
    expect(getProgress(null)).toBeNull();
    expect(getProgress(`3|bcaefd|      `)).toBeNull();
  });

  it(`counts the moves of a game that is under way`, () => {
    expect(getProgress(`3|bcaefd,abcefd|ABC   `)).toStrictEqual({
      moves: 1,
      solved: false
    });
  });

  it(`knows a game that was solved from one that wasn't`, () => {
    // The count on a solved puzzle is a result, where the same count on an unsolved one is only progress
    expect(getProgress(`3|bcaefd,abcefd,abcdef|ABCDEF`)).toStrictEqual({
      moves: 2,
      solved: true
    });
  });

  it(`is nothing for a saved game that can't be read`, () => {
    expect(getProgress(`not a saved game`)).toBeNull();
  });
});

describe(`toSavedGame`, () => {
  const game = {
    puzzle: `11-06-2026_6x5`,
    moves: 42,
    challenge: `Bcaefd`,
    solution: `abcdef`
  };

  it(`is read back as the solve that it stands for`, () => {
    // The list of the day's puzzles reads saved games, and has to show this one as any other solve
    expect(getProgress(toSavedGame(game))).toStrictEqual({
      moves: 42,
      solved: true
    });
  });

  it(`begins where the puzzle does, in the form that a saved game does`, () => {
    // A saved game that doesn't begin where the puzzle does is taken for one of another puzzle, and ignored
    expect(toSavedGame(game)).toBe(`6|bcaefd,abcdef|ABCDEF|42`);
  });
});

describe(`formatCountdown`, () => {
  it(`spells out the hours and minutes that are left`, () => {
    expect(formatCountdown((6 * 60 + 12) * 60_000)).toBe(`6 h 12 min`);
  });

  it(`leaves out the hours once there are none left`, () => {
    expect(formatCountdown(12 * 60_000)).toBe(`12 min`);
  });

  it(`never promises less time than there is`, () => {
    // Rounded up, so that "1 min" is shown until the moment the next puzzles arrive
    expect(formatCountdown(1)).toBe(`1 min`);
    expect(formatCountdown(-5000)).toBe(`0 min`);
  });
});
