import { Primitive } from "type-fest"

import { ObservableGetter } from "@/Flow"
import createReactiveSelector, { ReactiveSelector } from "@/ReactiveAccessor"
import { Signal } from "@/signal/Signal"
import { AccessorGet, AccessorSet, Observable, Unsubscribe } from "@/types"
import { Ref } from "@/ValueReference"


export class State<T> extends Signal<T> {
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


  private _$?: ReactiveSelector<T>
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

    return Signal.combine([this, arg1], (value, arg1) => value === arg1)
  }

  get readonly(): AccessorGet<T> & Observable<T> {
    return { get: this.get.bind(this), [Symbol.subscribe]: this[Symbol.subscribe].bind(this) }
  }
  get writeonly(): AccessorSet<T> {
    return { set: this.set.bind(this) }
  }
}
