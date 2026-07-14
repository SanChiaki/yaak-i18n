import { type } from "@tauri-apps/plugin-os";
import { useFonts } from "@yaakapp-internal/fonts";
import { useLicense } from "@yaakapp-internal/license";
import type { EditorKeymap, Settings } from "@yaakapp-internal/models";
import { patchModel, settingsAtom } from "@yaakapp-internal/models";
import { clamp, Heading, VStack } from "@yaakapp-internal/ui";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { activeWorkspaceAtom } from "../../hooks/useActiveWorkspace";
import { showConfirm } from "../../lib/confirm";
import { languagePreferenceFromSelect, languagePreferenceToSelect } from "../../lib/language";
import { invokeCmd } from "../../lib/tauri";
import { CargoFeature } from "../CargoFeature";
import { Button } from "../core/Button";
import { Checkbox } from "../core/Checkbox";
import { Link } from "../core/Link";
import {
  ModelSettingRowBoolean,
  ModelSettingRowSelect,
  SettingRow,
  SettingRowBoolean,
  SettingRowSelect,
  SettingSelectControl,
  SettingsList,
  SettingsSection,
} from "../core/SettingRow";

const NULL_FONT_VALUE = "__NULL_FONT__";

const fontSizeOptions = [
  8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
].map((n) => ({ label: `${n}`, value: `${n}` }));

export function SettingsInterface() {
  const workspace = useAtomValue(activeWorkspaceAtom);
  const settings = useAtomValue(settingsAtom);
  const fonts = useFonts();
  const { t } = useTranslation();

  if (settings == null || workspace == null) {
    return null;
  }

  const displayLanguage = languagePreferenceToSelect(settings.language);
  const keymaps: { value: EditorKeymap; label: string }[] = [
    { value: "default", label: t("settings:interface.editor.defaultKeymap") },
    { value: "vim", label: "Vim" },
    { value: "vscode", label: "VSCode" },
    { value: "emacs", label: "Emacs" },
  ];

  return (
    <VStack space={1.5} className="mb-4">
      <div className="mb-3">
        <Heading>{t("settings:interface.title")}</Heading>
        <p className="text-text-subtle">{t("settings:interface.description")}</p>
      </div>
      <SettingsList className="space-y-8">
        <SettingsSection title={t("settings:language.title")}>
          <SettingRowSelect
            title={t("settings:language.label")}
            description={t("settings:language.description")}
            name="language"
            value={displayLanguage}
            onChange={async (v) => {
              const preference = languagePreferenceFromSelect(v);
              await patchModel(settings, { language: preference });
            }}
            options={[
              { label: t("settings:language.auto"), value: "auto" },
              { label: t("settings:language.en"), value: "en" },
              { label: t("settings:language.zhCN"), value: "zh-CN" },
            ]}
          />
        </SettingsSection>

        <SettingsSection title={t("settings:interface.workspaces.title")}>
          <SettingRowSelect
            title={t("settings:interface.workspaces.behavior")}
            description={t("settings:interface.workspaces.description")}
            name="switchWorkspaceBehavior"
            value={
              settings.openWorkspaceNewWindow === true
                ? "new"
                : settings.openWorkspaceNewWindow === false
                  ? "current"
                  : "ask"
            }
            onChange={async (v) => {
              if (v === "current") await patchModel(settings, { openWorkspaceNewWindow: false });
              else if (v === "new") await patchModel(settings, { openWorkspaceNewWindow: true });
              else await patchModel(settings, { openWorkspaceNewWindow: null });
            }}
            options={[
              { label: t("settings:interface.workspaces.ask"), value: "ask" },
              { label: t("settings:interface.workspaces.current"), value: "current" },
              { label: t("settings:interface.workspaces.new"), value: "new" },
            ]}
          />
        </SettingsSection>

        <SettingsSection title={t("settings:interface.fonts.title")}>
          <SettingRow
            title={t("settings:interface.fonts.interface")}
            description={t("settings:interface.fonts.interfaceDescription")}
            controlClassName="gap-1"
          >
            {fonts.data && (
              <SettingSelectControl
                name="uiFont"
                label={t("settings:interface.fonts.interface")}
                selectClassName="!w-72"
                value={settings.interfaceFont ?? NULL_FONT_VALUE}
                defaultValue={NULL_FONT_VALUE}
                options={[
                  { label: t("settings:interface.fonts.systemDefault"), value: NULL_FONT_VALUE },
                  ...fonts.data.uiFonts.map((f) => ({ label: f, value: f })),
                  ...fonts.data.editorFonts.map((f) => ({ label: f, value: f })),
                ]}
                onChange={async (v) => {
                  const interfaceFont = v === NULL_FONT_VALUE ? null : v;
                  await patchModel(settings, { interfaceFont });
                }}
              />
            )}
            <SettingSelectControl
              name="interfaceFontSize"
              label={t("settings:interface.fonts.interfaceSize")}
              selectClassName="!w-20"
              value={`${settings.interfaceFontSize}`}
              defaultValue="14"
              options={fontSizeOptions}
              onChange={(v) => patchModel(settings, { interfaceFontSize: Number.parseInt(v, 10) })}
            />
          </SettingRow>

          <SettingRow
            title={t("settings:interface.fonts.editor")}
            description={t("settings:interface.fonts.editorDescription")}
            controlClassName="gap-1"
          >
            {fonts.data && (
              <SettingSelectControl
                name="editorFont"
                label={t("settings:interface.fonts.editor")}
                selectClassName="!w-72"
                value={settings.editorFont ?? NULL_FONT_VALUE}
                defaultValue={NULL_FONT_VALUE}
                options={[
                  { label: t("settings:interface.fonts.systemDefault"), value: NULL_FONT_VALUE },
                  ...fonts.data.editorFonts.map((f) => ({ label: f, value: f })),
                ]}
                onChange={async (v) => {
                  const editorFont = v === NULL_FONT_VALUE ? null : v;
                  await patchModel(settings, { editorFont });
                }}
              />
            )}
            <SettingSelectControl
              name="editorFontSize"
              label={t("settings:interface.fonts.editorSize")}
              selectClassName="!w-20"
              value={`${settings.editorFontSize}`}
              defaultValue="12"
              options={fontSizeOptions}
              onChange={(v) =>
                patchModel(settings, {
                  editorFontSize: clamp(Number.parseInt(v, 10) || 14, 8, 30),
                })
              }
            />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title={t("settings:interface.editor.title")}>
          <ModelSettingRowSelect
            model={settings}
            modelKey="editorKeymap"
            title={t("settings:interface.editor.keymap")}
            description={t("settings:interface.editor.keymapDescription")}
            options={keymaps}
          />
          <ModelSettingRowBoolean
            model={settings}
            modelKey="editorSoftWrap"
            title={t("settings:interface.editor.softWrap")}
            description={t("settings:interface.editor.softWrapDescription")}
          />
          <ModelSettingRowBoolean
            model={settings}
            modelKey="coloredMethods"
            title={t("settings:interface.editor.coloredMethods")}
            description={t("settings:interface.editor.coloredMethodsDescription")}
          />
        </SettingsSection>

        <SettingsSection title={t("settings:interface.window.title")}>
          <NativeTitlebarSetting settings={settings} />
          {type() !== "macos" && (
            <ModelSettingRowBoolean
              model={settings}
              modelKey="hideWindowControls"
              title={t("settings:interface.window.hideControls")}
              description={t("settings:interface.window.hideControlsDescription")}
            />
          )}
        </SettingsSection>

        <CargoFeature feature="license">
          <LicenseSettings settings={settings} />
        </CargoFeature>
      </SettingsList>
    </VStack>
  );
}

