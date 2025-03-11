/** 
 * A refactored (written differently but has exact same behavior) code of
 * 
 * Andrea Giammarchi
 * https://github.com/WebReflection/signal
*/

const effects = new Set<Effect>()

/**
 * Updates enclosed signals and runs effects only after them.
 * 
 * [Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
 */
export function batch(closure: () => void) {
  try {
    closure()
  } finally {
    for (const effect of effects) effect.closure()
  }
}

class Effect {
  public readonly dependencies = new Set<Effect>()

  constructor(public closure: () => void) { }
  dispose() {
    for (const dependency of this.dependencies) {
      dependency.dependencies.delete(this)
      // dependency.dispose()
    }

    this.dependencies.clear()
  }
}

let current: Effect | null = null
const createEffect = (block: () => void) => {
  const effect = new Effect(() => {
    const prev = current
    current = effect
    try { block() }
    finally { current = prev }
  })
  return effect
}

/**
 * Invokes a function when any of its internal signals or computed values change.
 * Returns a `dispose` callback.

 * @type {<T>(fn: (v?: T) => T | undefined, value?: T) => () => void}
 */
export const effect = (closure: () => any) => {
  let teardown: { call: () => void; }
  const effect = createEffect(() => { teardown?.call?.(); teardown = closure() })

  current?.dependencies.add(effect)
  effect.closure()

  return () => {
    teardown?.call?.()
    effect.dispose()
  }
}

/**
 * Executes a given function without tracking its dependencies.
 * This is useful for actions that should not subscribe to updates in the reactive system.
 * @param {Function} closure - The function to execute without dependency tracking.
 */
export function untracked(closure: () => any) {
  let prev = current, result
  current = null
  result = closure()
  current = prev
  return result
}

/**
 * A signal with a value property also exposed via toJSON, toString and valueOf.
 * @template T
 */
export class Signal<T> {
  f
  protected effects = new Set<Effect>()

  constructor(protected value: T) { }

  get(): T {
    if (current) current.add(this.add(current))
    return this._
  }

  set(value: T) {
    if (this.value !== value) {
      this.value = value
      const root = !effects

      for (const effect of this.effects) {
        if (root) effect._()
        else effects?.add(effect)
      }

      this.effects = new Set // Faster
      // this.effects.clear()
    }
  }
}

/**
 * Returns a writable Signal that side-effects whenever its value gets updated.
 * @template T
 * @type {<T>(value: T) => Signal<T>}
 */
export const signal = (value: any) => new Signal(value)

/**
 * A read-only Signal extend that is invoked only when any of the internally
 * used signals, as in within the callback, is unknown or updated.
 * @template T
 * @extends {Signal<T>}
 */
export class Computed<T> {
  effect: Effect | null = null

  protected value: T | null

  constructor(public closure: () => void) { }

  get(): T {

    if (this.effect == null) (this.effect = createEffect(() => this.value = this.closure())).closure()

    return this.value
  }
}
