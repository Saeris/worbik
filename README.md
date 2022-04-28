# Worbik

**Genre**: Casual, Puzzle
**Platforms**: Web, Mobile
**Number of Players**: Single Player

## Gameplay

Each game consists of a randomly generated set of words that are scrambled and must be unscrambled similar to solving a Rubik's Cube. Words can be of variable length, but all words in a set will be of the same length. Sets can also be of variable length. For example, one game could have a grid of four 5-letter words, and another could have a grid of five 7-letter words. The range for both word length and set length is between 4 and 7 (to accomodate for reasonable touch input sizing on mobile devices).

Players must rotate the rows and columns of this grid to rearrange the letters and find the puzzle's solution. Scoring is measured by the number of moves the player made to solve the puzzle, with the least amount of moves to find a solution being the best score. This means each puzzle has perfect score that players can reach. There is also a `target` score, which is the number of moves used to initially scramble the grid, which may be higher than a perfect score. Like a Rubik's cube, there is no lose condition, and there is always a solution, so players may make any number of moves necessary to reach a solution.

During gameplay, when a letter is in the correct position, that status is reflected in the game's interface, hinting to the player what the words in each row are and how close they are to solving the puzzle.

Upon winning, players are given the option to share their score on social media. Optionally, if they have an account and are logged in, they can place on a daily global leader board and their score + completion status will be logged to their play history.

## Input Methods

1. Click controls (current implementation)
1. Keyboard (WASD rotates current column/row + Up/Left/Down/Right control focus in grid)
1. Gamepad (D-pad controls focus in grid + A/B/X/Y rotates current column/row)
1. Touch (Swipe to rotate a column or row)
