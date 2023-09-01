import type { StoryObj, Meta } from "@storybook/react";
import { within, userEvent, waitFor } from "@storybook/testing-library";
import { expect } from "@storybook/jest";
import { rest } from "msw";
import { PuzzleState } from "#state/PuzzleState";
import { Game as Component } from "./Game";

export default {
  // eslint-disable-next-line @typescript-eslint/quotes
  title: "pages/Game",
  component: Component,
  parameters: {
    nextjs: {
      navigation: {
        pathname: `/`
      }
    },
    msw: {
      handlers: [
        rest.get(`/api/check`, async (req, res, ctx) => {
          const { searchParams } = new URL(req.url);
          const guesses = searchParams.get(`guesses`);
          if (typeof guesses !== `string`) {
            return res(
              ctx.json(null),
              ctx.status(400, `Received invalid value for "guesses" parameter`)
            );
          }
          return res(
            ctx.json(
              guesses
                .split(`,`)
                .map((guess) => PuzzleState.compare(guess, `reactstory`))
            )
          );
        })
      ]
    }
  }
} as Meta<typeof Component>;

export const Game: StoryObj<typeof Component> = {
  args: {
    puzzleID: `01-31-2023_5x1`,
    init: [5, `sreactoryt`],
    persist: false
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step(`user can win the game`, async () => {
      await userEvent.click(canvas.getByLabelText(`Rotate row 1 left`));
      await userEvent.click(canvas.getByLabelText(`Rotate column 5 up`));
      await userEvent.click(canvas.getByLabelText(`Rotate row 2 right`));
      await waitFor(() => {
        expect(
          canvas.getByText(
            /congratulations, you won in 3 moves! can you do better\?/i
          )
        ).toBeDefined();
      });
    });
  }
};
