import { userContext } from "../UserContext";

export const getEntityName = (multiple?: boolean): string => {
  if (userContext.apiType === "Mongo") {
    return multiple ? "documents" : "document";
  }

  return multiple ? "items" : "item";
};
