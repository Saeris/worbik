import { serviceDid } from "../service";

describe(`serviceDid`, () => {
  it(`is the did:web of where the game is served from`, () => {
    expect(serviceDid(`https://worbik.saeris.gg`)).toBe(
      `did:web:worbik.saeris.gg`
    );
    expect(serviceDid(`https://worbik.saeris.gg/api/scores`)).toBe(
      `did:web:worbik.saeris.gg`
    );
  });

  it(`names the port of a development server as localhost's`, () => {
    // A did:web may only carry a port for localhost, and a player's server refuses to vouch for any other
    expect(serviceDid(`http://127.0.0.1:5173`)).toBe(
      `did:web:localhost%3A5173`
    );
    expect(serviceDid(`http://localhost:5173`)).toBe(
      `did:web:localhost%3A5173`
    );
  });
});
