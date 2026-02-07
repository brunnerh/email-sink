/**
 * Either the type or a promise of the type.
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Excludes properties from a type.
 */
export type KeyedOmit<T, K extends keyof T> = Omit<T, K>;
