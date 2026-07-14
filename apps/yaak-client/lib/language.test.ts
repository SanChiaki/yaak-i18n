import { describe, expect, test } from "vite-plus/test";
import defaultCapability from "../../../crates-tauri/yaak-app-client/capabilities/default.json";
import {
  languageFromSystemLocale,
  languagePreferenceFromSelect,
  languagePreferenceToSelect,
} from "./language";

describe("language preferences", () => {
  test("allows the frontend to read the system locale", () => {
    expect(defaultCapability.permissions).toContain("os:allow-locale");
  });

  test.each([
    ["zh-CN", "zh-CN"],
    ["zh_CN", "zh-CN"],
    ["zh-Hans-CN", "zh-CN"],
    ["zh-Hans", "zh-CN"],
    ["zh-SG", "zh-CN"],
    ["zh-Hant-TW", "en"],
    ["en-US", "en"],
    [null, "en"],
  ] as const)("maps system locale %s to %s", (systemLocale, expected) => {
    expect(languageFromSystemLocale(systemLocale)).toBe(expected);
  });

  test("converts select values to persisted preferences", () => {
    expect(languagePreferenceFromSelect("auto")).toBeNull();
    expect(languagePreferenceFromSelect("en")).toBe("en");
    expect(languagePreferenceFromSelect("zh-CN")).toBe("zh-CN");
  });

  test("normalizes missing and legacy preferences for the select", () => {
    expect(languagePreferenceToSelect(null)).toBe("auto");
    expect(languagePreferenceToSelect("auto")).toBe("auto");
    expect(languagePreferenceToSelect("unsupported")).toBe("auto");
  });
});
