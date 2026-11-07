/**
 * What can go wrong with signing in.
 *
 * These are apart from the code that throws them, which is only fetched by
 * those who sign in. Telling one failure from another mustn't depend on
 * fetching anything, as that may be the very thing that failed.
 */

/** A reason that signing in couldn't begin, in words that are meant for the player */
export class SignInError extends Error {}

/** Thrown when a player's sign-in turns out to have run out, or to have been withdrawn */
export class SignedOutError extends Error {}