function NativeTitlebarSetting({ settings }: { settings: Settings }) {
  const [nativeTitlebar, setNativeTitlebar] = useState(settings.useNativeTitlebar);
  const { t } = useTranslation();

  return (
    <SettingRow
      title={t("settings:interface.window.nativeTitlebar")}
      description={t("settings:interface.window.nativeTitlebarDescription")}
      controlClassName="gap-2"
    >
      <Checkbox
        hideLabel
        size="md"
        checked={nativeTitlebar}
        title={t("settings:interface.window.nativeTitlebar")}
        onChange={setNativeTitlebar}
      />
      {settings.useNativeTitlebar !== nativeTitlebar && (
        <Button
          color="primary"
          size="xs"
          onClick={async () => {
            await patchModel(settings, { useNativeTitlebar: nativeTitlebar });
            await invokeCmd("cmd_restart");
          }}
        >
          {t("settings:interface.window.applyRestart")}
        </Button>
      )}
    </SettingRow>
  );
}

function LicenseSettings({ settings }: { settings: Settings }) {
  const license = useLicense();
  const { t } = useTranslation();
  if (license.check.data?.status !== "personal_use") {
    return null;
  }

  return (
    <SettingsSection title={t("settings:interface.personalUse.section")}>
      <SettingRowBoolean
        checked={settings.hideLicenseBadge}
        title={t("settings:interface.personalUse.hideBadge")}
        description={t("settings:interface.personalUse.hideBadgeDescription")}
        onChange={async (hideLicenseBadge) => {
          if (hideLicenseBadge) {
            const confirmed = await showConfirm({
              id: "hide-license-badge",
              title: t("settings:interface.personalUse.confirmTitle"),
              confirmText: t("settings:interface.personalUse.confirm"),
              description: (
                <VStack space={3}>
                  <p>{t("settings:interface.personalUse.greeting")}</p>
                  <p>
                    {t("settings:interface.personalUse.freeForPersonal")}{" "}
                    <strong>{t("settings:interface.personalUse.workRequiresLicense")}</strong>
                  </p>
                  <p>
                    {t("settings:interface.personalUse.supportMessage")}{" "}
                    <Link href="https://yaak.app/pricing?s=badge">
                      {t("settings:interface.personalUse.purchase")}
                    </Link>
                  </p>
                </VStack>
              ),
              requireTyping: t("settings:interface.personalUse.requiredText"),
              color: "info",
            });
            if (!confirmed) {
              return;
            }
          }
          await patchModel(settings, { hideLicenseBadge });
        }}
      />
    </SettingsSection>
  );
}
