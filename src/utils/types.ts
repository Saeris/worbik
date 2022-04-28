export type TransformArr = <T>(arr: T[]) => T[];

export type Matrix2D<T> = T[][];

export type Transform2DArr = <T>(arr: T[][]) => Matrix2D<T>;
