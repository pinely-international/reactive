import { ObservableGetter } from "@/Flow"
import { Ref } from "@/ValueReference"


export type StateLike<T> = ObservableGetter<T> | Ref<T>
export type StateOrPlain<T> = T | StateLike<T>
