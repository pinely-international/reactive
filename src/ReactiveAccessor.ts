import { Flow } from "./Flow"

function createReactiveAccessor<T>(instance: Flow<T>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cache: Partial<Record<keyof T, unknown>> = {}
  return new Proxy(instance, {
    get: (target, key) => {
      const cached = cache[key as keyof T]
      if (cached != null) return cached

      const targetValue = target.get()

      const property = targetValue?.[key as keyof T]
      if (property instanceof Function) {
        const method = (...args: unknown[]) => {
          const result = property.apply(targetValue, args)
          // Method resulting with itself usually means it was updated.
          if (result === targetValue) {
            target.set(targetValue)
            return target
          }

          const predicate = (value: T) => property.apply(value, args)
          const fork = new Flow(result)
          // Follows `Flow.to` method implementation from here.
          instance[Symbol.subscribe](value => {
            const newValue = predicate(value)
            newValue !== fork.get() && fork.set(newValue)
          })
          return fork
        }
        cache[key as keyof T] = method

        return method
      }

      const propertyFlow = target.to(value => value?.[key as keyof T])
      cache[key as keyof T] = propertyFlow

      return propertyFlow
    }
  }) as unknown as (
      T extends (null | undefined) ? NonNullable<T> :
      { [K in keyof T]-?: T[K] extends (...args: infer Args) => infer Return ? (...args: Args) => Flow<Return> : Flow<T[K]> }
    )
}

export default createReactiveAccessor
