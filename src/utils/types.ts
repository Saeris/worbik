export type Maybe<T> = T | null | undefined;

/** Primitive types which cannot have the `readonly` data access modifier */
type ImmutablePrimitive =
  | Function
  | boolean
  | number
  | string
  | null
  | undefined;

export type Immutable<T> = T extends ImmutablePrimitive
  ? // If T is a primitive, return the primitive
    T
  : // If T is an Array, make it readonly
  T extends Array<infer U>
  ? ReadonlyArray<Immutable<U>>
  : // If T is a Map, make it readonly
  T extends Map<infer K, infer V>
  ? ReadonlyMap<K, V>
  : // If T is a Set, make it readonly
  T extends Set<infer M>
  ? ReadonlySet<M>
  : // Otherwise T must be an object, so make it's properties readonly
    { readonly [K in keyof T]: Immutable<T[K]> };

export type Mutable<T> = T extends ImmutablePrimitive
  ? // If T is a primitive, return the primitive
    T
  : // If T is a Readonly Array, infer it's element types and return a mutable Array
  T extends ReadonlyArray<infer U>
  ? U[]
  : // If T is a Readonly Map, infer it's keys and values and return mutable Map
  T extends ReadonlyMap<infer K, infer V>
  ? Map<K, V>
  : // If T is a Readonly Set, infer it's Iterable and return a mutable Set
  T extends ReadonlySet<infer I>
  ? Set<I>
  : // Otherwise T must be an object, so make it's properties mutable
    { -readonly [K in keyof T]: Mutable<T[K]> };

export type MaybeReadonly<T> = Immutable<T> | Mutable<T> | T;
