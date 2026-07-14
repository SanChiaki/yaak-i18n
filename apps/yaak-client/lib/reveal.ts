import { type } from "@tauri-apps/plugin-os";
import i18n from "../i18n";

const os = type();
export function revealInFinderText() {
  return os === "macos"
    ? i18n.t("common:reveal.finder")
    : os === "windows"
      ? i18n.t("common:reveal.explorer")
      : i18n.t("common:reveal.fileManager");
}
