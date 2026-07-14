import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAtomValue } from "jotai";
import { patchModel, settingsAtom } from "@yaakapp-internal/models";
import { locale } from "@tauri-apps/plugin-os";

export function useLanguage() {
  const { i18n } = useTranslation();
  const settings = useAtomValue(settingsAtom);
  const lastLanguageRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    async function initLanguage() {
      if (!settings) return;

      // Only run if the language setting has actually changed
      if (lastLanguageRef.current === settings.language) {
        return;
      }
      lastLanguageRef.current = settings.language;

      // Priority: user setting > system locale > fallback (en)
      let targetLanguage = settings.language;

      if (!targetLanguage || targetLanguage === "auto") {
        // Detect system locale
        try {
          const systemLocale = await locale();
          console.log("System locale detected:", systemLocale);
          if (systemLocale) {
            // Map system locale to supported languages
            if (
              systemLocale.startsWith("zh-CN") ||
              systemLocale.startsWith("zh-Hans") ||
              systemLocale.startsWith("zh-SG") ||
              systemLocale === "zh-Hans-CN"
            ) {
              targetLanguage = "zh-CN";
            } else {
              targetLanguage = "en";
            }
          } else {
            targetLanguage = "en";
          }
        } catch (error) {
          console.error("Failed to detect system locale:", error);
          targetLanguage = "en";
        }
      }

      console.log("Target language:", targetLanguage, "Current language:", i18n.language);
      if (i18n.language !== targetLanguage) {
        await i18n.changeLanguage(targetLanguage);
      }
    }

    void initLanguage();
  }, [settings?.language, i18n]);

  const changeLanguage = async (language: string) => {
    if (!settings) return;

    await i18n.changeLanguage(language);
    await patchModel(settings, { language });
  };

  return {
    currentLanguage: i18n.language,
    changeLanguage,
  };
}
