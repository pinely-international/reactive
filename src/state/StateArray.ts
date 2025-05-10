import { State } from "./State"

import { ReactiveSource } from "../Flow"
import { Signal } from "../signal/Signal"
import { isObservableGetter, subscribe } from "../utils"


export class StateArray<T> extends Signal<T[]> implements Iterable<T> {
  constructor(init?: ReactiveSource<T[]>) {
    if (isObservableGetter(init)) {
      super(init.get())
      subscribe(init, value => this.set(value))
    } else {
      super(init ?? [])
    }
  }

  at(index: ReactiveSource<number>): State<T> {
    const index$ = new State(this.value[State.get(index)])

    if (isObservableGetter(index)) subscribe(index, i => index$.set(this.value[i]))
    this[Symbol.subscribe](value => index$.set(value[State.get(index)]))

    return index$
  }

  push(value: T): number {
    const index = this.value.push(value)
    this.messager.dispatch(this.value)

    return index
  }

  map<U>(predicate: (value: T, index: number, array: T[]) => U): StateArray<U> {
    const mapped = new StateArray(this.value.map(predicate))
    this[Symbol.subscribe](value => mapped.set(value.map(predicate)))
    return mapped
  }

  delete(index: number) {
    this.value.splice(index, 1)
    this.messager.dispatch(this.value)
  }

  *[Symbol.iterator]() { yield* this.value }
}
