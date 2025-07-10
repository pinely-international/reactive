import { ObservableOptions, Unsubscribe } from "./types"

const finalization = new FinalizationRegistry<() => void>(unsubscribe => unsubscribe())

export class Messager<T> {
  private readonly callbacks = new Set<(value: T) => void>()

  dispatch(value: T) {
    this.callbacks.forEach(callback => callback(value))
  }

  subscribe(next: (value: T) => void, options?: ObservableOptions): Unsubscribe {
    this.callbacks.add(next)

    const unsubscribe = () => void this.callbacks.delete(next)
    finalization.register(this, unsubscribe)
    options?.signal?.addEventListener("abort", unsubscribe)

    return { unsubscribe }
  }

  protected toJSON() { }
}

/**
 * Shorthand for `Messager<void>`. You can use it for better semantics.
 */
export class Notifier extends Messager<void> { }