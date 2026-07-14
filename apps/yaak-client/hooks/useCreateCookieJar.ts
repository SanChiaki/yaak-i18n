import { createWorkspaceModel } from "@yaakapp-internal/models";
import { jotaiStore } from "../lib/jotai";
import { showPrompt } from "../lib/prompt";
import { setWorkspaceSearchParams } from "../lib/setWorkspaceSearchParams";
import { activeWorkspaceIdAtom } from "./useActiveWorkspace";
import { useFastMutation } from "./useFastMutation";
import { useTranslation } from "react-i18next";

export function useCreateCookieJar() {
  const { t } = useTranslation();
  return useFastMutation({
    mutationKey: ["create_cookie_jar"],
    mutationFn: async () => {
      const workspaceId = jotaiStore.get(activeWorkspaceIdAtom);
      if (workspaceId == null) {
        throw new Error("Cannot create cookie jar when there's no active workspace");
      }

      const name = await showPrompt({
        id: "new-cookie-jar",
        title: t("workspace:cookieJar.new"),
        placeholder: t("workspace:cookieJar.defaultName"),
        confirmText: t("common:create"),
        label: t("common:name"),
        defaultValue: t("workspace:cookieJar.defaultName"),
      });
      if (name == null) return null;

      return createWorkspaceModel({ model: "cookie_jar", workspaceId, name });
    },
    onSuccess: async (cookieJarId) => {
      setWorkspaceSearchParams({ cookie_jar_id: cookieJarId });
    },
  });
}
