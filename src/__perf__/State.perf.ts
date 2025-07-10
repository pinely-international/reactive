/* eslint-disable @typescript-eslint/no-unused-expressions */



import { barplot, bench, group, run } from "mitata"

import { State } from "../state/State"

group("State", () => {

  barplot(() => {
    bench("$", () => {
      const state = new State({ foo: { bar: [-11, 2, 3] }, test1: 123, test2: 123 })
      state.$.test1
    })
    bench("to", () => {
      const state = new State({ foo: { bar: [-11, 2, 3] }, test1: 123, test2: 123 })
      state.to(state => state.test2)
    })
  })
})

await run({

})