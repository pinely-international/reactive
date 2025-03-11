type Dependency = Set<Subscriber>;
type Subscriber = {
  execute(): void;
  dependencies: Set<Dependency>;
};

type Signal<T> = [() => T, (value: T) => void];

const context: Subscriber[] = []

function createSignal<T>(value: T): Signal<T> {
  const dependency: Dependency = new Set

  const get = (): T => {
    const running = context[context.length - 1]

    if (running) {
      dependency.add(running)

      running.dependencies.add(dependency)
    }

    return value
  }

  const set = (nextValue: T) => {
    value = nextValue

    for (const sub of [...dependency]) {
      sub.execute()
    }
  }

  return [get, set]
}

function cleanup(running: Subscriber) {
  for (const dep of running.dependencies) {
    dep.delete(running)
  }

  running.dependencies.clear()
}

function createEffect(effect: () => void) {
  const execute = () => {
    cleanup(running)

    context.push(running)

    try {
      effect()
    } finally {
      context.pop()
    }
  }

  const running: Subscriber = {
    execute,
    dependencies: new Set(),
  }

  execute()
}

function createMemo<T>(fn: () => T): () => T {
  const [read, write] = createSignal<T>(null as any)

  createEffect(() => write(fn()))

  return read
}

