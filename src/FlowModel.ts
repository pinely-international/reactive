import { FlowReadonly } from "./Flow"
import { isObservableLike, subscribe } from "./utils"

export class FlowModel<T> extends FlowReadonly<T> {
  commit() {
    this.messager.dispatch(this.value)
  }
}

export namespace FlowModel {
  export function Collection<T extends FlowModel<unknown>>(target: new (...args: unknown[]) => T): any {
    return function (...args: any[]) {
      const model = new target(...args)
      const modelState = model.get() as any

      for (const key of Object.keys(modelState)) {
        const modelProperty = (model as any)[key]
        if (isObservableLike(modelProperty)) return

        subscribe(modelProperty, propertyValue => {
          modelState[key] = propertyValue
          model.commit()
        })
      }
      return model
    }
  }
}