import { AccessorGet, Observable, Subscriptable } from "@/types"
import { Ref } from "@/ValueReference"


export type StateLike<T> = Observable<T> | Subscriptable<T> | AccessorGet<T> | Ref<T>
export type StateOrPlain<T> = T | StateLike<T>
