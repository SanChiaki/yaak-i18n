import { useQuery } from "@tanstack/react-query";
import type { Folder } from "@yaakapp-internal/models";
import type {
  CallFolderActionRequest,
  FolderAction,
  GetFolderActionsResponse,
} from "@yaakapp-internal/plugins";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { localizePluginText } from "../lib/localizePluginText";
import { invokeCmd } from "../lib/tauri";
import { usePluginsKey } from "./usePlugins";

export type CallableFolderAction = Pick<FolderAction, "label" | "icon"> & {
  sourceLabel: string;
  call: (folder: Folder) => Promise<void>;
};

export function useFolderActions() {
  const { i18n } = useTranslation();
  const pluginsKey = usePluginsKey();

  const actionsResult = useQuery<CallableFolderAction[]>({
    queryKey: ["folder_actions", pluginsKey],
    queryFn: () => getFolderActions(),
  });

  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const actions = useMemo(() => {
    return (actionsResult.data ?? []).map((action) => ({
      ...action,
      label: localizePluginText(action.sourceLabel),
    }));
  }, [actionsResult.data, i18n.resolvedLanguage]);

  return actions;
}

export async function getFolderActions() {
  const responses = await invokeCmd<GetFolderActionsResponse[]>("cmd_folder_actions");
  const actions = responses.flatMap((r) =>
    r.actions.map((a, i) => ({
      label: a.label,
      sourceLabel: a.label,
      icon: a.icon,
      call: async (folder: Folder) => {
        const payload: CallFolderActionRequest = {
          index: i,
          pluginRefId: r.pluginRefId,
          args: { folder },
        };
        await invokeCmd("cmd_call_folder_action", { req: payload });
      },
    })),
  );

  return actions;
}
