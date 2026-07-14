import { afterEach, describe, expect, test } from "vite-plus/test";
import i18n from "../i18n";
import { builtInPluginTextKeys, localizePluginText } from "./localizePluginText";

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("plugin text localization", () => {
  test("defines every built-in plugin translation in each supported language", () => {
    for (const language of ["en", "zh-CN"]) {
      for (const [sourceText, translationKey] of Object.entries(builtInPluginTextKeys)) {
        expect(i18n.exists(translationKey, { lng: language }), `${language}: ${sourceText}`).toBe(
          true,
        );
      }
    }
  });

  test("localizes known built-in plugin text", async () => {
    await i18n.changeLanguage("zh-CN");

    expect(localizePluginText("API Key")).toBe("API 密钥");
    expect(localizePluginText("Authorization URL")).toBe("授权 URL");
    expect(localizePluginText("Send All")).toBe("全部发送");
    expect(localizePluginText("Encode a value to base64")).toBe("将值编码为 Base64");
  });

  test("localizes dynamic built-in plugin messages", async () => {
    await i18n.changeLanguage("zh-CN");

    expect(localizePluginText("Sent 1 request")).toBe("已发送 1 个请求");
    expect(localizePluginText("Sent 3 requests")).toBe("已发送 3 个请求");
    expect(localizePluginText("Sent 2, failed 1")).toBe("已发送 2 个，失败 1 个");
  });

  test("preserves unknown third-party plugin text", async () => {
    await i18n.changeLanguage("zh-CN");

    expect(localizePluginText("Custom Plugin Action")).toBe("Custom Plugin Action");
  });
});
