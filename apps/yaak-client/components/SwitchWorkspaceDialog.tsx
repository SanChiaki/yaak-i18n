import type { Workspace } from "@yaakapp-internal/models";
import { patchModel, settingsAtom } from "@yaakapp-internal/models";
import { HStack, Icon, InlineCode, VStack } from "@yaakapp-internal/ui";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { switchWorkspace } from "../commands/switchWorkspace";
import { Button } from "./core/Button";
import { Checkbox } from "./core/Checkbox";

interface Props {
  hide: () => void;
  workspace: Workspace;
}

export function SwitchWorkspaceDialog({ hide, workspace }: Props) {
  const { t } = useTranslation();
  const settings = useAtomValue(settingsAtom);
  const [remember, setRemember] = useState<boolean>(false);

  return (
    <VStack space={3}>
      <p>{t("workspace:switchDialog.prompt", { name: workspace.name })}</p>
      <HStack space={2} justifyContent="start" className="flex-row-reverse">
        <Button
          className="focus"
          color="primary"
          onClick={async () => {
            hide();
            switchWorkspace.mutate({ workspaceId: workspace.id, inNewWindow: false });
            if (remember) {
              await patchModel(settings, { openWorkspaceNewWindow: false });
            }
          }}
        >
          {t("workspace:switchDialog.thisWindow")}
        </Button>
        <Button
          className="focus"
          color="secondary"
          rightSlot={<Icon icon="external_link" />}
          onClick={async () => {
            hide();
            switchWorkspace.mutate({ workspaceId: workspace.id, inNewWindow: true });
            if (remember) {
              await patchModel(settings, { openWorkspaceNewWindow: true });
            }
          }}
        >
          {t("workspace:switchDialog.newWindow")}
        </Button>
      </HStack>
      {settings && (
        <HStack justifyContent="end">
          <Checkbox
            checked={remember}
            title={t("workspace:switchDialog.remember")}
            onChange={setRemember}
          />
        </HStack>
      )}
    </VStack>
  );
}
