import { NormalizedEventKey } from "Common/Constants";
import QueryError from "Common/QueryError";
import { useNotificationConsole } from "hooks/useNotificationConsole";
import React from "react";

export const ErrorList: React.FC<{ errors: QueryError[]; }> = ({ errors }) => {
  const onErrorDetailsClick = (): boolean => {
    useNotificationConsole.getState().expandConsole();

    return false;
  };

  const onErrorDetailsKeyPress = (event: React.KeyboardEvent<HTMLAnchorElement>): boolean => {
    if (event.key === NormalizedEventKey.Space || event.key === NormalizedEventKey.Enter) {
      onErrorDetailsClick();
      return false;
    }

    return true;
  };

  return <div>Ya dingus!</div>;
};
