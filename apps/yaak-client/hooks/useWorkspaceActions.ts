import { useQuery } from "@tanstack/react-query";
import type { Workspace } from "@yaakapp-internal/models";
import type {
  CallWorkspaceActionRequest,
  GetWorkspaceActionsResponse,
  WorkspaceAction,
} from "@yaakapp-internal/plugins";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { localizePluginText } from "../lib/localizePluginText";
import { invokeCmd } from "../lib/tauri";
import { usePluginsKey } from "./usePlugins";

export type CallableWorkspaceAction = Pick<WorkspaceAction, "label" | "icon"> & {
  call: (workspace: Workspace) => Promise<void>;
};

export function useWorkspaceActions() {
  const { i18n } = useTranslation();
  const pluginsKey = usePluginsKey();

  const actionsResult = useQuery<CallableWorkspaceAction[]>({
    queryKey: ["workspace_actions", pluginsKey],
    queryFn: () => getWorkspaceActions(),
  });

  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const actions = useMemo(() => {
    return (actionsResult.data ?? []).map((action) => ({
      ...action,
      label: localizePluginText(action.label),
    }));
  }, [actionsResult.data, i18n.resolvedLanguage]);

  return actions;
}

export async function getWorkspaceActions() {
  const responses = await invokeCmd<GetWorkspaceActionsResponse[]>("cmd_workspace_actions");
  const actions = responses.flatMap((r) =>
    r.actions.map((a, i) => ({
      label: a.label,
      icon: a.icon,
      call: async (workspace: Workspace) => {
        const payload: CallWorkspaceActionRequest = {
          index: i,
          pluginRefId: r.pluginRefId,
          args: { workspace },
        };
        await invokeCmd("cmd_call_workspace_action", { req: payload });
      },
    })),
  );

  return actions;
}
