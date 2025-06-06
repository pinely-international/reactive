import { State } from "./state/State"


class SharedProxySelectorHandler<T extends State<any>> implements ProxyHandler<T> {
  targetCache = new WeakMap<object, Partial<Record<keyof T, unknown>>>()
  get(target: T, key: string) {
    const cache = this.targetCache.get(target)
    if (cache == null) return

    const cached = cache[key as keyof T]
    if (cached != null) return cached

    let targetValue = target.get()
    target[Symbol.subscribe](it => targetValue = it)

    const property = targetValue?.[key as keyof T]
    if (property instanceof Function) {
      const method = (...args: unknown[]) => {
        const result = property.apply(targetValue, args)
        if (result === targetValue) { // Method resulting with itself implies it was changed.
          target.set(targetValue) // Triggers notifications.
          return target // As result was the same value, no need for copy.
        }

        const predicate = (value: T) => property.apply(value, args)
        return target.to(predicate)
      }
      cache[key as keyof T] = method

      return method
    }

    const propertyFlow = target.to(value => value?.[key as keyof T])
    propertyFlow[Symbol.subscribe](propertyValue => {
      if (propertyValue === targetValue?.[key as keyof T]) return

      targetValue[key as keyof T] = propertyValue as never
      target.set(targetValue)
    })

    cache[key as keyof T] = propertyFlow
    return propertyFlow
  }
}


const sharedHandler = new SharedProxySelectorHandler

function createReactiveSelector<T>(instance: State<T>) {
  return new Proxy(instance, sharedHandler) as unknown as ReactiveSelector<T>
}

export default createReactiveSelector


export type ReactiveSelector<T> = (
  T extends (null | undefined) ? NonNullable<T> :
  { [K in keyof T]-?: T[K] extends (...args: infer Args) => infer Return ? (...args: Args) => State<Return> : State<T[K]> }
)