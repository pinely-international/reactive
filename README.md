# flow

State Observable library.

## Getting Started

```ts
const balance = new Flow(120)
balance.set(680)
balance.subscribe(it => console.log(it)) // Follows `balance` changes.

const another = new Flow(1)
another.sets(balance) // Will set to balance on each update.
another.set(it => it + 998)

console.log(another.get()) // 999
console.log(balance.get()) // 999
```

## Access Record properties

```ts
const app = new Flow({ user: { name: "test" } })
// Regular Access
app.get().user.name
app.current.user.name
// Observable Access
app.$.user.$.name.subscribe(it => console.log(it)) // Follows `app.user.name` changes.
// Usage of `$` is cached and an observable for accessed property only created when first accessed.
app.$.user === app.$.user // true
```

## `FlowArray`

An array representation of `Flow`, it has more convenient `at` and `push` methods, and new one `delete`.

```ts
const array = new FlowArray([1,2,3])
array.subscribe(it => console.log(it)) // Follows `array` changes.

array.set([1,2,3,4])
array.push(5) // Triggers update.
array.at(2) // Returns an observable that reflects the value at desired index.

// `index` can also be observable.
const index = new Flow(1)
array.at(index)

array.delete(2) // Triggers update.
console.log(array.get()) // [1,2,4,5]
```

## `FlowModel`

Experimental structure for building complex states.

```ts
import { Flow, FlowArray, FlowModel } from "@denshya/flow"

@FlowModel.Collection
class CharacterModel extends FlowModel<CharacterSerialized> {
  constructor(init?: Partial<CharacterSerialized>) {
    super({ ...CHARACTER_MODEL_DEFAULT, ...init })
  }

  readonly name = new Flow(this.get().name)
  readonly birth = new Flow(this.get().birth)
  readonly death = new Flow(this.get().death)
  readonly bioEvents = new FlowArray(this.get().bioEvents)
  readonly createEvents = new FlowArray(this.get().createEvents)
  readonly moves = new FlowArray(this.get().moves)
}

const CHARACTER_MODEL_DEFAULT: CharacterSerialized = {
  name: "",
  birth: "",
  death: "",
  bioEvents: [],
  createEvents: [],
  moves: []
}

export interface CharacterSerialized {
  name: string
  birth: string
  death: string
  bioEvents: CharacterEventSerialized[]
  createEvents: CharacterEventSerialized[]
  moves: any[]
}

export interface CharacterEventSerialized {
  summary: string
  date: string
}
```

## `Signal`

Straightforward implementation of basically Observable Accessor. It has only `set`, `get` and `subscribe` (`Symbol.subscribe`) methods.

## `Messager`

Dispatcher for single messages. Useful for building custom `Signal`-like structures.

## `Notifier`

Is a `Messager` but only for empty messages. Use for semantics.

## `Emitter`

A key-based event messager, usually known as Event Emitter.

```ts
interface Events {
  add(id: number): void
}

const emitter = new Emitter
emitter.observe("add").subscribe(it => console.log(it)) // Follows `add` events.
emitter.dispatch("add", 1)
```

## `FlowReadonly`/`FlowWriteonly`

Abstract classes allowing you to create readonly `Signal`-like structures.

```ts
const NetworkConnected = new class extends FlowReadonly<boolean> {
  constructor() {
    super(window.navigator.onLine)

    window.addEventListener("online", () => this.set(true))
    window.addEventListener("offline", () => this.set(false))
  }
}
```
