import type { GitRemote } from "@yaakapp-internal/git";
import { gitMutations } from "@yaakapp-internal/git";
import { showPromptForm } from "../../lib/prompt-form";
import { gitCallbacks } from "./callbacks";
import i18n from "../../i18n";

export async function addGitRemote(dir: string, defaultName?: string): Promise<GitRemote> {
  const r = await showPromptForm({
    id: "add-remote",
    title: i18n.t("workspace:git.addRemote"),
    inputs: [
      { type: "text", label: i18n.t("common:name"), name: "name", defaultValue: defaultName },
      { type: "text", label: "URL", name: "url" },
    ],
  });
  if (r == null) throw new Error("Cancelled remote prompt");

  const name = String(r.name ?? "");
  const url = String(r.url ?? "");
  return gitMutations(dir, gitCallbacks(dir)).addRemote.mutateAsync({ name, url });
}
