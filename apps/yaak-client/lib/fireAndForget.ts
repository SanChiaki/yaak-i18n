import { showErrorToast } from "./toast";
import i18n from "../i18n";

/**
 * Handles a fire-and-forget promise by catching and reporting errors
 * via console.error and a toast notification.
 */
export function fireAndForget(promise: Promise<unknown>) {
  promise.catch((err: unknown) => {
    console.error("Unhandled async error:", err);
    showErrorToast({
      id: "async-error",
      title: i18n.t("common:unexpectedError"),
      message: err instanceof Error ? err.message : String(err),
    });
  });
}
