import "i18next";
import common from "./locales/en/common.json";
import settings from "./locales/en/settings.json";
import request from "./locales/en/request.json";
import workspace from "./locales/en/workspace.json";
import errors from "./locales/en/errors.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof common;
      settings: typeof settings;
      request: typeof request;
      workspace: typeof workspace;
      errors: typeof errors;
    };
  }
}
