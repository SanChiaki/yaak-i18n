import type { UncommittedChangesStrategy } from "@yaakapp-internal/git";
import { showConfirm } from "../../lib/confirm";
import i18n from "../../i18n";

export async function promptUncommittedChangesStrategy(): Promise<UncommittedChangesStrategy> {
  const confirmed = await showConfirm({
    id: "git-uncommitted-changes",
    title: i18n.t("workspace:git.uncommittedChanges"),
    description: i18n.t("workspace:git.uncommittedDescription"),
    confirmText: i18n.t("workspace:git.resetAndPull"),
    color: "danger",
  });
  return confirmed ? "reset" : "cancel";
}
