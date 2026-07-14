import { openUrl } from "@tauri-apps/plugin-opener";
import { useLicense } from "@yaakapp-internal/license";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { openSettings } from "../commands/openSettings";
import { useCheckForUpdates } from "../hooks/useCheckForUpdates";
import { useExportData } from "../hooks/useExportData";
import { appInfo } from "../lib/appInfo";
import { showDialog } from "../lib/dialog";
import { importData } from "../lib/importData";
import type { DropdownRef } from "./core/Dropdown";
import { Dropdown } from "./core/Dropdown";
import { Icon } from "@yaakapp-internal/ui";
import { IconButton } from "./core/IconButton";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";

export function SettingsDropdown() {
  const { t } = useTranslation();
  const exportData = useExportData();
  const dropdownRef = useRef<DropdownRef>(null);
  const checkForUpdates = useCheckForUpdates();
  const { check } = useLicense();

  return (
    <Dropdown
      ref={dropdownRef}
      items={[
        {
          label: t("common:menu.settings"),
          hotKeyAction: "settings.show",
          leftSlot: <Icon icon="settings" />,
          onSelect: () => openSettings.mutate(null),
        },
        {
          label: t("common:menu.keyboardShortcuts"),
          hotKeyAction: "hotkeys.showHelp",
          leftSlot: <Icon icon="keyboard" />,
          onSelect: () => {
            showDialog({
              id: "hotkey",
              title: t("common:menu.keyboardShortcuts"),
              size: "dynamic",
              render: () => <KeyboardShortcutsDialog />,
            });
          },
        },
        {
          label: t("common:menu.plugins"),
          leftSlot: <Icon icon="puzzle" />,
          onSelect: () => openSettings.mutate("plugins"),
        },
        { type: "separator", label: t("common:menu.shareWorkspaces") },
        {
          label: t("common:menu.importData"),
          leftSlot: <Icon icon="folder_input" />,
          onSelect: () => importData.mutate(),
        },
        {
          label: t("common:menu.exportData"),
          leftSlot: <Icon icon="folder_output" />,
          onSelect: () => exportData.mutate(),
        },
        {
          label: t("common:menu.createRunButton"),
          leftSlot: <Icon icon="rocket" />,
          onSelect: () => openUrl("https://yaak.app/button/new"),
        },
        { type: "separator", label: `Yaak v${appInfo.version}` },
        {
          label: t("common:menu.checkForUpdates"),
          leftSlot: <Icon icon="update" />,
          hidden: !appInfo.featureUpdater,
          onSelect: () => checkForUpdates.mutate(),
        },
        {
          label: t("common:menu.purchaseLicense"),
          color: "success",
          hidden: check.data == null || check.data.status === "active",
          leftSlot: <Icon icon="circle_dollar_sign" />,
          rightSlot: <Icon icon="external_link" color="success" className="opacity-60" />,
          onSelect: () => openUrl("https://yaak.app/pricing"),
        },
        {
          label: t("common:menu.installCli"),
          hidden: appInfo.cliVersion != null,
          leftSlot: <Icon icon="square_terminal" />,
          rightSlot: <Icon icon="external_link" color="secondary" />,
          onSelect: () => openUrl("https://yaak.app/docs/cli"),
        },
        {
          label: t("common:menu.feedback"),
          leftSlot: <Icon icon="chat" />,
          rightSlot: <Icon icon="external_link" color="secondary" />,
          onSelect: () => openUrl("https://yaak.app/feedback"),
        },
        {
          label: t("common:menu.changelog"),
          leftSlot: <Icon icon="cake" />,
          rightSlot: <Icon icon="external_link" color="secondary" />,
          onSelect: () => openUrl(`https://yaak.app/changelog/${appInfo.version}`),
        },
      ]}
    >
      <IconButton
        size="sm"
        title={t("common:menu.main")}
        icon="settings"
        iconColor="secondary"
        className="pointer-events-auto"
      />
    </Dropdown>
  );
}
