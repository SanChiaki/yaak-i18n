import { createWorkspaceModel } from "@yaakapp-internal/models";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToggle } from "../hooks/useToggle";
import { ColorIndicator } from "./ColorIndicator";
import { Button } from "./core/Button";
import { Checkbox } from "./core/Checkbox";
import { ColorPickerWithThemeColors } from "./core/ColorPicker";
import { Label } from "./core/Label";
import { PlainInput } from "./core/PlainInput";

interface Props {
  onCreate: (id: string) => void;
  hide: () => void;
  workspaceId: string;
}

export function CreateEnvironmentDialog({ workspaceId, hide, onCreate }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState<string>("");
  const [color, setColor] = useState<string | null>(null);
  const [sharable, toggleSharable] = useToggle(false);
  return (
    <form
      className="pb-3 flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const id = await createWorkspaceModel({
          model: "environment",
          name,
          color,
          variables: [],
          public: sharable,
          workspaceId,
          parentModel: "environment",
        });
        hide();
        onCreate(id);
      }}
    >
      <PlainInput
        label={t("workspace:environment.name")}
        required
        defaultValue={name}
        onChange={setName}
        placeholder={t("workspace:environment.namePlaceholder")}
      />
      <Checkbox
        checked={sharable}
        title={t("workspace:environment.share")}
        help={t("workspace:environment.shareDescription")}
        onChange={toggleSharable}
      />
      <div>
        <Label
          htmlFor="color"
          className="mb-1.5"
          help={t("workspace:environment.colorDescription")}
        >
          {t("workspace:environment.color")}
        </Label>
        <ColorPickerWithThemeColors onChange={setColor} color={color} />
      </div>
      <Button type="submit" color="secondary" className="mt-3">
        {color != null && <ColorIndicator color={color} />}
        {t("workspace:environment.create")}
      </Button>
    </form>
  );
}
