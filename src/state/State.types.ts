import { ObservableGetter } from "@/Flow"


export type StateLike<T> = ObservableGetter<T>
export type StateOrPlain<T> = T | StateLike<T>
