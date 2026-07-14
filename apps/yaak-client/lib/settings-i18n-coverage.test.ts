import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vite-plus/test";

describe("Settings translations", () => {
  test("translation keys stay in sync and visible English is not hardcoded", () => {
    const script = fileURLToPath(
      new URL("../../../scripts/analyze-translation-coverage.js", import.meta.url),
    );
    const result = spawnSync(process.execPath, [script], { encoding: "utf8" });

    expect(`${result.stdout}${result.stderr}`).toContain("Hardcoded user-facing English: 0");
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
  });
});
