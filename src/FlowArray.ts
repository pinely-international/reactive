import { Flow, Flowable } from "./Flow"
import { Signal } from "./Signal"
import { isFlowRead } from "./utils"


export class FlowArray<T> extends Signal<T[]> {
  constructor(init?: Flowable<T[]>) {
    if (isFlowRead(init)) {
      super(init.get())
      init[Symbol.subscribe](value => this.set(value))
    } else {
      super(init ?? [])
    }
  }

  at(index: number): Flow<T> {
    const indexFlow = Flow.from(this.value[index])
    this[Symbol.subscribe](value => indexFlow.set(value[index]))

    return indexFlow
  }

  push(value: T): number {
    const index = this.value.push(value)
    this.messager.dispatch(this.value)

    return index
  }

  delete(index: number) {
    this.value.splice(index, 1)
    this.messager.dispatch(this.value)
  }
}
