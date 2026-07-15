import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { settingsAtom } from "@yaakapp-internal/models";
import { resolveLanguagePreference } from "../lib/language";
import { invokeCmd } from "../lib/tauri";

export function useLanguage() {
  const { i18n } = useTranslation();
  const settings = useAtomValue(settingsAtom);

  useEffect(() => {
    let cancelled = false;

    void resolveLanguagePreference(settings.language)
      .then(async (targetLanguage) => {
        if (cancelled) return;
        if (i18n.resolvedLanguage !== targetLanguage) {
          await i18n.changeLanguage(targetLanguage);
        }
        if (!cancelled) {
          await invokeCmd<void>("cmd_refresh_window_menu", { language: targetLanguage });
        }
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [settings?.language, i18n]);
}
