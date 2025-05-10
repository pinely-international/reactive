import { Messager } from "./Messages"
import { State } from "./state/State"
import { AccessorGet, Observable, Subscriptable } from "./types"
import { Ref } from "./ValueReference"





export type StateSource<T> = T | Ref<T> | (() => T) | ObservableGetter<T>
export type ReactiveSource<T> = T | Ref<T> | (() => T) | ObservableGetter<T>
export type ObservableGetter<T> = AccessorGet<T> & (Observable<T> | Subscriptable<T>)

export type ExtractGetable<T> =
  T extends State<unknown> ? ReturnType<T["get"]> :
  T extends ObservableGetter<unknown> ? ReturnType<T["get"]> :
  T


export abstract class SignalReadonly<T> {
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
  protected valueOf() { return this.value }
}
export abstract class SignalWriteonly<T> {
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
