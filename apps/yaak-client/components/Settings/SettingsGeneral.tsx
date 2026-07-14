import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { patchModel, settingsAtom } from "@yaakapp-internal/models";
import { Heading, VStack } from "@yaakapp-internal/ui";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { activeWorkspaceAtom } from "../../hooks/useActiveWorkspace";
import { useCheckForUpdates } from "../../hooks/useCheckForUpdates";
import { appInfo } from "../../lib/appInfo";
import {
  SETTING_FOLLOW_REDIRECTS,
  SETTING_REQUEST_TIMEOUT,
  SETTING_SEND_COOKIES,
  SETTING_STORE_COOKIES,
  SETTING_VALIDATE_CERTIFICATES,
} from "../../lib/requestSettings";
import { revealInFinderText } from "../../lib/reveal";
import { CargoFeature } from "../CargoFeature";
import { IconButton } from "../core/IconButton";
import {
  ModelSettingRowBoolean,
  ModelSettingRowNumber,
  ModelSettingSelectControl,
  SettingValue,
  SettingRow,
  SettingRowBoolean,
  SettingRowSelect,
  SettingsList,
  SettingsSection,
} from "../core/SettingRow";

export function SettingsGeneral() {
  const workspace = useAtomValue(activeWorkspaceAtom);
  const settings = useAtomValue(settingsAtom);
  const checkForUpdates = useCheckForUpdates();
  const { t } = useTranslation();

  if (settings == null || workspace == null) {
    return null;
  }

  return (
    <VStack space={1.5} className="mb-4">
      <div className="mb-4">
        <Heading>{t("settings:general.title")}</Heading>
        <p className="text-text-subtle">{t("settings:general.description")}</p>
      </div>
      <SettingsList className="space-y-8">
        <CargoFeature feature="updater">
          <SettingsSection title={t("settings:updates.title")}>
            <SettingRow
              title={t("settings:updates.channel.title")}
              description={t("settings:updates.channel.description")}
            >
              <div className="grid grid-cols-[12rem_auto] gap-1">
                <ModelSettingSelectControl
                  model={settings}
                  modelKey="updateChannel"
                  label={t("settings:updates.channel.title")}
                  selectClassName="!w-full"
                  options={[
                    { label: t("settings:updates.channel.stable"), value: "stable" },
                    { label: t("settings:updates.channel.beta"), value: "beta" },
                  ]}
                />
                <IconButton
                  variant="border"
                  size="sm"
                  title={t("settings:updates.checkForUpdates")}
                  icon="refresh"
                  spin={checkForUpdates.isPending}
                  onClick={() => checkForUpdates.mutateAsync()}
                />
              </div>
            </SettingRow>

            <SettingRowSelect
              title={t("settings:updates.behavior.title")}
              description={t("settings:updates.behavior.description")}
              name="autoupdate"
              value={settings.autoupdate ? "auto" : "manual"}
              onChange={(v) => patchModel(settings, { autoupdate: v === "auto" })}
              options={[
                { label: t("settings:updates.behavior.auto"), value: "auto" },
                { label: t("settings:updates.behavior.manual"), value: "manual" },
              ]}
            />

            <ModelSettingRowBoolean
              model={settings}
              modelKey="autoDownloadUpdates"
              title={t("settings:updates.autoDownload.title")}
              description={t("settings:updates.autoDownload.description")}
              disabled={!settings.autoupdate}
            />

            <ModelSettingRowBoolean
              model={settings}
              modelKey="checkNotifications"
              title={t("settings:updates.notifications.title")}
              description={t("settings:updates.notifications.description")}
            />

            <SettingRowBoolean
              title={t("settings:updates.analytics.title")}
              description={t("settings:updates.analytics.description")}
              disabled
              checked={false}
              onChange={() => {}}
            />
          </SettingsSection>
        </CargoFeature>

        <SettingsSection
          title={
            <>
              {t("settings:general.workspace")}{" "}
              <span className="inline-block bg-surface-highlight px-2 py-0.5 rounded text">
                {workspace.name}
              </span>
            </>
          }
        >
          <ModelSettingRowNumber
            model={workspace}
            modelKey={SETTING_REQUEST_TIMEOUT.modelKey}
            title={t("settings:general.requestTimeout.title")}
            description={t("settings:general.requestTimeout.description")}
            placeholder={`${SETTING_REQUEST_TIMEOUT.defaultValue}`}
            required
            validate={(value) => Number.parseInt(value, 10) >= 0}
          />

          <ModelSettingRowBoolean
            model={workspace}
            modelKey={SETTING_VALIDATE_CERTIFICATES.modelKey}
            title={t("settings:general.validateCertificates.title")}
            description={t("settings:general.validateCertificates.description")}
          />

          <ModelSettingRowBoolean
            model={workspace}
            modelKey={SETTING_FOLLOW_REDIRECTS.modelKey}
            title={t("settings:general.followRedirects.title")}
            description={t("settings:general.followRedirects.description")}
          />

          <ModelSettingRowBoolean
            model={workspace}
            modelKey={SETTING_SEND_COOKIES.modelKey}
            title={t("settings:general.sendCookies.title")}
            description={t("settings:general.sendCookies.description")}
          />

          <ModelSettingRowBoolean
            model={workspace}
            modelKey={SETTING_STORE_COOKIES.modelKey}
            title={t("settings:general.storeCookies.title")}
            description={t("settings:general.storeCookies.description")}
          />
        </SettingsSection>

        <SettingsSection title={t("settings:general.appInfo.title")}>
          <SettingRow
            title={t("settings:general.appInfo.version")}
            description={t("settings:general.appInfo.versionDescription")}
          >
            <SettingValue value={appInfo.version} />
          </SettingRow>
          <SettingRow
            title={t("settings:general.appInfo.dataDirectory")}
            description={t("settings:general.appInfo.dataDirectoryDescription")}
            controlClassName="min-w-0 max-w-[min(42rem,55vw)] gap-2"
          >
            <SettingValue
              value={appInfo.appDataDir}
              actions={[
                {
                  title: revealInFinderText(),
                  icon: "folder_open",
                  onClick: () => revealItemInDir(appInfo.appDataDir),
                },
              ]}
            />
          </SettingRow>
          <SettingRow
            title={t("settings:general.appInfo.logsDirectory")}
            description={t("settings:general.appInfo.logsDirectoryDescription")}
            controlClassName="min-w-0 max-w-[min(42rem,55vw)] gap-2"
          >
            <SettingValue
              value={appInfo.appLogDir}
              actions={[
                {
                  title: revealInFinderText(),
                  icon: "folder_open",
                  onClick: () => revealItemInDir(appInfo.appLogDir),
                },
              ]}
            />
          </SettingRow>
        </SettingsSection>
      </SettingsList>
    </VStack>
  );
}
