
export interface Guarded<T extends Original, Original = unknown> { valid(value: Original): value is T }

export interface AccessorGet<T> { get(): T }
export interface AccessorSet<T> { set(value: T): void }
export interface AccessorSetAction<T> { set(value: T | ((value: T) => void)): void }

export type Unsubscribe = { unsubscribe: () => void }
export interface Subscriptable<T> { subscribe: (listener: (value: T) => void) => Unsubscribe }
export interface Observable<T> { [Symbol.subscribe](listener: (value: T) => void): Unsubscribe }
export interface ObservableOptions { signal?: AbortSignal }

export type ObservableLike<T> = Subscriptable<T> | Observable<T>