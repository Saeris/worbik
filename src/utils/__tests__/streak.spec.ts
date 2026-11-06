import { getStreaks, toDayNumber } from "../streak";

describe(`toDayNumber`, () => {
  it(`numbers days that follow one another one apart`, () => {
    expect(toDayNumber(`11-06-2026`) - toDayNumber(`11-05-2026`)).toBe(1);
  });

  it(`carries on across the ends of months and years`, () => {
    // A streak mustn't be broken by the calendar turning over
    expect(toDayNumber(`03-01-2026`) - toDayNumber(`02-28-2026`)).toBe(1);
    expect(toDayNumber(`03-01-2028`) - toDayNumber(`02-28-2028`)).toBe(2);
    expect(toDayNumber(`01-01-2027`) - toDayNumber(`12-31-2026`)).toBe(1);
  });
});

describe(`getStreaks`, () => {
  const today = `11-06-2026`;

  it(`has no streak for someone who hasn't played`, () => {
    expect(getStreaks([], today)).toStrictEqual({ current: 0, best: 0 });
  });

  it(`counts the days in a row that lead up to today`, () => {
    expect(
      getStreaks([`11-04-2026`, `11-05-2026`, `11-06-2026`], today)
    ).toStrictEqual({ current: 3, best: 3 });
  });

  it(`keeps a streak going through a day that isn't over yet`, () => {
    // Opening the game in the morning shouldn't show a streak as lost before there has been a chance to keep it
    expect(getStreaks([`11-04-2026`, `11-05-2026`], today)).toStrictEqual({
      current: 2,
      best: 2
    });
  });

  it(`ends a streak once a whole day is missed`, () => {
    expect(getStreaks([`11-03-2026`, `11-04-2026`], today)).toStrictEqual({
      current: 0,
      best: 2
    });
  });

  it(`starts again after a gap, and remembers the best run`, () => {
    expect(
      getStreaks(
        [`10-28-2026`, `10-29-2026`, `10-30-2026`, `10-31-2026`, `11-06-2026`],
        today
      )
    ).toStrictEqual({ current: 1, best: 4 });
  });

  it(`counts a day once, however many of its puzzles were solved`, () => {
    // The first solve of a day is what keeps a streak, and the rest of that day's add nothing to it
    expect(
      getStreaks(
        [`11-05-2026`, `11-05-2026`, `11-06-2026`, `11-06-2026`],
        today
      )
    ).toStrictEqual({ current: 2, best: 2 });
  });

  it(`doesn't mind what order the days come in`, () => {
    expect(
      getStreaks([`11-06-2026`, `11-04-2026`, `11-05-2026`], today)
    ).toStrictEqual({ current: 3, best: 3 });
  });
});
