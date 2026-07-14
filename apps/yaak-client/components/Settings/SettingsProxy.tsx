import { patchModel, settingsAtom } from "@yaakapp-internal/models";
import type { ProxySetting } from "@yaakapp-internal/models";
import { Heading, InlineCode, VStack } from "@yaakapp-internal/ui";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import {
  SettingRowBoolean,
  SettingRowSelect,
  SettingRowText,
  SettingsList,
  SettingsSection,
} from "../core/SettingRow";

export function SettingsProxy() {
  const settings = useAtomValue(settingsAtom);
  const proxy = enabledProxyOrDefault(settings.proxy);
  const { t } = useTranslation();

  const patchProxy = async (patch: Partial<EnabledProxySetting>) => {
    await patchModel(settings, {
      proxy: {
        ...proxy,
        ...patch,
        auth: Object.hasOwn(patch, "auth") ? (patch.auth ?? null) : proxy.auth,
      },
    });
  };

  return (
    <VStack space={1.5} className="mb-4">
      <div className="mb-3">
        <Heading>{t("settings:proxy.title")}</Heading>
        <p className="text-text-subtle">{t("settings:proxy.description")}</p>
      </div>
      <SettingsList className="space-y-8">
        <SettingsSection title={t("settings:proxy.section")}>
          <SettingRowSelect
            title={t("settings:proxy.mode")}
            description={t("settings:proxy.modeDescription")}
            name="proxy"
            value={settings.proxy?.type ?? "automatic"}
            onChange={async (v) => {
              if (v === "automatic") {
                await patchModel(settings, { proxy: undefined });
              } else if (v === "enabled") {
                await patchModel(settings, { proxy });
              } else {
                await patchModel(settings, { proxy: { type: "disabled" } });
              }
            }}
            options={[
              { label: t("settings:proxy.automatic"), value: "automatic" },
              { label: t("settings:proxy.custom"), value: "enabled" },
              { label: t("settings:proxy.none"), value: "disabled" },
            ]}
            selectClassName="!w-64"
          />
        </SettingsSection>

        {settings.proxy?.type === "enabled" && (
          <>
            <SettingsSection title={t("settings:proxy.customSection")}>
              <SettingRowBoolean
                checked={!settings.proxy.disabled}
                title={t("settings:proxy.enable")}
                description={t("settings:proxy.enableDescription")}
                onChange={(enabled) => patchProxy({ disabled: !enabled })}
              />
              <SettingRowText
                name="proxyHttp"
                title={
                  <>
                    {t("settings:proxy.httpTraffic")} <InlineCode>http://</InlineCode>
                  </>
                }
                description={t("settings:proxy.httpDescription")}
                value={settings.proxy.http}
                placeholder="localhost:9090"
                onChange={(http) => patchProxy({ http })}
              />
              <SettingRowText
                name="proxyHttps"
                title={
                  <>
                    {t("settings:proxy.httpsTraffic")} <InlineCode>https://</InlineCode>
                  </>
                }
                description={t("settings:proxy.httpsDescription")}
                value={settings.proxy.https}
                placeholder="localhost:9090"
                onChange={(https) => patchProxy({ https })}
              />
              <SettingRowText
                name="proxyBypass"
                title={t("settings:proxy.bypass")}
                description={t("settings:proxy.bypassDescription")}
                value={settings.proxy.bypass}
                placeholder="127.0.0.1, *.example.com, localhost:3000"
                inputWidthClassName="!w-96"
                onChange={(bypass) => patchProxy({ bypass })}
              />
            </SettingsSection>

            <SettingsSection title={t("settings:proxy.authentication")}>
              <SettingRowBoolean
                checked={settings.proxy.auth != null}
                title={t("settings:proxy.enableAuthentication")}
                description={t("settings:proxy.enableAuthenticationDescription")}
                onChange={(enabled) =>
                  patchProxy({ auth: enabled ? { user: "", password: "" } : null })
                }
              />

              {settings.proxy.auth != null && (
                <>
                  <SettingRowText
                    required
                    name="proxyUser"
                    title={t("settings:proxy.user")}
                    description={t("settings:proxy.userDescription")}
                    value={settings.proxy.auth.user}
                    placeholder="myUser"
                    onChange={(user) =>
                      patchProxy({
                        auth: {
                          user,
                          password:
                            settings.proxy?.type === "enabled"
                              ? (settings.proxy.auth?.password ?? "")
                              : "",
                        },
                      })
                    }
                  />
                  <SettingRowText
                    name="proxyPassword"
                    title={t("settings:proxy.password")}
                    description={t("settings:proxy.passwordDescription")}
                    value={settings.proxy.auth.password}
                    placeholder="s3cretPassw0rd"
                    type="password"
                    onChange={(password) =>
                      patchProxy({
                        auth: {
                          user:
                            settings.proxy?.type === "enabled"
                              ? (settings.proxy.auth?.user ?? "")
                              : "",
                          password,
                        },
                      })
                    }
                  />
                </>
              )}
            </SettingsSection>
          </>
        )}
      </SettingsList>
    </VStack>
  );
}

type EnabledProxySetting = Extract<ProxySetting, { type: "enabled" }>;

function enabledProxyOrDefault(proxy: ProxySetting | null): EnabledProxySetting {
  if (proxy?.type === "enabled") return proxy;

  return {
    disabled: false,
    type: "enabled",
    http: "",
    https: "",
    auth: { user: "", password: "" },
    bypass: "",
  };
}
