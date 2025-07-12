import { Primitive } from "type-fest"

import { ExtractGetable, ObservableGetter } from "@/Flow"
import createReactiveSelector, { ReactiveSelector } from "@/ReactiveAccessor"
import { ClosureCaptor } from "@/signal/ClosureSignal"
import { Signal } from "@/signal/Signal"
import { AccessorGet, AccessorSet, Observable, ObservableOptions, Subscriptable, Unsubscribe } from "@/types"
import { isObservableGetter, isObservableLike } from "@/utils"
import { Ref } from "@/ValueReference"

import { StateOrPlain } from "./State.types"


export class State<T> extends Signal<T> {
  subscribeImmediate(callback: (value: T) => void, options?: ObservableOptions) {
    if (!options?.signal?.aborted) callback(this.value)
    return this.subscribe(callback, options)
  }

  sets<U>(other: AccessorSet<T | U>): Unsubscribe {
    return this.messager.subscribe(value => other.set(value))
  }
  copy(other: Ref<T> | AccessorGet<T>) {
    if ("current" in other) {
      this.set(other.current)
      return
    }

    this.set(other.get())
  }


  private declare _$?: ReactiveSelector<T>
  get $() {
    if (this._$ == null) {
      this._$ = createReactiveSelector(this)
    }
    return this._$
  }

  to<U>(predicate: (value: T) => U): State<U> {
    const fork = new State(predicate(this.value))
    this.messager.subscribe(value => {
      const newValue = predicate(value)
      if (newValue === fork.value) return

      fork.set(newValue)
    })
    return fork
  }

  is<O extends Primitive>(other: T | O): AccessorGet<boolean> & Observable<boolean>
  is(other: ObservableGetter<unknown>): AccessorGet<boolean> & Observable<boolean>
  is(predicate: (value: T) => boolean): AccessorGet<boolean> & Observable<boolean>
  is<U extends T>(arg1: ((value: T) => value is U) | ObservableGetter<unknown> | U): AccessorGet<boolean> & Observable<boolean> {
    if (arg1 instanceof Function) {
      return { get: () => arg1(this.value), [Symbol.subscribe]: next => this.messager.subscribe(value => next(arg1(value))) }
    }

    return State.combine([this, arg1], (value, arg1) => value === arg1).readonly
  }

  get readonly(): AccessorGet<T> & Observable<T> {
    return { get: this.get.bind(this), [Symbol.subscribe]: this[Symbol.subscribe].bind(this) }
  }
  get writeonly(): AccessorSet<T> {
    return { set: this.set.bind(this) }
  }

  /** Captures next state value. */
  get upcoming(): Promise<T> {
    let subscription: Unsubscribe

    const promise = new Promise<T>(resolve => {
      subscription = this.subscribe(value => {
        resolve(value)
        subscription.unsubscribe()
      })
    })

    return promise
  }
}

export namespace State {
  export function subscribeImmediate(value: unknown, callback: (value: unknown) => void, options?: ObservableOptions) {
    const result = State.subscribe(value, callback, options)

    if (options?.signal?.aborted) return result

    const unwrappedValue = State.get(value)
    if (unwrappedValue === value && unwrappedValue instanceof Object && isObservableLike(unwrappedValue)) {
      return result
    }

    callback(unwrappedValue)
    return result
  }

  export function capture<T>(closure: () => T): State<T> {
    const signal = new State<T>(null as never) // Assume it will be actually initiated before first get.
    const signalClosure = () => signal.set(closure())

    new ClosureCaptor(signalClosure).capture()
    return signal
  }

  export function combine<const States extends unknown[], U>(states: States, predicate: (...values: {
    [K in keyof States]: ExtractGetable<States[K]>
  }) => U): State<U> {
    const values = states.map(State.get)

    const computed = new State(predicate(...values as never))

    states.forEach((state, index) => {
      State.subscribe(state, value => {
        values[index] = value
        computed.set(predicate(...values as never))
      })
    })

    return computed
  }

  export function collect<const T extends unknown[]>(array: T): State<{ [K in keyof T]: ExtractGetable<T[K]> }>
  export function collect<T extends Record<keyof never, unknown>>(record: T): State<{ [K in keyof T]: ExtractGetable<T[K]> }>
  export function collect(arg1: any): unknown {
    if (arg1 instanceof Array) {
      return State.combine(arg1, (...values) => values)
    }

    const result = {} as any
    const recordFlow = new State(result)

    for (const key of Object.keys(arg1)) {
      const value = arg1[key]
      if (isObservableGetter(value) === false) {
        result[key] = value
        continue
      }

      result[key] = value.get()
      State.subscribe(value, it => {
        result[key] = it
        recordFlow.set(result)
      })
    }

    return recordFlow as never
  }

  export function f(strings: TemplateStringsArray, ...values: unknown[]): State<string> {
    return State.combine(values, (...values) => strings.map((string, i) => string + String(values[i] ?? "")).join(""))
  }
  /** Forks state. */
  export function from<T>(item: State<T>): State<T>
  /** Copies initial value once. */
  export function from<T>(item: AccessorGet<T>): State<T>
  /** Copies initial value once and subscribes to updates. */
  export function from<T>(item: ObservableGetter<T>): State<T>
  /** No initial value, but subscribes to future updates. */
  export function from<T>(item: Observable<T> | Subscriptable<T>): State<T | undefined>
  /** Copies initial value. */
  export function from<T>(item: T): State<T>
  export function from<T>(item: StateOrPlain<T>): State<T> {
    if (item instanceof State) return new State(item.get())
    if (isObservableGetter(item)) {
      const state = new State<any>(item.get())

      if ("subscribe" in item) item.subscribe(value => state.set(value))
      else if (Symbol.subscribe in item) item[Symbol.subscribe](value => state.set(value))

      return state
    }
    if (isObservableLike(item)) {
      const state = new State<T | undefined>(undefined)
      State.subscribe(item, value => state.set(value as never))
      return state as never
    }

    return new State(State.get(item as T))
  }
}
