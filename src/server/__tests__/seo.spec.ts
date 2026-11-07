import { getDiscordEmbed } from "../embed";
import { getGameHead, getSitemap, toInlineJSON } from "../seo";

const home = `https://worbik.test/`;

const metaOf = (head: ReturnType<typeof getGameHead>, key: string): unknown =>
  head.meta?.find((meta) => meta.name === key || meta.property === key)
    ?.content;

const canonicalOf = (head: ReturnType<typeof getGameHead>): unknown =>
  head.link?.find(({ rel }) => rel === `canonical`)?.href;

describe(`getGameHead`, () => {
  it(`gives every size of board a title of its own`, () => {
    // Pages with the same title compete with each other in search results
    expect(getGameHead(home).title).toBe(`Worbik: a daily word puzzle`);
    expect(getGameHead(`${home}7x6`, `7x6`).title).toBe(
      `Worbik 7×6: a daily word puzzle`
    );
  });

  it(`says what the game is`, () => {
    expect(metaOf(getGameHead(home), `description`)).toContain(
      `until every row is a word`
    );
  });

  it(`says that a size's page is the one to list`, () => {
    expect(canonicalOf(getGameHead(`${home}7x6`, `7x6`))).toBe(
      `https://worbik.test/7x6`
    );
  });

  it(`treats the default size as the home page`, () => {
    // They play the same puzzle, and one page shouldn't be listed as two
    expect(canonicalOf(getGameHead(`${home}5x5`, `5x5`))).toBe(home);
  });

  it(`ignores whatever else is on the address`, () => {
    // A link with tracking on the end of it is still the same page
    expect(canonicalOf(getGameHead(`${home}?from=somewhere`))).toBe(home);
  });

  it(`only describes the game as a whole on the home page`, () => {
    expect(getGameHead(home).script).toHaveLength(1);
    expect(getGameHead(`${home}7x6`, `7x6`).script).toHaveLength(0);
  });

  it(`describes the game in a form that search engines can read`, () => {
    const [{ type, innerHTML = `` }] = getGameHead(home).script ?? [];

    expect(type).toBe(`application/ld+json`);
    expect(JSON.parse(innerHTML)).toMatchObject({
      "@type": `WebApplication`,
      name: `Worbik`,
      url: `https://worbik.test`,
      isAccessibleForFree: true
    });
  });
});

describe(`getSitemap`, () => {
  const sitemap = getSitemap(`https://worbik.test`);

  it(`lists the pages that are worth listing`, () => {
    expect(sitemap).toContain(`<loc>https://worbik.test/</loc>`);
    expect(sitemap).toContain(`<loc>https://worbik.test/8x8</loc>`);
    expect(sitemap).toContain(`<loc>https://worbik.test/terms</loc>`);
  });

  it(`leaves out the copy of the home page`, () => {
    expect(sitemap).not.toContain(`/5x5</loc>`);
  });

  it(`has every size of board but that one`, () => {
    expect(sitemap.match(/<loc>/gu)).toHaveLength(1 + 15 + 2);
  });
});

describe(`toInlineJSON`, () => {
  it(`can't end the script that it's written into`, () => {
    // A handle comes from outside of Worbik, and this is written straight into the page
    const written = toInlineJSON({ title: `</script><script>alert(1)` });

    expect(written).not.toContain(`<`);
    expect(JSON.parse(written)).toStrictEqual({
      title: `</script><script>alert(1)`
    });
  });
});

describe(`getDiscordEmbed`, () => {
  const input = {
    challenge: `ajoouubidmrdoypkpiaavomcl`,
    width: 5,
    title: `@alice.test solved Worbik 5×5 in 42 moves`,
    description: `Can you beat it? Play today’s 5×5.`,
    image: `https://worbik.test/api/card?puzzle=11-19-2026_5x5&player=alice.test`,
    alt: `The puzzle's stamp, with a score of 42 moves.`,
    label: `Play today’s 5×5`,
    url: `https://worbik.test/5x5`
  };
  const { component } = getDiscordEmbed(input);
  const parts = component.components as Record<string, unknown>[];

  /** Every component in the payload, however deep */
  const flatten = (item: Record<string, unknown>): unknown[] => [
    item,
    ...((item.components ?? []) as Record<string, unknown>[]).flatMap(flatten)
  ];

  it(`has a Container at the top, as it must`, () => {
    // Discord can show no preview at all for a payload that it doesn't like
    expect(component.type).toBe(17);
  });

  it(`stays well within what Discord allows`, () => {
    // Long handles and a long address still have to fit
    const longest = getDiscordEmbed({
      ...input,
      title: `@${`a`.repeat(253)} solved Worbik 8×8 in 2000 moves`,
      image: `https://worbik.test/api/card?puzzle=11-19-2026_8x8&player=${`a`.repeat(253)}`
    });

    expect(toInlineJSON(longest).length).toBeLessThan(3000);
    expect(flatten(component).length).toBeLessThanOrEqual(40);
  });

  it(`shows the card, which carries the message`, () => {
    expect(parts[0]).toMatchObject({
      type: 12,
      items: [{ media: { url: input.image }, description: input.alt }]
    });
  });

  it(`says it in words as well`, () => {
    expect(parts[1].type).toBe(10);
    expect(parts[1].content).toContain(`42 moves`);
  });

  it(`links to the game with nothing that a link button can't have`, () => {
    // Any other key on a button invalidates the whole payload
    const [button] = parts[2].components as Record<string, unknown>[];

    expect(button).toStrictEqual({
      type: 2,
      style: 5,
      url: input.url,
      label: input.label
    });
  });

  it(`takes its color from the puzzle's stamp`, () => {
    // Everyone who shares a puzzle gets the same color, and another puzzle gets another
    expect(component.accent_color).toBeGreaterThan(0);
    expect(component.accent_color).toBeLessThanOrEqual(0xffffff);
    expect(getDiscordEmbed(input).component.accent_color).toBe(
      component.accent_color
    );
  });

  it(`keeps a name from being read as formatting`, () => {
    const { component: escaped } = getDiscordEmbed({
      ...input,
      title: `@some_one_else.test solved it`
    });
    const [, text] = escaped.components as Record<string, unknown>[];

    expect(text.content).toContain(`some\\_one\\_else`);
  });
});
