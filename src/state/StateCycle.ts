import { Emitter } from "@/Emitter"

export class StateCycle {
  public get alive() { return this.abortController.signal.aborted }

  private abortController = new AbortController
  private events = new Emitter<{
    enter: void
    exit: void
  }>()

  protected enter(): void {
    if (this.alive) return

    this.abortController = new AbortController
    this.events.dispatch("enter")
  }

  protected exit(): void {
    if (!this.alive) return

    this.abortController.abort()
    this.events.dispatch("exit")
  }
  /**
   * Executes a setup function when the lifecycle enters. 
   * If the setup function returns another function, it will be treated as a 
   * cleanup callback and executed when the lifecycle exits.
   */
  public cycle(onEnter: (signal: AbortSignal) => void): void {
    let onExit: (() => {}) | void

    this.events.when("enter").subscribe(() => {
      onExit = onEnter(this.abortController.signal)
    })

    this.events.when("exit").subscribe(() => onExit?.())
  }

  /**
   * Subscribes to lifecycle events.
   * @param event The event to listen for ("enter" or "exit")
   */
  public when(event: "enter" | "exit") { return this.events.when(event) }

  /**
   * Adopts a piece of logic and automatically manages its lifecycle.
   * This can be an object with onEnter/onExit methods, or a startup function.
   * @param logic The logic to adopt.
   */
  public adopt(logic: {
    onEnter?: () => void
    onExit?: () => void
  }): void {
    if (logic.onEnter) {
      this.events.when("enter").subscribe(logic.onEnter)
    }
    if (logic.onExit) {
      this.events.when("exit").subscribe(logic.onExit)
    }
  }
}
