import type { NextApiHandler } from "next";
import { solution } from "../../solution";

const check: NextApiHandler<{ s: string; c: number } | string> = (req, res) => {
  if (req.method !== `GET`) {
    res.status(400).send(`Only GET requests are accepted!`);
    return;
  }
  if (typeof req.query.solution !== `string`) {
    res.status(400).send(`Received invalid value for "url" parameter`);
    return;
  }
  const answer = solution.flat().join(``);
  res.status(200).json({
    s: req.query.solution
      .toLowerCase()
      .split(``)
      .map((c, i) => (answer.charAt(i) === c ? c.toUpperCase() : c))
      .join(``),
    c: solution[0].length
  });
};

export default check;
