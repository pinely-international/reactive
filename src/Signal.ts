import { Messager } from "./Messages"

export class Signal<T> {
  protected messager = new Messager<T>
  protected value: T

  constructor(initialValue: T) { this.value = initialValue }

  get(): T { return this.value }
  set(newValue: T | ((current: T) => T)): void {
    const value = newValue instanceof Function ? newValue(this.value) : newValue

    this.value = value
    this.messager.dispatch(value)
  }
  [Symbol.subscribe](next: (value: T) => void) { return this.messager.subscribe(next) }

  protected toJSON() { return this.value }
}
