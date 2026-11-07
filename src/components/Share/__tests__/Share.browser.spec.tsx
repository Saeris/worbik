import { page } from "vite-plus/test/browser";
import { render } from "vitest-browser-react";
import { body, comesToRest } from "#test/game";
import { Share, type ShareProps } from "../Share";

const puzzle = `11-07-2026_6x8`;

/** Gives the device a way of sharing, which most browsers that run tests don't have */
const offerSharing = (share: (data: ShareData) => Promise<void>): void => {
  Object.defineProperty(navigator, `share`, {
    configurable: true,
    value: share
  });
  onTestFinished(() => {
    Reflect.deleteProperty(navigator, `share`);
  });
};

describe(`share`, () => {
  const sheet = page.getByRole(`dialog`);
  const sharing = page.getByRole(`button`, { name: `Share…` });

  const open = async (props: Partial<ShareProps> = {}): Promise<void> => {
    await render(<Share puzzleID={puzzle} moves={12} {...props} />);
    await page.getByRole(`button`, { name: `Share` }).click();
    await expect.element(sheet).toBeVisible();
    await comesToRest(sheet);
  };

  const says = async (words: string): Promise<void> => {
    await expect.element(body).toMatchTextContent(words);
  };

  const card = (): URLSearchParams =>
    new URL(
      document.querySelector(`img`)?.getAttribute(`src`) ?? ``,
      location.origin
    ).searchParams;

  it(`links to the puzzle alone for a score that isn't posted`, async () => {
    await open();

    await says(`${location.origin}/s/11-07-2026/6x8`);
    expect(card().get(`player`)).toBeNull();
  });

  it(`names the player in the link and on the card once it's posted`, async () => {
    await open({ player: `alice.test` });

    await says(`/s/11-07-2026/6x8/alice.test`);
    expect(card().get(`player`)).toBe(`alice.test`);
  });

  it(`says what was solved, and in how many moves`, async () => {
    await open();

    await says(`Worbik 6×8 · Nov 7 · 12 moves`);
  });

  it(`gets one move right`, async () => {
    await open({ moves: 1 });

    await says(`· 1 move`);
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
      page
        .getByRole(`link`, { name: `Post on Bluesky` })
        .element()
        .getAttribute(`href`) ?? ``
    );
    const text = compose.searchParams.get(`text`);

    expect(compose.origin).toBe(`https://bsky.app`);
    expect(text).toContain(`12 moves`);
    expect(text).toContain(`/s/11-07-2026/6x8/alice.test`);
  });

  it(`copies the link`, async () => {
    const write = vi
      .spyOn(navigator.clipboard, `writeText`)
      .mockResolvedValue();

    await open({ player: `alice.test` });
    await page.getByRole(`button`, { name: `Copy link` }).click();

    await expect
      .element(page.getByRole(`button`, { name: `Copied` }))
      .toBeVisible();
    expect(write.mock.calls[0][0]).toContain(`/alice.test`);
  });

  it(`doesn't claim to have copied a link when it couldn't`, async () => {
    // The link is on show to be copied by hand, which nobody would do if told that it was done
    const write = vi
      .spyOn(navigator.clipboard, `writeText`)
      .mockRejectedValue(new Error(`Not allowed`));

    await open();
    await page.getByRole(`button`, { name: `Copy link` }).click();

    await expect.poll(() => write.mock.calls).toHaveLength(1);
    await expect
      .element(page.getByRole(`button`, { name: `Copy link` }))
      .toBeVisible();
  });

  describe(`on a phone`, () => {
    it(`offers the device's own way of sharing`, async () => {
      const share = vi.fn<(data: ShareData) => Promise<void>>();

      offerSharing(share);
      await open({ player: `alice.test` });
      await sharing.click();

      expect(share.mock.calls[0][0].url).toContain(`/alice.test`);
    });

    it(`closes once it has been shared`, async () => {
      offerSharing(async () => {});
      await open();
      await sharing.click();

      await expect.element(sheet).not.toBeInTheDocument();
    });

    it(`stays open when the player thinks better of it`, async () => {
      // Backing out of the device's sheet rejects, and leaves them wanting another way
      const share = vi
        .fn<(data: ShareData) => Promise<void>>()
        .mockRejectedValue(new Error(`Cancelled`));

      offerSharing(share);
      await open();
      await sharing.click();

      await expect.poll(() => share.mock.calls).toHaveLength(1);
      await expect.element(sheet).toBeVisible();
    });
  });

  it(`spells out the ways of sharing on a desktop`, async () => {
    // A desktop has a sharing window too, but nobody expects one from a web page
    await page.viewport(1280, 800);
    onTestFinished(async () => {
      await page.viewport(414, 896);
    });
    offerSharing(async () => {});
    await open();

    await expect.element(sharing).not.toBeInTheDocument();
  });

  describe(`for a player who has yet to sign in`, () => {
    it(`offers to post the score first`, async () => {
      const onSignIn = vi.fn<() => void>();

      await open({ onSignIn });
      await page.getByRole(`button`, { name: `Post my score` }).click();

      expect(onSignIn).toHaveBeenCalledTimes(1);
    });

    it(`says what that would add`, async () => {
      await open({ onSignIn: () => {} });

      await says(`Post your score to put it on the leaderboard`);
    });
  });

  it(`says why a card has no score, for a player who can't post one`, async () => {
    await open();

    await says(`only shows a score that is on the leaderboard`);
    await expect
      .element(page.getByRole(`button`, { name: `Post my score` }))
      .not.toBeInTheDocument();
  });

  it(`says nothing of that once the score is on the card`, async () => {
    await open({ player: `alice.test` });

    await expect.element(body).not.toMatchTextContent(`only shows a score`);
  });
});
