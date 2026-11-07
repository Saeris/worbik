// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Share, type ShareProps } from "../Share";

const puzzle = `11-07-2026_6x8`;

describe(`share`, () => {
  let root: Root;
  let container: HTMLElement;

  const open = async (props: Partial<ShareProps> = {}): Promise<void> => {
    await act(async () => {
      root.render(<Share puzzleID={puzzle} moves={12} {...props} />);
    });
    await act(async () => {
      container.querySelector(`button`)?.click();
    });
  };

  const find = (name: string): HTMLElement | undefined =>
    [...document.querySelectorAll<HTMLElement>(`button, a`)].find(
      (element) => element.textContent === name
    );

  const press = async (name: string): Promise<void> => {
    await act(async () => {
      find(name)?.click();
    });
  };

  /** What's written on the sheet, which is drawn outside of where the button is */
  const sheet = (): string => document.body.textContent;

  const card = (): URLSearchParams =>
    new URL(
      document.querySelector(`img`)?.getAttribute(`src`) ?? ``,
      location.origin
    ).searchParams;

  beforeEach(() => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    vi.stubGlobal(`matchMedia`, () => ({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {}
    }));
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = ``;
    Reflect.deleteProperty(navigator, `share`);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it(`links to the puzzle alone for a score that isn't posted`, async () => {
    await open();

    expect(sheet()).toContain(`${location.origin}/s/11-07-2026/6x8`);
    expect(card().get(`player`)).toBeNull();
  });

  it(`names the player in the link and on the card once it's posted`, async () => {
    await open({ player: `alice.test` });

    expect(sheet()).toContain(`/s/11-07-2026/6x8/alice.test`);
    expect(card().get(`player`)).toBe(`alice.test`);
  });

  it(`says what was solved, and in how many moves`, async () => {
    await open();

    expect(sheet()).toContain(`Worbik 6×8 · Nov 7 · 12 moves`);
  });

  it(`gets one move right`, async () => {
    await open({ moves: 1 });

    expect(sheet()).toContain(`· 1 move`);
  });

  it(`describes the card in words, for those who can't see it`, async () => {
    await open({ moves: 1, player: `alice.test` });

    expect(document.querySelector(`img`)?.getAttribute(`alt`)).toContain(
      `1 move on the 6×8`
    );
  });

  it(`writes the post on Bluesky, for the player to send`, async () => {
    // Worbik has no leave to write to anyone's account, so the words are handed over for them to post
    await open({ player: `alice.test` });

    const compose = new URL(
      find(`Post on Bluesky`)?.getAttribute(`href`) ?? ``
    );
    const text = compose.searchParams.get(`text`);

    expect(compose.origin).toBe(`https://bsky.app`);
    expect(text).toContain(`12 moves`);
    expect(text).toContain(`/s/11-07-2026/6x8/alice.test`);
  });

  it(`copies the link`, async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>();

    vi.stubGlobal(`navigator`, { clipboard: { writeText } });
    await open({ player: `alice.test` });
    await press(`Copy link`);

    expect(writeText.mock.calls[0][0]).toContain(`/alice.test`);
    expect(find(`Copied`)).toBeDefined();
  });

  it(`doesn't claim to have copied a link when it couldn't`, async () => {
    // The link is on show to be copied by hand, which nobody would do if told that it was done
    vi.stubGlobal(`navigator`, {
      clipboard: {
        writeText: async () => {
          throw new Error(`Not allowed`);
        }
      }
    });
    await open();
    await press(`Copy link`);

    expect(find(`Copy link`)).toBeDefined();
  });

  describe(`on a phone`, () => {
    it(`offers the device's own way of sharing`, async () => {
      const share = vi.fn<(data: ShareData) => Promise<void>>();

      vi.stubGlobal(`navigator`, { share });
      await open({ player: `alice.test` });
      await press(`Share…`);

      expect(share.mock.calls[0][0].url).toContain(`/alice.test`);
    });

    it(`closes once it has been shared`, async () => {
      vi.stubGlobal(`navigator`, { share: async () => {} });
      await open();
      await press(`Share…`);

      expect(find(`Share…`)).toBeUndefined();
    });

    it(`stays open when the player thinks better of it`, async () => {
      // Backing out of the device's sheet rejects, and leaves them wanting another way
      vi.stubGlobal(`navigator`, {
        share: async () => {
          throw new Error(`Cancelled`);
        }
      });
      await open();
      await press(`Share…`);

      expect(find(`Share…`)).toBeDefined();
    });
  });

  it(`spells out the ways of sharing on a desktop`, async () => {
    // A desktop has a sharing window too, but nobody expects one from a web page
    vi.stubGlobal(`matchMedia`, () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {}
    }));
    vi.stubGlobal(`navigator`, { share: async () => {} });
    await open();

    expect(find(`Share…`)).toBeUndefined();
  });

  describe(`for a player who has yet to sign in`, () => {
    it(`offers to post the score first`, async () => {
      const onSignIn = vi.fn<() => void>();

      await open({ onSignIn });
      await press(`Post my score`);

      expect(onSignIn).toHaveBeenCalledTimes(1);
    });

    it(`says what that would add`, async () => {
      await open({ onSignIn: () => {} });

      expect(sheet()).toContain(`Post your score to put it on the leaderboard`);
    });
  });

  it(`says why a card has no score, for a player who can't post one`, async () => {
    await open();

    expect(find(`Post my score`)).toBeUndefined();
    expect(sheet()).toContain(`only shows a score that is on the leaderboard`);
  });

  it(`says nothing of that once the score is on the card`, async () => {
    await open({ player: `alice.test` });

    expect(sheet()).not.toContain(`only shows a score`);
  });
});
