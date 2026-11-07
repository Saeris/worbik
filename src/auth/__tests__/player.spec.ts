// @vitest-environment happy-dom
import {
  getPlayer,
  setPlayer,
  subscribeToPlayer,
  type Player
} from "../player";

const alice: Player = { did: `did:plc:alice`, handle: `alice.example.com` };

describe(`the player who is signed in`, () => {
  afterEach(() => {
    setPlayer(null);
    localStorage.clear();
  });

  it(`is nobody until someone signs in`, () => {
    expect(getPlayer()).toBeNull();
  });

  it(`is remembered once they have signed in`, () => {
    setPlayer(alice);

    expect(getPlayer()).toStrictEqual(alice);
    // Kept in storage, so that they are still signed in the next time they visit
    expect(localStorage.getItem(`worbik:player`)).toContain(alice.did);
  });

  it(`is forgotten when they sign out`, () => {
    setPlayer(alice);
    setPlayer(null);

    expect(getPlayer()).toBeNull();
    expect(localStorage.getItem(`worbik:player`)).toBeNull();
  });

  it(`is the same object for as long as nothing changes`, () => {
    // React reads this on every render, and would render forever if it were given a new object each time
    setPlayer(alice);

    expect(getPlayer()).toBe(getPlayer());
  });

  it(`is nobody when what is stored isn't a player`, () => {
    // Storage can be edited by hand or left behind by an older version, and must never break the game
    localStorage.setItem(`worbik:player`, `{"did":"not a did"}`);
    expect(getPlayer()).toBeNull();

    localStorage.setItem(`worbik:player`, `not even JSON`);
    expect(getPlayer()).toBeNull();
  });

  it(`tells whoever is listening when someone signs in or out`, () => {
    const listener = vi.fn<() => void>();
    const unsubscribe = subscribeToPlayer(listener);

    setPlayer(alice);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    setPlayer(null);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
