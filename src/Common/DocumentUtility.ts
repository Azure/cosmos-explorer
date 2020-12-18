import { DefaultAccountExperienceType } from "../DefaultAccountExperienceType";
import { userContext } from "../UserContext";

export const getEntityName = (): string => {
  if (userContext.defaultExperience === DefaultAccountExperienceType.MongoDB) {
    return "document";
  }

  return "item";
};
