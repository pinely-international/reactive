import { ObservableLike } from "type-fest"

import { ObservableGetter } from "@/Flow"


export type StateLike<T> = ObservableGetter<T> | ObservableLike<T>
export type StateOrPlain<T> = T | StateLike<T>
