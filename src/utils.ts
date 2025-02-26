import { FlowRead } from "./Flow"
import { Observable, Subscriptable } from "./types"

/** @internal */
export function isObservableLike(value: unknown): value is FlowRead<unknown> {
  return value instanceof Object && "get" in value && (Symbol.subscribe in value || "subscribe" in value)
}

/** @internal */
export function subscribe<T>(object: Observable<T> | Subscriptable<T>, callback: (value: T) => void): void {
  if ("subscribe" in object) object.subscribe(callback)
  if (Symbol.subscribe in object) object[Symbol.subscribe](callback)
}