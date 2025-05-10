import { AccessorGet, Observable, Subscriptable } from "@/types"
import { Ref } from "@/ValueReference"


export type Stateful<T> = Partial<Observable<T> & Subscriptable<T> & AccessorGet<T> & Ref<T>>
