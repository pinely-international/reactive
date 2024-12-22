const finalization = new FinalizationRegistry<() => void>(unsubscribe => unsubscribe())

export class Messager<T> {
  private readonly callbacks = new Set<(value: T) => void>()

  dispatch(value: T) {
    this.callbacks.forEach(callback => callback(value))
  }

  subscribe(next: (value: T) => void) {
    this.callbacks.add(next)

    const unsubscribe = () => void this.callbacks.delete(next)
    finalization.register(this, unsubscribe)

    return { unsubscribe }
  }
}

/**
 * Shorthand for `Messager<void>`. You can use it for better semantics.
 */
export class Notifier extends Messager<void> { }