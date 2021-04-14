import { isObservableArray, Observable, ObservableArray } from "knockout";
import { useEffect, useState } from "react";

export function useObservableState<T>(observable: Observable<T>): [T, (s: T) => void];
export function useObservableState<T>(observable: ObservableArray<T>): [T[], (s: T[]) => void];
export function useObservableState<T>(observable: ObservableArray<T> | Observable<T>): [T | T[], (s: T | T[]) => void] {
  const [value, setValue] = useState(observable());

  useEffect(() => {
    isObservableArray(observable)
      ? observable.subscribe((values) => setValue([...values]))
      : observable.subscribe(setValue);
  }, [observable]);

  return [value, observable];
}
