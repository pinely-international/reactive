# Reactive

This is a Reactivity Primitives Library, a uniform system that tries to comprehend industry standards.
It supports two kind of `Signal`s ([`EventSignal`](https://github.com/FrameMuse/event-signal) and [`ClosureSignal`](https://github.com/FrameMuse/closure-signal)), gives utils to ease reactivity rather than piping.

## Getting Started with `State`

**`State` comprehends two types of `Signal` at once, giving the same result:**

Using event-based signals

```ts
const balance = new State(0)
const income = new State(100)
const debt = new State(500)

const salary = income.to(it => it / 2)
salary.subscribe(salary => balance.set(it => it + salary))

const netWorth = balance.to(balance => balance - debt)
```

Using closure-based ones

```ts
const balance = new State(0)
const income = new State(100)
const debt = new State(500)

const salary = State.capture(() => income.use() / 2)
State.capture(() => {
  balance.set(balance.get() + salary.use())
})

const netWorth = State.capture(() => balance.use() - debt.use())
```

`State` modes are **interchangeable**, so you can use both together.

## Transforms

### `state.to`

`to` method is `map` function under a different name because `state.map(x => x.map(e => e))` seems a bit weird.
And it looks neat as Tacit programming - `string.to(Number)`

It creates a new `State` instance, transforms the value and assign it to the new instance.

It is useful when you want to select a value, but save reactivity:

```ts
const ypx = new State("15px")
const y = ypx.to(parseFloat)

ypx.set("16px") // Will set `y` to `16`.
y.set(15) // Will not affect `ypx`.
```

### `state.from`

It exposes `set` method that hooks to places where Signal-like structures required

It is useful when you want to fit "source" (or "sink") from where a new value is coming to a desired one:

```ts
const value = new State("text")
const event = new State<Event>()
event.sets(value.from(event => event.currentTarget.value))
```

This literally says "`event` sets `value` from `event.currentTarget.value`".

## Access properties

```ts
const app = new State({ user: { name: "test" } })
// Regular Access
app.get().user.name
app.current.user.name
// Observable Access
app.$.user.$.name.subscribe(console.log) // Logs `app.user.name` changes.
// Usage of `$` is cached and an observable for accessed property only created when first accessed.
app.$.user === app.$.user // true
```

## `State` Static methods

|Method|Description|
|------|-----------|
|`State.capture`|Captures every `use()` that appear in the closure and subscribes to their updates produces new value.|
|`State.collect`|Finds all (shallow) values in `Record` or `Array` and outputs it but with unwrapped values as a `State`.|
|`State.combine`|Reduces many states into one with a strategy.|
|`State.f`|Builds a string state from string template of observables.|
|`State.from`|Creates `State` from a value.|
|`State.get`|Unwraps any Signal-like structure.|
|`State.subscribe`|Subscribes to any Signal-like structure.|
|`State.subscribeImmediate`|Subscribes to any Signal-like structure and invokes `callback` immediately once.|
|`State.use`|Uses any Signal-like structure as `ClosureSignal` - can be used in `State.capture`.|

## `StateArray`

An array representation of `State`, it has more convenient `at` and `push` methods, and new one `delete`.

```ts
const array = new StateArray([1,2,3])
array.subscribe(console.log) // Logs `array` changes.

array.set([1,2,3,4])
array.push(5) // Triggers update.
array.at(2) // Returns an observable that reflects the value at desired index.

// Index can also be observable.
const index = new State(1)
array.at(index)

array.delete(2) // Triggers update.
console.log(array.get()) // [1,2,4,5]
```

However, you can still use `State` with arrays by using `$[index]`, it will still work but not so comfortable.

## Serialization

`State` (and other) has hidden `toJSON` method, which outputs actual value for serialization.

```ts
const bool = new State(true)
const string = new State("text")
const record = new State({foo:"bar"})
const array = new StateArray([1,2,3])

JSON.stringify({ bool, string, record, array })
```

=>

```json
{
  "bool": true,
  "string": "text",
  "record": { "foo" : "bar" },
  "array": [1, 2, 3]
}
```

## Other Primitives

### `Messager`

Dispatcher for single messages. Useful for building custom `Signal`-like structures.

### `Notifier`

Is a `Messager` but only for empty messages. Use for semantics.

### `Emitter`

A key-based event messager, usually known as Event Emitter.

```ts
interface Events {
  add(id: number): void
}

const emitter = new Emitter<Events>
emitter.when("add").subscribe(console.log) // Logs `add` events.
emitter.dispatch("add", 1)
```
