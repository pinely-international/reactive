import { describe, expect, it } from "bun:test"

import { StateArray } from "@/state/StateArray"

import { State } from "../state/State"


describe("StateArray", () => {
  it("should return fromAsync", async () => {
    const { resolve, promise } = Promise.withResolvers<number[]>()

    const stateArray = StateArray.fromAsync(new State(promise))
    expect(stateArray.get()).toEqual([])

    resolve([1, 2, 3])
    await promise
    expect(stateArray.get()).toEqual([1, 2, 3])
  })

  it("should return fromAsync 2", async () => {
    const state = new State([1, 2, 3]).to(async x => x)
    const stateArray = StateArray.fromAsync(state)
    expect(stateArray.get()).toEqual([])

    await state.current
    expect(stateArray.get()).toEqual([1, 2, 3])
  })
})
