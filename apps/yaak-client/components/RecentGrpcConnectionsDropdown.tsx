import type { GrpcConnection } from "@yaakapp-internal/models";
import { deleteModel } from "@yaakapp-internal/models";
import { HStack, Icon } from "@yaakapp-internal/ui";
import { formatDistanceToNowStrict } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useDeleteGrpcConnections } from "../hooks/useDeleteGrpcConnections";
import { Dropdown } from "./core/Dropdown";
import { IconButton } from "./core/IconButton";

interface Props {
  connections: GrpcConnection[];
  activeConnection: GrpcConnection;
  onPinnedConnectionId: (id: string) => void;
}

export function RecentGrpcConnectionsDropdown({
  activeConnection,
  connections,
  onPinnedConnectionId,
}: Props) {
  const { t, i18n } = useTranslation();
  const deleteAllConnections = useDeleteGrpcConnections(activeConnection?.requestId);
  const latestConnectionId = connections[0]?.id ?? "n/a";

  return (
    <Dropdown
      items={[
        {
          label: t("request:protocol.clearConnection"),
          onSelect: () => deleteModel(activeConnection),
          disabled: connections.length === 0,
        },
        {
          label: t("request:protocol.clearConnections", { count: connections.length }),
          onSelect: deleteAllConnections.mutate,
          hidden: connections.length <= 1,
          disabled: connections.length === 0,
        },
        { type: "separator", label: t("common:history") },
        ...connections.map((c) => ({
          label: (
            <HStack space={2}>
              {formatDistanceToNowStrict(`${c.createdAt}Z`, {
                addSuffix: true,
                locale: i18n.resolvedLanguage === "zh-CN" ? zhCN : enUS,
              })}{" "}
              &bull; <span className="font-mono text-sm">{c.elapsed}ms</span>
            </HStack>
          ),
          leftSlot: activeConnection?.id === c.id ? <Icon icon="check" /> : <Icon icon="empty" />,
          onSelect: () => onPinnedConnectionId(c.id),
        })),
      ]}
    >
      <IconButton
        title={t("request:protocol.showConnectionHistory")}
        icon={activeConnection?.id === latestConnectionId ? "history" : "pin"}
        className="m-0.5 text-text-subtle"
        size="sm"
        iconSize="md"
      />
    </Dropdown>
  );
}
