import type { DivergedStrategy } from "@yaakapp-internal/git";
import { HStack, InlineCode } from "@yaakapp-internal/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { showDialog } from "../../lib/dialog";
import { Button } from "../core/Button";
import { RadioCards } from "../core/RadioCards";
import i18n from "../../i18n";

type Resolution = "force_reset" | "merge";

interface DivergedDialogProps {
  remote: string;
  branch: string;
  onResult: (strategy: DivergedStrategy) => void;
  onHide: () => void;
}

function DivergedDialog({ remote, branch, onResult, onHide }: DivergedDialogProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Resolution | null>(null);

  const handleSubmit = () => {
    if (selected == null) return;
    onResult(selected);
    onHide();
  };

  const handleCancel = () => {
    onResult("cancel");
    onHide();
  };

  return (
    <div className="flex flex-col gap-4 mb-4">
      <p className="text-text-subtle">
        {t("workspace:git.divergedFrom")}{" "}
        <InlineCode>
          {remote}/{branch}
        </InlineCode>
        {t("workspace:git.resolvePrompt")}
      </p>
      <RadioCards
        name="diverged-strategy"
        value={selected}
        onChange={setSelected}
        options={[
          {
            value: "merge",
            label: t("workspace:git.mergeCommit"),
            description: t("workspace:git.mergeCommitDescription"),
          },
          {
            value: "force_reset",
            label: t("workspace:git.forcePull"),
            description: t("workspace:git.forcePullDescription"),
          },
        ]}
      />
      <HStack space={2} justifyContent="start" className="flex-row-reverse">
        <Button
          color={selected === "force_reset" ? "danger" : "primary"}
          disabled={selected == null}
          onClick={handleSubmit}
        >
          {selected === "force_reset"
            ? t("workspace:git.forcePull")
            : selected === "merge"
              ? t("workspace:git.merge")
              : t("common:ui.selectOption")}
        </Button>
        <Button variant="border" onClick={handleCancel}>
          {t("common:cancel")}
        </Button>
      </HStack>
    </div>
  );
}

export async function promptDivergedStrategy({
  remote,
  branch,
}: {
  remote: string;
  branch: string;
}): Promise<DivergedStrategy> {
  return new Promise((resolve) => {
    showDialog({
      id: "git-diverged",
      title: i18n.t("workspace:git.branchesDiverged"),
      hideX: true,
      size: "sm",
      disableBackdropClose: true,
      onClose: () => resolve("cancel"),
      render: ({ hide }) =>
        DivergedDialog({
          remote,
          branch,
          onHide: hide,
          onResult: resolve,
        }),
    });
  });
}
