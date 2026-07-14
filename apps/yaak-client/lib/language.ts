import { locale } from "@tauri-apps/plugin-os";

export type SupportedLanguage = "en" | "zh-CN";
export type LanguagePreference = SupportedLanguage | null;
export type LanguageSelectValue = SupportedLanguage | "auto";

export function languagePreferenceFromSelect(value: string): LanguagePreference {
  if (value === "auto") return null;
  if (value === "en" || value === "zh-CN") return value;
  throw new Error(`Unsupported language selection: ${value}`);
}

export function languagePreferenceToSelect(
  preference: string | null | undefined,
): LanguageSelectValue {
  return preference === "en" || preference === "zh-CN" ? preference : "auto";
}

export function languageFromSystemLocale(systemLocale: string | null): SupportedLanguage {
  const normalized = systemLocale?.replaceAll("_", "-").toLowerCase();
  if (
    normalized === "zh" ||
    normalized?.startsWith("zh-cn") ||
    normalized?.startsWith("zh-hans") ||
    normalized?.startsWith("zh-sg")
  ) {
    return "zh-CN";
  }
  return "en";
}

export async function resolveLanguagePreference(
  preference: string | null | undefined,
): Promise<SupportedLanguage> {
  if (preference === "en" || preference === "zh-CN") return preference;
  if (preference != null && preference !== "auto") return "en";

  try {
    return languageFromSystemLocale(await locale());
  } catch (error) {
    console.error("Failed to detect system locale", error);
    return "en";
  }
}
