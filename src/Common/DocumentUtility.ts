import { DefaultAccountExperienceType } from "../DefaultAccountExperienceType";
import { userContext } from "../UserContext";

export const getEntityName = (): string => {
  if (userContext.apiType === DefaultAccountExperienceType.MongoDB) {
    return "document";
  }

  return "item";
};
