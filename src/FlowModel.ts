import { FlowReadonly } from "./Flow"

export class FlowModel<T> extends FlowReadonly<T> {
  commit() {
    this.messager.dispatch(this.value)
  }
}

export namespace FlowModel {
  export function Collection<T extends FlowModel<unknown>>(target: new (...args: unknown[]) => T): any {
    return function (...args: any[]) {
      const instance = new target(...args)

      for (const key of Object.keys(instance.get())) {
        instance[key]?.[Symbol.subscribe]?.(value => {
          instance.get()[key] = value
          instance.commit()
        })
      }
      return instance
    }
  }
}