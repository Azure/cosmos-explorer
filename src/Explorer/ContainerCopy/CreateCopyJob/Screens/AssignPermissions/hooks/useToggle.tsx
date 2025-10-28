import { useCallback, useState } from "react";

const useToggle = (initialState = false) => {
  const [state, setState] = useState<boolean>(initialState);
  const onToggle = useCallback((_, checked?: boolean) => {
    setState(!!checked);
  }, []);
  return [state, onToggle] as const;
};

export default useToggle;
