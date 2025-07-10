// tests/StateNestedProxy.test.ts
import { describe, expect, it } from "bun:test"

import { State } from "../state/State"

describe("Nested State access via $ returns State", () => {
  it("should return State instance for nested objects via $", () => {
    const state = new State({ user: { name: "Alice" } })
    const user = state.$.user
    expect(user).toBeInstanceOf(State)
    expect(user.use()).toEqual({ name: "Alice" })
  })

  it("should allow subscribing to nested State via $", () => {
    const state = new State({ config: { enabled: true } })
    const config = state.$.config
    let seen = false
    config.subscribe(val => {
      seen = val.enabled
    })
    config.set({ enabled: false })
    expect(seen).toBe(false)
  })

  it("should allow deep mutation through nested $ State", () => {
    const state = new State({ settings: { theme: "light" } })
    const settings = state.$.settings
    settings.$.theme.set("dark")
    expect(state.$.settings.$.theme.current).toBe("dark")
  })

  it("should retain reactivity through both nested `$` access and `capture`", () => {
    const state = new State({ foo: { bar: 1 } })
    let observed = 0
    State.capture(() => {
      observed = state.$.foo.$.bar.use()
    })
    state.$.foo.$.bar.set(42)
    expect(observed).toBe(42)
  })

  it("should cache first usage of `$`", () => {
    const state = new State({ foo: { bar: 1 } })
    expect(state.$.foo.$.bar === state.$.foo.$.bar).toBe(true)
  })

  it("should preserve nested proxy identity consistency", () => {
    const state = new State({ x: { y: { z: 5 } } })
    expect(state.$.x).toBeInstanceOf(State)
    expect(state.$.x.$.y).toBeInstanceOf(State)
    expect(state.$.x.$.y.use()).toEqual({ z: 5 })
  })

  it("should correctly propagate changes from nested $ to top level proxy", () => {
    const state = new State({ a: { b: 1 } })
    state.$.a.$.b.set(2)
    expect(state.$.a.$.b.current).toBe(2)
  })
})
