import { State } from "./state/State"

function createReactiveSelector<T>(instance: State<T>) {
  const cache: Partial<Record<keyof T, unknown>> = {}
  return new Proxy(instance, {
    get: (target, key) => {
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
  }) as unknown as ReactiveSelector<T>
}

export default createReactiveSelector


export type ReactiveSelector<T> = (
  T extends (null | undefined) ? NonNullable<T> :
  { [K in keyof T]-?: T[K] extends (...args: infer Args) => infer Return ? (...args: Args) => State<Return> : State<T[K]> }
)