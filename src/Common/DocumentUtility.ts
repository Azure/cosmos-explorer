import { userContext } from "../UserContext";

export const getEntityName = (): string => {
  if (userContext.apiType === "Mongo") {
    return "document";
  }

  return "item";
};
