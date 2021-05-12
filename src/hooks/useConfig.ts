import { useEffect, useState } from "react";
import { ConfigContext, initializeConfiguration, intialConfigContext } from "../ConfigContext";

// This hook initializes global configuration from a config.json file that is injected at deploy time
// This allows the same main Data Explorer build to be exactly the same in all clouds/platforms,
// but override some of the configuration as nesssary
export function useConfig(): Readonly<ConfigContext> {
  const [state, setState] = useState<ConfigContext>(intialConfigContext);

  useEffect(() => {
    initializeConfiguration().then((response) => setState(response));
  }, []);
  return state;
}
