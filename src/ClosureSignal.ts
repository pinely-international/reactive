/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */

// https://www.youtube.com/watch?v=vHy7GRpTpm8&list=LL&index=3&t=514s
// https://codesandbox.io/s/0xyqf?file=/reactive.js:0-1088

/** A `Dependency` has many different Subscribers depending on it. */
type ClosureDependency = Set<ClosureSubscriber>
/** A particular Subscriber has many Dependencies */
interface ClosureSubscriber {
  execute(): void
  dependencies: Set<ClosureDependency>
}





class ClosureSubscriber {
  dependencies = new Set<ClosureDependency>

  constructor(private readonly closure: () => void) { }

  execute() {
    ClosureSubscriber.dispose(this)
    ClosureSubscriber.subscribers.push(this)

    try {
      this.closure()
    } finally {
      ClosureSubscriber.subscribers.pop()
    }
  }

  static readonly subscribers: ClosureSubscriber[] = []
  /** Retrieves current (last) subscriber. */
  static getCurrent() { return ClosureSubscriber.subscribers.at(-1) }
  static dispose(subscriber: ClosureSubscriber) {
    for (const dependency of subscriber.dependencies) {
      dependency.delete(subscriber)
    }

    subscriber.dependencies.clear()
  }
}

class ClosureParticipant {
  private readonly dependency: ClosureDependency = new Set

  /** Attaches this participant to the current closure subscriber. */
  attach() {
    const currentSubscriber = ClosureSubscriber.getCurrent()
    if (currentSubscriber == null) return

    this.dependency.add(currentSubscriber)
    currentSubscriber.dependencies.add(this.dependency)
  }

  /** Notifies previously attached subscribers. */
  dispatch() {
    for (const subscriber of [...this.dependency]) {
      subscriber.execute()
    }
  }
}



export namespace ClosureSignal {
  export class State<T> {
    private value: T
    private closureParticipant = new ClosureParticipant

    constructor(initialValue: T) { this.value = initialValue }

    get(): T {
      this.closureParticipant.attach()
      return this.value
    }

    set(nextValue: T): void {
      this.value = nextValue
      this.closureParticipant.dispatch()
    }
  }
  export class Computed<T> {
    private readonly state: State<T>

    constructor(factoryClosure: () => T) {
      this.state = new State<T>(null as never) // Assume it will be actually initiated before first get.

      const closure = () => this.state.set(factoryClosure())

      new ClosureSubscriber(closure).execute()
    }

    get(): T { return this.state.get() }
  }
}
