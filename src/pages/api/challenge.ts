import { NextApiHandler } from "next";
import { jumbled } from "../../solution";

const challenge: NextApiHandler = async (req, res) => {
  if (req.method !== `GET`) {
    res.status(400).send(`Only GET requests are accepted!`);
    return;
  }
  res.status(200).json(jumbled.state);
};

export default challenge;
