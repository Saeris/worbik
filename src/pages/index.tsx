/* eslint-disable react/no-array-index-key */
import React, { useState, useCallback } from "react";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import { DirectioonBtn } from "../components/DirectionBtn";
import { deserialize, range, getNextState } from "../utils";
import type { Matrix2D } from "../utils/types";
import { jumbled } from "../solution";

// This tells Nextjs that we want to generate a static page
// All visitors will get a cached version of the page
// Nextjs will only regenerate it on request after the
// `revalidate` time has expired, in this case 24hrs
export const getStaticProps: GetStaticProps<{
  initial: Matrix2D<string>;
  target: number;
}> = () => ({
  props: {
    initial: jumbled.state,
    target: jumbled.moves
  },
  // https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration
  revalidate: 60 * 60 * 24 // Revalidate every 24hrs
});

// Our Home page component will only recieve the initial prop when
// a user first visits the page, so we use it to set our initial
// game state
const Home: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  initial,
  target
}) => {
  const [matrix, setMatrix] = useState(initial);
  const [moves, setMoves] = useState(0);
  const [winner, setWinner] = useState(false);
  const repeat = range(matrix.length);

  const handleClick = useCallback(
    (
        // row or col number
        pos: number,
        // true = increment, false = decriment
        dir: boolean = false,
        // true = horizontal, false = vertical
        axis: boolean = false
      ): React.MouseEventHandler<HTMLButtonElement> =>
      (e) => {
        e.preventDefault();
        if (!winner) {
          const check = async (): Promise<void> => {
            const url = new URL(`/api/check`, window.location.origin);
            url.searchParams.set(
              `solution`,
              getNextState(matrix, pos, dir, axis).flat().join(``)
            );
            const res = await (await fetch(url.toString())).json();
            // We'll update the game state with the response we got
            // from our server
            const nextState = deserialize(res);
            const stateStr = nextState.flat().join(``);
            setMatrix(nextState);
            setMoves((x) => x + 1);
            if (stateStr === stateStr.toUpperCase()) {
              setWinner(true);
            }
          };
          void check();
        }
      },
    [winner, matrix]
  );

  return (
    <div className="container">
      <div className="grid">
        <div className="row">
          {repeat.map((i) => (
            <DirectioonBtn
              key={`up-${i}`}
              direction="up"
              onClick={handleClick(i, true)}
            />
          ))}
        </div>
        {matrix.map((row, x) => (
          <div key={`row-${x}`} className="row">
            <DirectioonBtn
              key={`left-${x}`}
              direction="left"
              onClick={handleClick(x, false, true)}
            />
            {row.map((char, y) => (
              <div key={`char-${x}${y}`} className="character">
                {char}
              </div>
            ))}
            <DirectioonBtn
              key={`right-${x}`}
              direction="right"
              onClick={handleClick(x, true, true)}
            />
          </div>
        ))}
        <div className="row">
          {repeat.map((i) => (
            <DirectioonBtn
              key={`down-${i}`}
              direction="down"
              onClick={handleClick(i)}
            />
          ))}
        </div>
      </div>
      {winner
        ? `${
            moves === target
              ? ` Wow! You won in only ${moves} moves! You're a wizard at this!`
              : `Congratulations, you won in ${moves} moves! Can you do better?`
          }`
        : `Moves: ${moves}`}
    </div>
  );
};

export default Home;
