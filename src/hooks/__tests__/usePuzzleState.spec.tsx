// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { fetch } from "void/client";
import type { PuzzleStateInit } from "../../state";
import { usePuzzle } from "../usePuzzleState";

vi.mock(`void/client`, () => ({ fetch: vi.fn<() => Promise<string[]>>() }));

const check = vi.mocked(fetch as unknown as () => Promise<string[]>);

/**
 * A 3×2 puzzle whose solution is `abc` over `def`, in which no letter
 * starts out in its correct position. Rotating the first row to the
 * right puts all three of its letters where they belong.
 */
const init: PuzzleStateInit = [3 as PuzzleStateInit[0], `bcaefd`, 2];

let puzzle: ReturnType<typeof usePuzzle>;

/** Renders the hints of every tile, the way that the board does */
const Board: React.FC = () => {
  // oxlint-disable-next-line react/globals -- hands the hook's result to the tests, which then drive it
  puzzle = usePuzzle(`03-02-2026_3x2`, init, false);

  return (
    <output>
      {[0, 1]
        .map((x) => [0, 1, 2].map((y) => puzzle.getHintAt(x, y)).join(``))
        .join(`|`)}
    </output>
  );
};

describe(`usePuzzle`, () => {
  let root: Root;
  let container: HTMLElement;

  beforeEach(async () => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    vi.spyOn(console, `error`).mockImplementation(() => {});
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
    await act(async () => {
      root.render(<Board />);
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    check.mockReset();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it(`reveals a hint as soon as the server confirms it`, async () => {
    // A hint that only shows up after the next move tricks players into moving a letter that was already in place
    check.mockResolvedValue([`ABCefd`]);

    expect(container.textContent).toBe(`   |   `);

    await act(async () => {
      puzzle.rotate(0, `right`);
    });

    expect(container.textContent).toBe(`ABC|   `);
    expect(puzzle.isRowCorrect(0)).toBe(true);
    expect(puzzle.moves).toBe(1);
  });

  it(`checks a move right away, rather than waiting to see if more follow`, async () => {
    // Any delay before checking is time in which a player can't tell that a letter is already in place
    // A response from the server that is settled at a moment of the test's choosing
    const response = Promise.withResolvers<string[]>();
    check.mockReturnValue(response.promise);

    await act(async () => {
      puzzle.rotate(0, `right`);
    });

    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenLastCalledWith(`/api/check`, {
      query: { puzzle: `03-02-2026_3x2`, guesses: `abcefd` }
    });

    await act(async () => {
      response.resolve([`ABCefd`]);
    });
  });

  it(`checks the moves made while waiting on the server together`, async () => {
    // One request per burst of moves keeps the game within the limits of what it's hosted on
    const first = Promise.withResolvers<string[]>();
    check.mockReturnValueOnce(first.promise).mockResolvedValue([]);

    await act(async () => {
      puzzle.rotate(0, `right`);
      puzzle.rotate(1, `left`);
      puzzle.rotate(1, `left`);
    });

    expect(check).toHaveBeenCalledTimes(1);

    await act(async () => {
      first.resolve([`ABCefd`]);
    });

    expect(check).toHaveBeenCalledTimes(2);
    expect(check).toHaveBeenLastCalledWith(`/api/check`, {
      query: { puzzle: `03-02-2026_3x2`, guesses: `abcfde,abcdef` }
    });
  });

  it(`checks a move again with the next one when the server couldn't be reached`, async () => {
    // A letter that landed in place while offline must still be revealed once back online
    check
      .mockRejectedValueOnce(new Error(`Failed to fetch`))
      .mockResolvedValue([`ABCefd`, `ABCfde`]);

    await act(async () => {
      puzzle.rotate(0, `right`);
    });

    expect(container.textContent).toBe(`   |   `);

    await act(async () => {
      puzzle.rotate(1, `left`);
    });

    expect(check).toHaveBeenLastCalledWith(`/api/check`, {
      query: { puzzle: `03-02-2026_3x2`, guesses: `abcefd,abcfde` }
    });
    expect(container.textContent).toBe(`ABC|   `);
  });
});

describe(`restoring a saved game`, () => {
  let root: Root;
  let container: HTMLElement;

  /** The same board, but one that keeps its game on the device */
  const Saved: React.FC = () => {
    // oxlint-disable-next-line react/globals -- hands the hook's result to the tests, which then read it
    puzzle = usePuzzle(`03-02-2026_3x2`, init, true);

    return <output>{puzzle.moves}</output>;
  };

  const render = async (): Promise<void> => {
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
    await act(async () => {
      root.render(<Saved />);
    });
  };

  beforeEach(() => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it(`picks up a game of this puzzle where it was left`, async () => {
    localStorage.setItem(`03-02-2026_3x2`, `3|bcaefd,abcefd|ABC   `);
    await render();

    expect(puzzle.moves).toBe(1);
  });

  it(`leaves a game of a puzzle that has since been remade`, async () => {
    // Its moves were made on a different board, and a score made of them would be turned away
    localStorage.setItem(`03-02-2026_3x2`, `3|zzzzzz,abcefd|ABC   `);
    await render();

    expect(puzzle.moves).toBe(0);
  });
});
