import { describe, expect, test } from "vite-plus/test";
import { proxyLanguageForLocale } from "./i18n";

describe("proxy language detection", () => {
  test.each(["zh", "zh-CN", "zh_CN", "zh-Hans-CN", "zh-SG"])(
    "normalizes %s to Simplified Chinese",
    (locale) => {
      expect(proxyLanguageForLocale(locale)).toBe("zh-CN");
    },
  );

  test.each([null, "", "zh-Hant-TW", "en", "en-US", "fr-FR"])(
    "falls back to English for %s",
    (locale) => {
      expect(proxyLanguageForLocale(locale)).toBe("en");
    },
  );
});
