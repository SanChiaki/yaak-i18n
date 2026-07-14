import { useQuery } from "@tanstack/react-query";
import type { WebsocketRequest } from "@yaakapp-internal/models";
import type {
  CallWebsocketRequestActionRequest,
  GetWebsocketRequestActionsResponse,
  WebsocketRequestAction,
} from "@yaakapp-internal/plugins";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { localizePluginText } from "../lib/localizePluginText";
import { invokeCmd } from "../lib/tauri";
import { usePluginsKey } from "./usePlugins";

export type CallableWebSocketRequestAction = Pick<WebsocketRequestAction, "label" | "icon"> & {
  call: (request: WebsocketRequest) => Promise<void>;
};

export function useWebsocketRequestActions() {
  const { i18n } = useTranslation();
  const pluginsKey = usePluginsKey();

  const actionsResult = useQuery<CallableWebSocketRequestAction[]>({
    queryKey: ["websocket_request_actions", pluginsKey],
    queryFn: () => getWebsocketRequestActions(),
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

export async function getWebsocketRequestActions() {
  const responses = await invokeCmd<GetWebsocketRequestActionsResponse[]>(
    "cmd_websocket_request_actions",
  );
  const actions = responses.flatMap((r) =>
    r.actions.map((a: WebsocketRequestAction, i: number) => ({
      label: a.label,
      icon: a.icon,
      call: async (websocketRequest: WebsocketRequest) => {
        const payload: CallWebsocketRequestActionRequest = {
          index: i,
          pluginRefId: r.pluginRefId,
          args: { websocketRequest },
        };
        await invokeCmd("cmd_call_websocket_request_action", { req: payload });
      },
    })),
  );

  return actions;
}
