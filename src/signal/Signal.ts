
import { ClosureParticipant } from "./ClosureSignal"

import { ObservableGetter } from "../Flow"
import { Messager } from "../Messages"
import { Observable, Subscriptable } from "../types"
import { isObservableGetter } from "../utils"
import { Ref, RefReadonly } from "../ValueReference"


export class Signal<T> implements RefReadonly<T>, Observable<T>, Subscriptable<T> {
  protected closureParticipant = new ClosureParticipant
  protected messager = new Messager<T>
  protected value: T

  get current() { return this.value }

  constructor(initialValue: T) { this.value = initialValue }

  /** 
   * Besides returning `value`, sends itself to the capturing closure signal
   * to act as if `Signal` is directly subscribed.
   * 
   * @example
   * const state1 = new Signal(123)
   * const state2 = new Signal(456)
   * const state3 = Signal.capture(() => state1.use() + state2.use())
   * */
  use(): T {
    this.closureParticipant.attach()
    return this.value
  }

  get(): T { return this.value }
  set(newValue: T | ((current: T) => T)): void {
    const value = newValue instanceof Function ? newValue(this.value) : newValue

    this.value = value
    this.messager.dispatch(value)
    this.closureParticipant.dispatch()
  }

  subscribe(callback: (value: T) => void) { return this.messager.subscribe(callback) }
  [Symbol.subscribe](next: (value: T) => void) { return this.messager.subscribe(next) }

  protected toJSON() { return this.value }
  protected valueOf() { return this.value }
}


export namespace Signal {
  /**
 * Allows using plain observables within capturing closure.
 * 
 * @example
 * 
 * const observable1 = new Observable
 * const signal2 = new Signal
 * 
 * Signal.capture(() => signal2.use() + Signal.use(observable1))
 */
  export function use<T>(value: T | Signal<T> | ObservableGetter<T>): T {
    if (value instanceof Signal) return value.use()
    if (isObservableGetter(value)) {
      const anonymousParticipant = new ClosureParticipant
      anonymousParticipant.attach()

      if ("subscribe" in value) value.subscribe(() => anonymousParticipant.dispatch())
      if (Symbol.subscribe in value) value[Symbol.subscribe](() => anonymousParticipant.dispatch())

      return value.get()
    }

    return value
  }

  export function get<T>(value: T | ObservableGetter<T> | Ref<T>): T {
    if (value instanceof Object) {
      if ("get" in value) return value.get()
      if ("current" in value) return value.current
    }

    return value
  }

  /** 
   * Disables *propagation* until the lock is disposed.
   * 
   * @example
   * state1.sets(state2)
   * state1.subscribe(value => {
   *   if (value === 1) {
   *     using lock = Signal.lock(state2) // or Signal.lock([state2])
   *   }
   * 
   *   state3.set(value)
   * })
   * 
   * state2.subscribe(console.log)
   * state3.subscribe(console.log)
   * 
   * state1.set(2) // Both `state2` and `state3` call `console.log`.
   * state1.set(1) // Only `state3` calls `console.log`.
   */
  export function lock(signal: Signal<unknown>): Disposable
  export function lock(signals: Signal<unknown>[]): Disposable
  export function lock(signals: Signal<unknown> | Signal<unknown>[]): Disposable {
    if (signals instanceof Array) {
      signals.forEach(signal => signal.messager.locked = true)
    } else {
      signals.messager.locked = true
    }

    return {
      [Symbol.dispose]: () => {
        if (signals instanceof Array) {
          signals.forEach(signal => signal.messager.locked = false)
        } else {
          signals.messager.locked = false
        }
      }
    }
  }
}
