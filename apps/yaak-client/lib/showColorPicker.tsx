import type { Environment } from "@yaakapp-internal/models";
import { patchModel } from "@yaakapp-internal/models";
import { EnvironmentColorPicker } from "../components/EnvironmentColorPicker";
import i18n from "../i18n";
import { showDialog } from "./dialog";

export function showColorPicker(environment: Environment) {
  showDialog({
    title: i18n.t("workspace:environment.color"),
    id: "color-picker",
    size: "sm",
    render: ({ hide }) => {
      return (
        <EnvironmentColorPicker
          color={environment.color}
          onChange={async (color) => {
            await patchModel(environment, { color });
            hide();
          }}
        />
      );
    },
  });
}
