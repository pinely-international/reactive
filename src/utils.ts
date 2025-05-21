import { ObservableGetter } from "./Flow"

/** @internal */
export function isObservableGetter(value: unknown): value is ObservableGetter<unknown> {
  return value instanceof Object && "get" in value && (Symbol.subscribe in value || "subscribe" in value)
}

/** @internal */
export function isObservableLike(value: object): value is ObservableGetter<unknown> {
  return (Symbol.subscribe in value || "subscribe" in value)
}
