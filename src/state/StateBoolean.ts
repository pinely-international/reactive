import { Signal } from "@/signal/Signal"

export class StateBoolean extends Signal<boolean> {
  private static readonly TOGGLE_FUNCTION = (value: boolean) => !value

  toggle() { this.set(StateBoolean.TOGGLE_FUNCTION) }
}
