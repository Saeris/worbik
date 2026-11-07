import { getPuzzle } from "../puzzles";
import { getScore } from "../scores";
import { getCardURL, getShare, getShareHead } from "../share";

vi.mock(`../puzzles`, () => ({ getPuzzle: vi.fn<typeof getPuzzle>() }));
vi.mock(`../scores`, () => ({ getScore: vi.fn<typeof getScore>() }));

const puzzle = `11-19-2026_5x5`;
const link = `https://worbik.test/s/11-19-2026/5x5/alice.test`;

/** Finds what a link says about itself under the given name */
const metaOf = (head: ReturnType<typeof getShareHead>, key: string): unknown =>
  head.meta?.find(
    (meta) =>
      (`property` in meta && meta.property === key) ||
      (`name` in meta && meta.name === key)
  )?.content;

describe(`getShare`, () => {
  beforeEach(() => {
    vi.mocked(getPuzzle).mockResolvedValue([37, `Ajoouubidm`, `solution..`]);
    vi.mocked(getScore).mockResolvedValue({
      did: `did:plc:alice`,
      handle: `alice.test`,
      moves: 42,
      createdAt: new Date()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it(`describes the puzzle that a link is to`, async () => {
    await expect(getShare(puzzle)).resolves.toStrictEqual({
      puzzle,
      size: `5×5`,
      day: `Thu, Nov 19`,
      challenge: `Ajoouubidm`,
      score: null
    });
  });

  it(`never includes anything of the puzzle's solution`, async () => {
    // What is shared is seen by people who have yet to play, on the same day that the puzzle is being played
    const share = await getShare(puzzle, `alice.test`);

    expect(JSON.stringify(share)).not.toContain(`solution`);
    // Nor the target, which is kept from players until they have solved the puzzle
    expect(JSON.stringify(share)).not.toContain(`37`);
  });

  it(`shows the score that the player posted, under the name that the leaderboard has for them`, async () => {
    await expect(getShare(puzzle, `alice.test`)).resolves.toMatchObject({
      score: { moves: 42, player: `@alice.test` }
    });
    expect(getScore).toHaveBeenCalledExactlyOnceWith(puzzle, `alice.test`);
  });

  it(`names a player who has no confirmed handle by their identity`, async () => {
    vi.mocked(getScore).mockResolvedValue({
      did: `did:plc:alice`,
      handle: null,
      moves: 42,
      createdAt: new Date()
    });

    await expect(getShare(puzzle, `did:plc:alice`)).resolves.toMatchObject({
      score: { player: `did:plc:alice` }
    });
  });

  it(`shows no score for a player who hasn't posted one`, async () => {
    // Anyone can write a link that names anyone, so a link is never taken at its word
    vi.mocked(getScore).mockResolvedValue(null);

    await expect(getShare(puzzle, `mallory.test`)).resolves.toMatchObject({
      score: null
    });
  });

  it(`is nothing for a puzzle that there hasn't been`, async () => {
    vi.mocked(getPuzzle).mockResolvedValue(null);

    await expect(getShare(`01-01-2020_5x5`, `alice.test`)).resolves.toBeNull();
    // There is no score to look for on a puzzle that doesn't exist
    expect(getScore).not.toHaveBeenCalled();
  });
});

describe(`getShareHead`, () => {
  const share = {
    puzzle,
    size: `5×5`,
    day: `Thu, Nov 19`,
    challenge: `ajoouubidm`,
    score: null
  };
  const scored = { ...share, score: { moves: 42, player: `@alice.test` } };

  it(`says in words what the picture shows`, () => {
    // Some apps show a link's words and not its picture, and some people can't see the picture
    const head = getShareHead(link, scored, `alice.test`);

    expect(head.title).toBe(`@alice.test solved Worbik 5×5 in 42 moves`);
    expect(metaOf(head, `og:title`)).toBe(head.title);
    expect(metaOf(head, `og:description`)).toBe(
      `Can you beat it? Play today’s 5×5.`
    );
  });

  it(`invites a solve when there is no score to beat`, () => {
    const head = getShareHead(link, share);

    expect(head.title).toBe(`Worbik 5×5 · Thu, Nov 19`);
    expect(metaOf(head, `og:description`)).toBe(
      `Can you solve it? Play today’s 5×5.`
    );
  });

  it(`gets one move right`, () => {
    const one = { ...share, score: { moves: 1, player: `@alice.test` } };

    expect(getShareHead(link, one, `alice.test`).title).toBe(
      `@alice.test solved Worbik 5×5 in 1 move`
    );
  });

  it(`points to a picture at a full address`, () => {
    // The apps that show the picture fetch it from elsewhere, where an address relative to this page means nothing
    expect(metaOf(getShareHead(link, scored, `alice.test`), `og:image`)).toBe(
      `https://worbik.test/api/card?puzzle=11-19-2026_5x5&player=alice.test`
    );
  });

  it(`points to the puzzle's own picture when the player named has no score`, () => {
    // That picture is the same for everyone, so it can be kept by whoever fetches it
    expect(metaOf(getShareHead(link, share, `mallory.test`), `og:image`)).toBe(
      `https://worbik.test/api/card?puzzle=11-19-2026_5x5`
    );
  });

  it(`leaves a link to no puzzle with what every page says about itself`, () => {
    expect(getShareHead(link, null)).toStrictEqual({});
  });
});

describe(`getCardURL`, () => {
  it(`keeps a player's name intact in the address`, () => {
    // An identity has colons in it, which mean something else in an address unless they are escaped
    expect(getCardURL(`https://worbik.test`, puzzle, `did:plc:alice`)).toBe(
      `https://worbik.test/api/card?puzzle=11-19-2026_5x5&player=did%3Aplc%3Aalice`
    );
  });
});
