import { readFileSync } from "node:fs";
import { describe, expect, test } from "vite-plus/test";

const repoRoot = new URL("../../../", import.meta.url);
const unsignedWorkflow = readFileSync(
  new URL(".github/workflows/build-test.yml", repoRoot),
  "utf8",
);
const releaseWorkflow = readFileSync(
  new URL(".github/workflows/release-app.yml", repoRoot),
  "utf8",
);

describe("app build workflows", () => {
  test("the unsigned build enables Tauri bundling", () => {
    expect(unsignedWorkflow).toContain("--config ./tauri.test.conf.json");
  });

  test("the unsigned build installs dependencies before invoking Tauri", () => {
    expect(unsignedWorkflow).toContain("run: vp install");
  });

  test("the unsigned build does not create a GitHub release", () => {
    expect(unsignedWorkflow).not.toContain("tagName:");
    expect(unsignedWorkflow).not.toContain("releaseDraft:");
  });

  test("artifact uploads use the repository target directory", () => {
    expect(unsignedWorkflow).toContain("target/**/release/bundle");
    expect(unsignedWorkflow).not.toContain("src-tauri/target");
  });

  test("test tags do not run the signed release workflow", () => {
    expect(releaseWorkflow).toContain("!endsWith(github.ref_name, '-test')");
  });
});
