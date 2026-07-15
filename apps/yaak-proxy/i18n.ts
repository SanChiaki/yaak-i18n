import { locale } from "@tauri-apps/plugin-os";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import zhCn from "./locales/zh-CN.json";

export async function initI18n() {
  let language: "en" | "zh-CN" = "en";
  try {
    language = proxyLanguageForLocale(await locale());
  } catch (error) {
    console.error("Failed to detect system locale", error);
  }

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      "zh-CN": { translation: zhCn },
    },
    lng: language,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export function proxyLanguageForLocale(systemLocale: string | null): "en" | "zh-CN" {
  const normalized = systemLocale?.toLowerCase().replaceAll("_", "-") ?? "";
  if (
    normalized === "zh" ||
    normalized.startsWith("zh-cn") ||
    normalized.startsWith("zh-hans") ||
    normalized.startsWith("zh-sg")
  ) {
    return "zh-CN";
  }
  return "en";
}

export default i18n;
