import { ClosureParticipant } from "./ClosureSignal"

import { ObservableGetter, ReactiveSource } from "../Flow"
import { Messager } from "../Messages"
import { Observable, ObservableOptions, Subscriptable, Unsubscribe } from "../types"
import { isObservableGetter, isObservableLike } from "../utils"
import { RefReadonly } from "../ValueReference"


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

  subscribe(callback: (value: T) => void, options?: ObservableOptions) { return this.messager.subscribe(callback, options) }
  [Symbol.subscribe](next: (value: T) => void, options?: ObservableOptions) { return this.messager.subscribe(next, options) }

  protected toJSON() { return this.value }
  protected valueOf() { return this.value }
}


export namespace Signal {
  export function subscribe<T>(observable: ReactiveSource<T>, callback: (value: T) => void, options?: ObservableOptions): Unsubscribe
  export function subscribe(value: unknown, callback: (value: any) => void, options?: ObservableOptions): Unsubscribe {
    let unsubscribe: Unsubscribe = { unsubscribe: () => { } }

    if (value == null) return unsubscribe
    if (value instanceof Object === false) return unsubscribe
    if (isObservableLike(value) === false) return unsubscribe


    if ("subscribe" in value) unsubscribe = value.subscribe(callback)
    else if (Symbol.subscribe in value) unsubscribe = value[Symbol.subscribe](callback)


    options?.signal?.addEventListener("abort", unsubscribe.unsubscribe)
    return unsubscribe
  }

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
      else if (Symbol.subscribe in value) value[Symbol.subscribe](() => anonymousParticipant.dispatch())

      return value.get()
    }

    return value
  }

  export function get<T>(value: ReactiveSource<T>): T {
    if (value instanceof Function) return value()
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
  // export function lock(signal: Signal<unknown>): Disposable
  // export function lock(signals: Signal<unknown>[]): Disposable
  // export function lock(signals: Signal<unknown> | Signal<unknown>[]): Disposable {
  //   if (signals instanceof Array) {
  //     signals.forEach(signal => signal.messager.locked = true)
  //   } else {
  //     signals.messager.locked = true
  //   }

  //   return {
  //     [Symbol.dispose]: () => {
  //       if (signals instanceof Array) {
  //         signals.forEach(signal => signal.messager.locked = false)
  //       } else {
  //         signals.messager.locked = false
  //       }
  //     }
  //   }
  // }
}
