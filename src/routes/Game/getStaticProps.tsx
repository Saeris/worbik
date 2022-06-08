import type { GetStaticProps } from "next";
import type { Matrix2D } from "../../utils/types";
import { jumbled } from "../../solution";

export const getStaticProps: GetStaticProps<{
  initial: Matrix2D<string>;
  target: number;
}> = () => ({
  props: {
    initial: jumbled.state,
    target: jumbled.moves
  },
  revalidate: 60 * 60 * 24 // Revalidate every 24hrs
});
