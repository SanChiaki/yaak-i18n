import type { AnyModel, Workspace } from "@yaakapp-internal/models";

type ModelType = AnyModel["model"];

type WorkspaceRequestSettings = Pick<
  Workspace,
  | "settingFollowRedirects"
  | "settingRequestTimeout"
  | "settingSendCookies"
  | "settingStoreCookies"
  | "settingValidateCertificates"
>;

type ModelForType<T extends ModelType> = Extract<AnyModel, { model: T }>;

type ModelTypeWithSetting<K extends RequestSettingKey> = {
  [M in ModelType]: K extends keyof ModelForType<M> ? M : never;
}[ModelType];

export type RequestSettingDefinition<K extends RequestSettingKey = RequestSettingKey> = {
  defaultValue: WorkspaceRequestSettings[K];
  descriptionKey: string;
  modelKey: K;
  models: readonly ModelTypeWithSetting<K>[];
  titleKey: string;
};

export type RequestSettingKey = keyof WorkspaceRequestSettings;

function defineRequestSetting<const K extends RequestSettingKey>(
  setting: RequestSettingDefinition<K>,
) {
  return setting;
}

export const SETTING_REQUEST_TIMEOUT = defineRequestSetting({
  defaultValue: 0,
  descriptionKey: "settings:general.requestTimeout.description",
  modelKey: "settingRequestTimeout",
  models: ["workspace", "folder", "http_request"],
  titleKey: "settings:general.requestTimeout.title",
});

export const SETTING_VALIDATE_CERTIFICATES = defineRequestSetting({
  defaultValue: true,
  descriptionKey: "settings:general.validateCertificates.description",
  modelKey: "settingValidateCertificates",
  models: ["workspace", "folder", "http_request", "websocket_request", "grpc_request"],
  titleKey: "settings:general.validateCertificates.title",
});

export const SETTING_FOLLOW_REDIRECTS = defineRequestSetting({
  defaultValue: true,
  descriptionKey: "settings:general.followRedirects.description",
  modelKey: "settingFollowRedirects",
  models: ["workspace", "folder", "http_request"],
  titleKey: "settings:general.followRedirects.title",
});

export const SETTING_SEND_COOKIES = defineRequestSetting({
  defaultValue: true,
  descriptionKey: "settings:general.sendCookies.description",
  modelKey: "settingSendCookies",
  models: ["workspace", "folder", "http_request", "websocket_request"],
  titleKey: "settings:general.sendCookies.title",
});

export const SETTING_STORE_COOKIES = defineRequestSetting({
  defaultValue: true,
  descriptionKey: "settings:general.storeCookies.description",
  modelKey: "settingStoreCookies",
  models: ["workspace", "folder", "http_request", "websocket_request"],
  titleKey: "settings:general.storeCookies.title",
});

export function modelSupportsSetting<K extends RequestSettingKey>(
  model: Pick<AnyModel, "model">,
  setting: RequestSettingDefinition<K>,
) {
  return setting.models.some((modelType) => modelType === model.model);
}
