import type { GrpcRequest, HttpRequest, WebsocketRequest } from "@yaakapp-internal/models";

import { MoveToWorkspaceDialog } from "../components/MoveToWorkspaceDialog";
import i18n from "../i18n";
import { activeWorkspaceIdAtom } from "../hooks/useActiveWorkspace";
import { createFastMutation } from "../hooks/useFastMutation";
import { showDialog } from "../lib/dialog";
import { jotaiStore } from "../lib/jotai";

export const moveToWorkspace = createFastMutation({
  mutationKey: ["move_workspace"],
  mutationFn: async (requests: (HttpRequest | GrpcRequest | WebsocketRequest)[]) => {
    const activeWorkspaceId = jotaiStore.get(activeWorkspaceIdAtom);
    if (activeWorkspaceId == null) return;
    if (requests.length === 0) return;

    const title = i18n.t("workspace:move.moveRequests", { count: requests.length });

    showDialog({
      id: "change-workspace",
      title,
      size: "sm",
      render: ({ hide }) => (
        <MoveToWorkspaceDialog
          onDone={hide}
          requests={requests}
          activeWorkspaceId={activeWorkspaceId}
        />
      ),
    });
  },
});
