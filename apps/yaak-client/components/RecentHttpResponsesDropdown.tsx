import type { HttpResponse } from "@yaakapp-internal/models";
import { deleteModel } from "@yaakapp-internal/models";
import { HStack, Icon } from "@yaakapp-internal/ui";
import { useTranslation } from "react-i18next";
import { useCopyHttpResponse } from "../hooks/useCopyHttpResponse";
import { useDeleteHttpResponses } from "../hooks/useDeleteHttpResponses";
import { useSaveResponse } from "../hooks/useSaveResponse";
import { Dropdown } from "./core/Dropdown";
import { HttpStatusTag } from "./core/HttpStatusTag";
import { IconButton } from "./core/IconButton";

interface Props {
  responses: HttpResponse[];
  activeResponse: HttpResponse;
  onPinnedResponseId: (id: string) => void;
  className?: string;
}

export const RecentHttpResponsesDropdown = function ResponsePane({
  activeResponse,
  responses,
  onPinnedResponseId,
}: Props) {
  const { t } = useTranslation();
  const deleteAllResponses = useDeleteHttpResponses(activeResponse?.requestId);
  const latestResponseId = responses[0]?.id ?? "n/a";
  const saveResponse = useSaveResponse(activeResponse);
  const copyResponse = useCopyHttpResponse(activeResponse);

  return (
    <Dropdown
      items={[
        {
          label: t("request:response.saveToFile"),
          onSelect: saveResponse.mutate,
          leftSlot: <Icon icon="save" />,
          hidden: responses.length === 0 || !!activeResponse.error,
          disabled: activeResponse.state !== "closed" && activeResponse.status >= 100,
        },
        {
          label: t("request:response.copyBody"),
          onSelect: copyResponse.mutate,
          leftSlot: <Icon icon="copy" />,
          hidden: responses.length === 0 || !!activeResponse.error,
          disabled: activeResponse.state !== "closed" && activeResponse.status >= 100,
        },
        {
          label: t("common:delete"),
          leftSlot: <Icon icon="trash" />,
          onSelect: () => deleteModel(activeResponse),
        },
        {
          label: t("request:response.unpin"),
          onSelect: () => onPinnedResponseId(activeResponse.id),
          leftSlot: <Icon icon="unpin" />,
          hidden: latestResponseId === activeResponse.id,
          disabled: responses.length === 0,
        },
        { type: "separator", label: t("common:history") },
        {
          label: t("request:response.deleteHistory", { count: responses.length }),
          onSelect: deleteAllResponses.mutate,
          hidden: responses.length === 0,
          disabled: responses.length === 0,
        },
        { type: "separator" },
        ...responses.map((r: HttpResponse) => ({
          label: (
            <HStack space={2}>
              <HttpStatusTag short className="text-xs" response={r} />
              <span className="text-text-subtle">&rarr;</span>{" "}
              <span className="font-mono text-sm">{r.elapsed >= 0 ? `${r.elapsed}ms` : "n/a"}</span>
            </HStack>
          ),
          leftSlot: activeResponse?.id === r.id ? <Icon icon="check" /> : <Icon icon="empty" />,
          onSelect: () => onPinnedResponseId(r.id),
        })),
      ]}
    >
      <IconButton
        title={t("request:response.showHistory")}
        icon={activeResponse?.id === latestResponseId ? "history" : "pin"}
        className="m-0.5 text-text-subtle"
        size="sm"
        iconSize="md"
      />
    </Dropdown>
  );
};
