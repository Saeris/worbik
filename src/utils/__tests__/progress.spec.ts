import { formatCountdown, getProgress } from "../progress";

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
