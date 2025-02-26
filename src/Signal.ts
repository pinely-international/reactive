import { ExtractFlowable, Flowable } from "./Flow"
import { Messager } from "./Messages"
import { isObservableLike, subscribe } from "./utils"
import { RefReadonly } from "./ValueReference"


export class Signal<T> implements RefReadonly<T> {
  protected messager = new Messager<T>
  protected value: T

  get current() { return this.value }

  constructor(initialValue: T) { this.value = initialValue }

  // /** Besides simply returning current value, subscribe */
  // spy(): T { }

  get(): T { return this.value }
  set(newValue: T | ((current: T) => T)): void {
    const value = newValue instanceof Function ? newValue(this.value) : newValue

    this.value = value
    this.messager.dispatch(value)
  }

  subscribe(callback: (value: T) => void) { return this[Symbol.subscribe](callback) }
  [Symbol.subscribe](next: (value: T) => void) { return this.messager.subscribe(next) }

  protected toJSON() { return this.value }
}

export namespace Signal {
  export const all = <const T extends unknown[]>(flows: T): Signal<{ [K in keyof T]: ExtractFlowable<T[K]> }> => {
    return Signal.compute((...values) => values, flows)
  }

  export const compute = <const States extends unknown[], U>(predicate: (...values: { [K in keyof States]: ExtractFlowable<States[K]> }) => U, states: States): Signal<U> => {
    const values = states.map(Signal.get)

    const computed = new Signal(predicate(...values as never))

    states.forEach((state, index) => {
      if (isObservableLike(state) === false) return

      subscribe(state, value => {
        values[index] = value
        computed.set(predicate(...values as never))
      })
    })

    return computed
  }

  export const computeRecord = <T extends Record<keyof never, unknown>>(record: T): Signal<{ [K in keyof T]: ExtractFlowable<T[K]> }> => {
    const result = {} as any
    const recordFlow = new Signal(result)

    for (const [key, value] of Object.entries(record)) {
      if (isObservableLike(value) === false) {
        result[key] = value
        continue
      }

      result[key] = value.get()
      subscribe(value, it => {
        result[key] = it
        recordFlow.set(result)
      })
    }

    return recordFlow as never
  }

  export const get = <T>(value: Flowable<T>): T => {
    return isObservableLike(value) ? value.get() : value
  }

  export const f = (strings: TemplateStringsArray, ...values: unknown[]): Signal<string> => {
    return Signal.compute((...values) => strings.map((string, i) => string + String(values[i] ?? "")).join(""), values)
  }

  export const adapt = <Args extends unknown[], Return>(fn: (...args: Args) => Return): (...args: { [K in keyof Args]: Flowable<Args[K]> }) => Signal<Return> => {
    return (...args) => Signal.compute(fn, args as never)
  }
}

// export namespace Signal.closure {
//   export function effect(closure: () => void) {

//   }
// }