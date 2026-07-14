import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translations
import commonEN from "./locales/en/common.json";
import settingsEN from "./locales/en/settings.json";
import requestEN from "./locales/en/request.json";
import workspaceEN from "./locales/en/workspace.json";
import errorsEN from "./locales/en/errors.json";

import commonZH from "./locales/zh-CN/common.json";
import settingsZH from "./locales/zh-CN/settings.json";
import requestZH from "./locales/zh-CN/request.json";
import workspaceZH from "./locales/zh-CN/workspace.json";
import errorsZH from "./locales/zh-CN/errors.json";

// Define resources
const resources = {
  en: {
    common: commonEN,
    settings: settingsEN,
    request: requestEN,
    workspace: workspaceEN,
    errors: errorsEN,
  },
  "zh-CN": {
    common: commonZH,
    settings: settingsZH,
    request: requestZH,
    workspace: workspaceZH,
    errors: errorsZH,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "settings", "request", "workspace", "errors"],

  interpolation: {
    escapeValue: false, // React already escapes values
  },

  react: {
    useSuspense: false,
  },
});

export default i18n;
