import { useQuery } from "@tanstack/react-query";
import type { HttpRequest } from "@yaakapp-internal/models";
import type {
  CallHttpRequestActionRequest,
  GetHttpRequestActionsResponse,
  HttpRequestAction,
} from "@yaakapp-internal/plugins";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { localizePluginText } from "../lib/localizePluginText";
import { invokeCmd } from "../lib/tauri";
import { usePluginsKey } from "./usePlugins";

export type CallableHttpRequestAction = Pick<HttpRequestAction, "label" | "icon"> & {
  call: (httpRequest: HttpRequest) => Promise<void>;
};

export function useHttpRequestActions() {
  const { i18n } = useTranslation();
  const pluginsKey = usePluginsKey();

  const actionsResult = useQuery<CallableHttpRequestAction[]>({
    queryKey: ["http_request_actions", pluginsKey],
    queryFn: () => getHttpRequestActions(),
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

export async function getHttpRequestActions() {
  const responses = await invokeCmd<GetHttpRequestActionsResponse[]>("cmd_http_request_actions");
  const actions = responses.flatMap((r) =>
    r.actions.map((a, i) => ({
      label: a.label,
      icon: a.icon,
      call: async (httpRequest: HttpRequest) => {
        const payload: CallHttpRequestActionRequest = {
          index: i,
          pluginRefId: r.pluginRefId,
          args: { httpRequest },
        };
        await invokeCmd("cmd_call_http_request_action", { req: payload });
      },
    })),
  );

  return actions;
}
