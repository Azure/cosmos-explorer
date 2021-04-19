import { Observable } from "knockout";
import { useEffect, useState } from "react";

export function useObservable<T>(observable: Pick<Observable<T>, "subscribe" | "peek">): T {
  const [, setValue] = useState(0);

  useEffect(() => {
    const subscription = observable.subscribe(() => setValue((n) => 1 + n), undefined, "change");
    return () => subscription.dispose();
  }, [observable]);

  return observable.peek();
}
