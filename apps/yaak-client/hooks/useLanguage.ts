import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAtomValue } from "jotai";
import { patchModel, settingsAtom } from "@yaakapp-internal/models";
import { locale } from "@tauri-apps/plugin-os";

export function useLanguage() {
  const { i18n } = useTranslation();
  const settings = useAtomValue(settingsAtom);

  useEffect(() => {
    async function initLanguage() {
      if (!settings) return;

      // Priority: user setting > system locale > fallback (en)
      let targetLanguage = settings.language;

      if (!targetLanguage || targetLanguage === "auto") {
        // Detect system locale
        try {
          const systemLocale = await locale();
          if (systemLocale) {
            // Map system locale to supported languages
            if (
              systemLocale.startsWith("zh-CN") ||
              systemLocale.startsWith("zh-Hans") ||
              systemLocale.startsWith("zh-SG")
            ) {
              targetLanguage = "zh-CN";
            } else {
              targetLanguage = "en";
            }
          } else {
            targetLanguage = "en";
          }
        } catch {
          targetLanguage = "en";
        }
      }

      if (i18n.language !== targetLanguage) {
        await i18n.changeLanguage(targetLanguage);
      }
    }

    initLanguage();
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
