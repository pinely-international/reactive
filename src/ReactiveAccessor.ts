import { Flow } from "./Flow"

function createReactiveAccessor<T>(instance: Flow<T>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      propertyFlow[Symbol.subscribe](it => {
        if (targetValue[key as keyof T] === it) return
        targetValue[key as keyof T] = it!
        target.set(targetValue) // Triggers notifications.
      })

      cache[key as keyof T] = propertyFlow
      return propertyFlow
    }
  }) as unknown as (
      T extends (null | undefined) ? NonNullable<T> :
      { [K in keyof T]-?: T[K] extends (...args: infer Args) => infer Return ? (...args: Args) => Flow<Return> : Flow<T[K]> }
    )
}

export default createReactiveAccessor
