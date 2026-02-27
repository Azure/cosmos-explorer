import "i18next";
import Resources from "../Localization/en/Resources.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "Resources";
    resources: {
      Resources: typeof Resources;
    };
  }
}
