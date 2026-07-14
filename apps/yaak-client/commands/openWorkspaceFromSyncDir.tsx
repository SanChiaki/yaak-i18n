import { applySync, calculateSyncFsOnly } from "@yaakapp-internal/sync";
import { createFastMutation } from "../hooks/useFastMutation";
import i18n from "../i18n";
import { showSimpleAlert } from "../lib/alert";
import { router } from "../lib/router";

export const openWorkspaceFromSyncDir = createFastMutation<void, void, string>({
  mutationKey: [],
  mutationFn: async (dir) => {
    const ops = await calculateSyncFsOnly(dir);

    const workspace = ops
      .map((o) => (o.type === "dbCreate" && o.fs.model.type === "workspace" ? o.fs.model : null))
      .filter((m) => m)[0];

    if (workspace == null) {
      showSimpleAlert(
        i18n.t("workspace:sync.openFailed"),
        i18n.t("workspace:sync.workspaceNotFound"),
      );
      return;
    }

    await applySync(workspace.id, dir, ops);

    await router.navigate({
      to: "/workspaces/$workspaceId",
      params: { workspaceId: workspace.id },
    });
  },
});
