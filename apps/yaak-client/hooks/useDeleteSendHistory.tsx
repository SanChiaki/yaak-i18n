import {
  grpcConnectionsAtom,
  httpResponsesAtom,
  websocketConnectionsAtom,
} from "@yaakapp-internal/models";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { showAlert } from "../lib/alert";
import { showConfirmDelete } from "../lib/confirm";
import { jotaiStore } from "../lib/jotai";
import { invokeCmd } from "../lib/tauri";
import { activeWorkspaceIdAtom } from "./useActiveWorkspace";
import { useFastMutation } from "./useFastMutation";

export function useDeleteSendHistory() {
  const { t } = useTranslation();
  const httpResponses = useAtomValue(httpResponsesAtom);
  const grpcConnections = useAtomValue(grpcConnectionsAtom);
  const websocketConnections = useAtomValue(websocketConnectionsAtom);

  const labels = [
    httpResponses.length > 0
      ? t("common:historyTypes.httpResponses", { count: httpResponses.length })
      : null,
    grpcConnections.length > 0
      ? t("common:historyTypes.grpcConnections", { count: grpcConnections.length })
      : null,
    websocketConnections.length > 0
      ? t("common:historyTypes.websocketConnections", { count: websocketConnections.length })
      : null,
  ].filter((l) => l != null);

  return useFastMutation({
    mutationKey: ["delete_send_history", labels],
    mutationFn: async () => {
      if (labels.length === 0) {
        showAlert({
          id: "no-responses",
          title: t("common:historyTypes.nothingToDelete"),
          body: t("common:historyTypes.empty"),
        });
        return;
      }

      const confirmed = await showConfirmDelete({
        id: "delete-send-history",
        title: t("workspace:workspace.clearSendHistory"),
        description: t("common:historyTypes.deleteConfirm", {
          items: labels.join(` ${t("common:and")} `),
        }),
      });
      if (!confirmed) return false;

      const workspaceId = jotaiStore.get(activeWorkspaceIdAtom);
      await invokeCmd("cmd_delete_send_history", { workspaceId });
      return true;
    },
  });
}
