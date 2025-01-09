import { Flow, FlowRead } from "./Flow"
import { Signal } from "./Signal"
import { isFlowRead } from "./utils"

export class FlowArray<T> extends Signal<T[]> {
  constructor(items: FlowRead<T[]> | FlowRead<T>[] | Iterable<T>) {
    if (items instanceof Array) {
      super(items.map(Flow.get))
    } else if (isFlowRead(items)) {
      super(items.get())
    } else {
      super([...items])
    }
  }
}
