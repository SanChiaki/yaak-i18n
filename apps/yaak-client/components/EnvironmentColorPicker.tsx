import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ColorIndicator } from "./ColorIndicator";
import { Banner } from "@yaakapp-internal/ui";
import { Button } from "./core/Button";
import { ColorPickerWithThemeColors } from "./core/ColorPicker";

export function EnvironmentColorPicker({
  color: defaultColor,
  onChange,
}: {
  color: string | null;
  onChange: (color: string | null) => void;
}) {
  const { t } = useTranslation();
  const [color, setColor] = useState<string | null>(defaultColor);
  return (
    <form
      className="flex flex-col items-stretch gap-5 pb-2 w-full"
      onSubmit={(e) => {
        e.preventDefault();
        onChange(color);
      }}
    >
      <Banner color="secondary">{t("workspace:environment.colorPickerDescription")}</Banner>
      <ColorPickerWithThemeColors color={color} onChange={setColor} />
      <Button type="submit" color="secondary">
        {color != null && <ColorIndicator color={color} />}
        {t("common:save")}
      </Button>
    </form>
  );
}
