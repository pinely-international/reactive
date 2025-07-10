import { ObservableGetter } from "./Flow"
import { ObservableLike } from "./types"

/** @internal */
export function isObservableGetter(value: unknown): value is ObservableGetter<unknown> {
  return value instanceof Object && "get" in value && (Symbol.subscribe in value || "subscribe" in value)
}

/** @internal */
export function isObservableLike(value: unknown): value is ObservableLike<unknown> {
  return value instanceof Object && (Symbol.subscribe in value || "subscribe" in value)
}
