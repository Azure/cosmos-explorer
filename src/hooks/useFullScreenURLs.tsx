import { useEffect, useState } from "react";
import { GenerateTokenResponse } from "../Contracts/DataModels";
import * as AuthHeadersUtil from "../Platform/Hosted/Authorization";

export function useFullScreenURLs(): GenerateTokenResponse | undefined {
  const [state, setState] = useState<GenerateTokenResponse>();

  useEffect(() => {
    Promise.all([AuthHeadersUtil.generateEncryptedToken(), AuthHeadersUtil.generateEncryptedToken(true)]).then(
      ([readWriteResponse, readOnlyResponse]) =>
        setState({
          readWrite: readWriteResponse.readWrite,
          read: readOnlyResponse.read,
        })
    );
  }, []);
  return state;
}
