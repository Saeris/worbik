import { normalizeHandle } from "../handle";

describe(`normalizeHandle`, () => {
  it(`accepts a handle however it was typed or pasted`, () => {
    // People copy their handle from a profile, where it has an @, and phones capitalize and pad what is typed
    expect(normalizeHandle(`@Name.Example.com `)).toBe(`name.example.com`);
    expect(normalizeHandle(`  name.example.com`)).toBe(`name.example.com`);
  });

  it(`leaves a handle that is already tidy as it is`, () => {
    expect(normalizeHandle(`name.example.com`)).toBe(`name.example.com`);
  });
});
