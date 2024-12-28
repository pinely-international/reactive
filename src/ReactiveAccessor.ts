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

      const propertyFlow = new Flow(targetValue?.[key as keyof T])
      propertyFlow[Symbol.subscribe](propertyValue => {
        if (propertyValue === targetValue?.[key as keyof T]) return

        targetValue[key as keyof T] = propertyValue as never
        target.set(targetValue)
      })

      target[Symbol.subscribe](value => {
        const newPropertyValue = value?.[key as keyof T]
        if (newPropertyValue === propertyFlow.get()) return

        propertyFlow.set(newPropertyValue)
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
