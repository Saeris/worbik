/** A 3×3 matrix which transforms a color in linear RGB */
export type ColorMatrix = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number]
];

/**
 * How colors appear to someone who is missing one of their three types of
 * cone cells, as Brettel–Viénot–Mollon projections of linear RGB.
 *
 * These model the worst case of each deficiency. Most people with a color
 * vision deficiency have a cone type that is shifted rather than absent, and
 * can tell apart more than these simulations suggest.
 */
export const deficiencies = {
  /** Missing the cones sensitive to red */
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998]
  ],
  /** Missing the cones sensitive to green, which is the most common deficiency */
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881]
  ],
  /** Missing the cones sensitive to blue, which is rare */
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039]
  ]
} as const satisfies Record<string, ColorMatrix>;

export type Deficiency = keyof typeof deficiencies;
