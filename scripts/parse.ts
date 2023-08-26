import * as fs from "fs/promises";

export const parse = async (): Promise<void> => {
  await fs.writeFile(
    `../../content/words.json`,
    JSON.stringify(
      (await fs.readFile(`../content/ready.txt`, `utf8`))
        .trim()
        .split(`\n`)
        .reduce<Record<number, string[]>>((hash, str) => {
          if (str.length > 4 && str.length < 10) {
            if (Array.isArray(hash[str.length - 1])) {
              hash[str.length - 1].push(str.replace(`\r`, ``));
            } else {
              hash[str.length - 1] = [str.replace(`\r`, ``)];
            }
          }
          return hash;
        }, {}),
      null,
      2
    )
  );
};

// void parse();
