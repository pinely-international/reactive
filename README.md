# Reactive

## Getting Started with `State`

Using even-based signals

```ts
const balance = new State(120)
balance.set(680)
balance.subscribe(console.log) // Follows `balance` changes.

const another = new State(1)
another.sets(balance) // Will set to balance on each update.
another.set(it => it + 998)

console.log(another.get()) // 999
console.log(balance.get()) // 999
```

or using closure-based ones

```
const balance1 = new State(120)
const balance2 = new State(120)
const balance3 = State.capture(() => balance1.use() + balance2.use()) // 240

balance3.subscribe(console.log) // Follows `balance3` changes.
balance3.set(0) // 0
```

## Access Record properties

```ts
const app = new State({ user: { name: "test" } })
// Regular Access
app.get().user.name
app.current.user.name
// Observable Access
app.$.user.$.name.subscribe(it => console.log(it)) // Follows `app.user.name` changes.
// Usage of `$` is cached and an observable for accessed property only created when first accessed.
app.$.user === app.$.user // true
```

## `StateArray`

An array representation of `State`, it has more convenient `at` and `push` methods, and new one `delete`.

```ts
const array = new StateArray([1,2,3])
array.subscribe(it => console.log(it)) // Follows `array` changes.

array.set([1,2,3,4])
array.push(5) // Triggers update.
array.at(2) // Returns an observable that reflects the value at desired index.

// `index` can also be observable.
const index = new State(1)
array.at(index)

array.delete(2) // Triggers update.
console.log(array.get()) // [1,2,4,5]
```

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
