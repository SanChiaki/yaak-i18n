import type { GrpcRequest, HttpRequest, WebsocketRequest } from "@yaakapp-internal/models";
import { patchModel, workspacesAtom } from "@yaakapp-internal/models";
import { InlineCode, VStack } from "@yaakapp-internal/ui";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { resolvedModelName } from "../lib/resolvedModelName";
import { router } from "../lib/router";
import { showToast } from "../lib/toast";
import { Button } from "./core/Button";
import { Select } from "./core/Select";

interface Props {
  activeWorkspaceId: string;
  requests: (HttpRequest | GrpcRequest | WebsocketRequest)[];
  onDone: () => void;
}

export function MoveToWorkspaceDialog({ onDone, requests, activeWorkspaceId }: Props) {
  const { t } = useTranslation();
  const workspaces = useAtomValue(workspacesAtom);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(activeWorkspaceId);

  const targetWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);
  const isSameWorkspace = selectedWorkspaceId === activeWorkspaceId;

  return (
    <VStack space={4} className="mb-4">
      <Select
        label={t("workspace:move.targetWorkspace")}
        name="workspace"
        value={selectedWorkspaceId}
        onChange={setSelectedWorkspaceId}
        options={workspaces.map((w) => ({
          label: w.id === activeWorkspaceId ? `${w.name} ${t("workspace:move.current")}` : w.name,
          value: w.id,
        }))}
      />
      <Button
        color="primary"
        disabled={isSameWorkspace}
        onClick={async () => {
          const patch = {
            workspaceId: selectedWorkspaceId,
            folderId: null,
          };

          await Promise.all(requests.map((r) => patchModel(r, patch)));

          // Hide after a moment, to give time for requests to disappear
          setTimeout(onDone, 100);
          showToast({
            id: "workspace-moved",
            message:
              requests.length === 1 && requests[0] != null ? (
                <>
                  <InlineCode>{resolvedModelName(requests[0])}</InlineCode>{" "}
                  {t("workspace:move.movedTo")}{" "}
                  <InlineCode>{targetWorkspace?.name ?? t("common:unknown")}</InlineCode>
                </>
              ) : (
                <>
                  {t("request:request.count", { count: requests.length })}{" "}
                  {t("workspace:move.movedTo")}{" "}
                  <InlineCode>{targetWorkspace?.name ?? t("common:unknown")}</InlineCode>
                </>
              ),
            action: ({ hide }) => (
              <Button
                size="xs"
                color="secondary"
                className="mr-auto min-w-[5rem]"
                onClick={async () => {
                  await router.navigate({
                    to: "/workspaces/$workspaceId",
                    params: { workspaceId: selectedWorkspaceId },
                  });
                  hide();
                }}
              >
                {t("workspace:move.switchToWorkspace")}
              </Button>
            ),
          });
        }}
      >
        {requests.length === 1
          ? t("common:move")
          : t("workspace:move.moveRequests", { count: requests.length })}
      </Button>
    </VStack>
  );
}
