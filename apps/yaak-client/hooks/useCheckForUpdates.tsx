import { useMutation } from "@tanstack/react-query";
import { InlineCode } from "@yaakapp-internal/ui";
import { showAlert } from "../lib/alert";
import { appInfo } from "../lib/appInfo";
import { minPromiseMillis } from "../lib/minPromiseMillis";
import { invokeCmd } from "../lib/tauri";
import { useTranslation } from "react-i18next";

export function useCheckForUpdates() {
  const { t } = useTranslation();
  return useMutation({
    mutationKey: ["check_for_updates"],
    mutationFn: async () => {
      const hasUpdate: boolean = await minPromiseMillis(invokeCmd("cmd_check_for_updates"), 500);
      if (!hasUpdate) {
        showAlert({
          id: "no-updates",
          title: t("common:updates.noneAvailable"),
          body: (
            <>
              {t("common:updates.latestVersion")} <InlineCode>{appInfo.version}</InlineCode>
            </>
          ),
        });
      }
    },
  });
}
