import { puzzleRegex } from "../puzzleRegex";

describe(`puzzleRegex`, () => {
  it(`handles new puzzles`, () => {
    const parsed = puzzleRegex.exec(`5_react`);
    expect(parsed?.groups).toBeDefined();
    expect(parsed?.groups?.perRow).toStrictEqual(`5`);
    expect(parsed?.groups?.chars).toStrictEqual(`react`);
  });

  it(`handles new challenges`, () => {
    const parsed = puzzleRegex.exec(`5_rcaet_3`);
    expect(parsed?.groups).toBeDefined();
    expect(parsed?.groups?.perRow).toStrictEqual(`5`);
    expect(parsed?.groups?.chars).toStrictEqual(`rcaet`);
    expect(parsed?.groups?.target).toStrictEqual(`3`);
  });
});
