import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { settingsAtom } from "@yaakapp-internal/models";
import { resolveLanguagePreference } from "../lib/language";

export function useLanguage() {
  const { i18n } = useTranslation();
  const settings = useAtomValue(settingsAtom);

  useEffect(() => {
    let cancelled = false;

    void resolveLanguagePreference(settings.language).then(async (targetLanguage) => {
      if (!cancelled && i18n.resolvedLanguage !== targetLanguage) {
        await i18n.changeLanguage(targetLanguage);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [settings?.language, i18n]);
}
