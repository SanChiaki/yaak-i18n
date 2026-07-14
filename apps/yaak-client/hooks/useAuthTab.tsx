import type { Folder } from "@yaakapp-internal/models";
import { modelTypeLabel, patchModel } from "@yaakapp-internal/models";
import { HStack, Icon, InlineCode } from "@yaakapp-internal/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { localizePluginText } from "../lib/localizePluginText";
import { openFolderSettings } from "../commands/openFolderSettings";
import { openWorkspaceSettings } from "../commands/openWorkspaceSettings";
import { IconTooltip } from "../components/core/IconTooltip";
import type { TabItem } from "../components/core/Tabs/Tabs";
import { capitalize } from "../lib/capitalize";
import { showConfirm } from "../lib/confirm";
import { resolvedModelName } from "../lib/resolvedModelName";
import { useHttpAuthenticationSummaries } from "./useHttpAuthentication";
import type { AuthenticatedModel } from "./useInheritedAuthentication";
import { useInheritedAuthentication } from "./useInheritedAuthentication";
import { useModelAncestors } from "./useModelAncestors";

export function useAuthTab<T extends string>(tabValue: T, model: AuthenticatedModel | null) {
  const { t } = useTranslation();
  const authentication = useHttpAuthenticationSummaries();
  const inheritedAuth = useInheritedAuthentication(model);
  const ancestors = useModelAncestors(model);
  const parentModel = ancestors[0] ?? null;

  return useMemo<TabItem[]>(() => {
    if (model == null) return [];

    const tab: TabItem = {
      value: tabValue,
      label: t("request:request.auth"),
      options: {
        value: model.authenticationType,
        items: [
          ...authentication.map((a) => ({
            label: a.label ? localizePluginText(a.label) : t("common:unknown"),
            shortLabel:
              typeof a.shortLabel === "string" ? localizePluginText(a.shortLabel) : a.shortLabel,
            value: a.name,
          })),
          { type: "separator" },
          {
            label: t("request:request.authSettings.inherit"),
            shortLabel:
              inheritedAuth != null && inheritedAuth.authenticationType !== "none" ? (
                <HStack space={1.5}>
                  {authentication.find((a) => a.name === inheritedAuth.authenticationType)
                    ?.shortLabel ?? t("common:unknown")}
                  <IconTooltip
                    icon="zap_off"
                    iconSize="xs"
                    content={t("request:request.authSettings.inherited")}
                  />
                </HStack>
              ) : (
                t("request:request.auth")
              ),
            value: null,
          },
          {
            label: t("request:request.authSettings.none"),
            shortLabel: t("request:request.authSettings.none"),
            value: "none",
          },
        ],
        itemsAfter: (() => {
          const actions: (
            | { type: "separator"; label: string }
            | { label: string; leftSlot: React.ReactNode; onSelect: () => Promise<void> }
          )[] = [];

          // Promote: move auth from current model up to parent
          if (
            parentModel &&
            model.authenticationType &&
            model.authenticationType !== "none" &&
            (parentModel.authenticationType == null || parentModel.authenticationType === "none")
          ) {
            actions.push(
              { type: "separator", label: t("request:request.authSettings.actions") },
              {
                label: t("request:request.authSettings.promoteTo", {
                  model: capitalize(parentModel.model),
                }),
                leftSlot: (
                  <Icon
                    icon={parentModel.model === "workspace" ? "corner_right_up" : "folder_up"}
                  />
                ),
                onSelect: async () => {
                  const confirmed = await showConfirm({
                    id: "promote-auth-confirm",
                    title: t("request:request.authSettings.promoteTitle"),
                    confirmText: t("request:request.authSettings.promote"),
                    description: t("request:request.authSettings.promoteDescription", {
                      name: resolvedModelName(parentModel),
                    }),
                  });
                  if (confirmed) {
                    await patchModel(model, { authentication: {}, authenticationType: null });
                    await patchModel(parentModel, {
                      authentication: model.authentication,
                      authenticationType: model.authenticationType,
                    });

                    if (parentModel.model === "folder") {
                      openFolderSettings(parentModel.id, "auth");
                    } else {
                      openWorkspaceSettings("auth");
                    }
                  }
                },
              },
            );
          }

          // Copy from ancestor: copy auth config down to current model
          const ancestorWithAuth = ancestors.find(
            (a) => a.authenticationType != null && a.authenticationType !== "none",
          );
          if (ancestorWithAuth) {
            if (actions.length === 0) {
              actions.push({
                type: "separator",
                label: t("request:request.authSettings.actions"),
              });
            }
            actions.push({
              label: t("request:request.authSettings.copyFrom", {
                model: modelTypeLabel(ancestorWithAuth),
              }),
              leftSlot: (
                <Icon
                  icon={
                    ancestorWithAuth.model === "workspace" ? "corner_right_down" : "folder_down"
                  }
                />
              ),
              onSelect: async () => {
                const confirmed = await showConfirm({
                  id: "copy-auth-confirm",
                  title: t("request:request.authSettings.copyTitle"),
                  confirmText: t("common:copy"),
                  description: t("request:request.authSettings.copyDescription", {
                    authentication:
                      authentication.find((a) => a.name === ancestorWithAuth.authenticationType)
                        ?.label ?? t("request:request.auth"),
                    name: resolvedModelName(ancestorWithAuth),
                  }),
                });
                if (confirmed) {
                  await patchModel(model, {
                    authentication: { ...ancestorWithAuth.authentication },
                    authenticationType: ancestorWithAuth.authenticationType,
                  });
                }
              },
            });
          }

          return actions.length > 0 ? actions : undefined;
        })(),
        onChange: async (authenticationType) => {
          let authentication: Folder["authentication"] = model.authentication;
          if (model.authenticationType !== authenticationType) {
            authentication = {
              // Reset auth if changing types
            };
          }
          await patchModel(model, { authentication, authenticationType });
        },
      },
    };

    return [tab];
  }, [authentication, inheritedAuth, model, parentModel, tabValue, ancestors, t]);
}
