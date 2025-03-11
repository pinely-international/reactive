import { Messager } from "./Messages"
import createReactiveAccessor from "./ReactiveAccessor"
import { Signal } from "./Signal"
import { AccessorGet, AccessorSet, Guarded, Observable, Subscriptable, Unsubscribe } from "./types"
import { isObservableLike, subscribe } from "./utils"
import { Ref } from "./ValueReference"





export class Flow<T> extends Signal<T> {
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


  readonly $ = /* @__PURE__ */ createReactiveAccessor(this)

  to<U>(predicate: (value: T) => U): Flow<U> {
    const fork = new Flow(predicate(this.value))
    this[Symbol.subscribe](value => {
      const newValue = predicate(value)
      if (newValue === fork.value) return

      fork.set(newValue)
    })
    return fork
  }

  from(predicate: (value: T) => T): Flow<T> {
    const fork = new Flow(this.value)
    const set = fork.set

    fork.set = value => set.call(fork, value instanceof Function ? predicate(value(fork.value)) : predicate(value))
    this.sets(fork)

    return fork
  }

  fork() { new Flow(this.get()) }
  clone() {
    const cloned = new Flow(this.get())
    this.sets(cloned)
    return cloned
  }

  readonly(): FlowRead<T> {
    return { get: () => this.value, [Symbol.subscribe]: next => this[Symbol.subscribe](next) }
  }

  writeonly(): FlowWrite<T> {
    return { set: value => this.set(value) }
  }

  is(predicate: (value: T) => boolean): FlowRead<boolean>
  is<U extends T>(predicate: (value: T) => value is U): FlowRead<boolean> {
    return { get: () => predicate(this.value), [Symbol.subscribe]: next => this[Symbol.subscribe](value => next(predicate(value))) }
  }
  readonly isNullish: FlowRead<boolean> = /* @__PURE__ */ this.is(value => value == null)
  readonly isNotNullish: FlowRead<boolean> =/* @__PURE__ */ this.is(value => value != null)

  guard<U extends T>(predicate: (value: T) => boolean): Guarded<U, T> & FlowRead<T>
  guard<U extends T>(predicate: (value: T) => value is U): Guarded<U, T> & FlowRead<T> {
    const guardedState = this.readonly() as Guarded<U, T> & FlowRead<T>
    guardedState.valid = predicate

    return guardedState
  }
  readonly nullable: Guarded<T | null | undefined, T | null | undefined> & FlowRead<T> = /* @__PURE__ */ this.guard(value => value == null)
  readonly nonNullable: Guarded<T & {}, T> & FlowRead<T & {}> = /* @__PURE__ */ this.guard(value => value != null) as never
  readonly required: Guarded<T & {}, T> & FlowRead<T & {}> = /* @__PURE__ */ this.nonNullable
}

export namespace Flow {
  export const of = <T>(items: (T | Flow<T>)[]): Flow<T>[] => {
    return items.map(Flow.from)
  }

  export const from = <T>(item: T | Flow<T> | FlowRead<T>): Flow<T> => {
    if (item instanceof Flow) return item
    if (isObservableLike(item)) {
      const fork = new Flow(item.get())

      subscribe(item, value => fork.set(value))

      return fork
    }

    return new Flow(item)
  }
}

export type Flowable<T> = T | Flow<T> | FlowRead<T>
export type ExtractFlowable<T> =
  T extends Flow<unknown> ? ReturnType<T["get"]> :
  T extends FlowRead<unknown> ? ReturnType<T["get"]> :
  T

export type FlowRead<T> = AccessorGet<T> & (Observable<T> | Subscriptable<T>)
export type FlowWrite<T> = AccessorSet<T>

export abstract class FlowReadonly<T> {
  protected value: T
  protected messager = new Messager<T>

  constructor(initialValue: T) { this.value = initialValue }

  get() { return this.value }
  protected set(value: T) {
    this.value = value
    this.messager.dispatch(value)
  }

  [Symbol.subscribe](next: (value: T) => void) { return this.messager.subscribe(next) }

  protected toJSON() { return this.value }
}
export abstract class FlowWriteonly<T> {
  protected value: T
  protected messager = new Messager<T>

  constructor(initialValue: T) { this.value = initialValue }

  set(value: T | ((value: T) => T)) {
    value = value instanceof Function ? value(this.value) : value

    this.value = value
    this.messager.dispatch(value)
  }

  protected toJSON() { }
}


// Flow.compute((a, b) => a + b, [new Flow(""), new Flow(1), 1, 2, "", { a: 1 }])
// Flow.all([new Flow(""), new Flow(1)])
// new Flow<{a:1} | null>(null).$.a
// Flow.f`my book: ${new Flow(1)}`

// type FlowFlatten<T> = T extends FlowRead<infer U> ? FlowFlatten<U> : T

// Flow.flat(new Flow(new Flow(new Flow(""))))
