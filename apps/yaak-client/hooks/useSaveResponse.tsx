import { save } from "@tauri-apps/plugin-dialog";
import type { HttpResponse } from "@yaakapp-internal/models";
import { getModel } from "@yaakapp-internal/models";
import slugify from "slugify";
import { InlineCode } from "@yaakapp-internal/ui";
import { getResponseSaveInfo } from "../lib/model_util";
import { invokeCmd } from "../lib/tauri";
import { showToast } from "../lib/toast";
import { useFastMutation } from "./useFastMutation";
import { useTranslation } from "react-i18next";

export function useSaveResponse(response: HttpResponse) {
  const { t } = useTranslation();
  return useFastMutation({
    mutationKey: ["save_response", response.id],
    mutationFn: async () => {
      const request = getModel("http_request", response.requestId);
      if (request == null) return null;

      const slug = slugify(request.name || "response", { lower: true }) || "response";
      const { filename, fileExtension } = getResponseSaveInfo(response.headers, slug);
      const filepath = await save({
        defaultPath: filename,
        filters: fileExtension
          ? [{ name: fileExtension.toUpperCase(), extensions: [fileExtension] }]
          : undefined,
        title: t("request:response.saveResponse"),
      });
      if (filepath == null) return null;
      await invokeCmd("cmd_save_response", { responseId: response.id, filepath });
      showToast({
        message: (
          <>
            {t("request:response.savedTo")} <InlineCode>{filepath}</InlineCode>
          </>
        ),
      });
    },
  });
}
