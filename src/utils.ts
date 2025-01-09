import { FlowRead } from "./Flow"

/** @internal */
export function isFlowRead(value: unknown): value is FlowRead<unknown> {
  return value instanceof Object && "get" in value && Symbol.subscribe in value
}