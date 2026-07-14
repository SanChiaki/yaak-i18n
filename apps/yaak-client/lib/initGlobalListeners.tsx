import { emit } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { debounce } from "@yaakapp-internal/lib";
import type {
  FormInput,
  InternalEvent,
  JsonPrimitive,
  ShowToastRequest,
} from "@yaakapp-internal/plugins";
import { updateAllPlugins } from "@yaakapp-internal/plugins";
import type {
  PluginUpdateNotification,
  UpdateInfo,
  UpdateResponse,
  YaakNotification,
} from "@yaakapp-internal/tauri-client";
import { HStack, Icon, VStack } from "@yaakapp-internal/ui";
import { openSettings } from "../commands/openSettings";
import { Button } from "../components/core/Button";
import { ButtonInfiniteLoading } from "../components/core/ButtonInfiniteLoading";
import i18n from "../i18n";

// Listen for toasts
import { listenToTauriEvent } from "../hooks/useListenToTauriEvent";
import { updateAvailableAtom } from "./atoms";
import { stringToColor } from "./color";
import { generateId } from "./generateId";
import { jotaiStore } from "./jotai";
import { localizePluginText } from "./localizePluginText";
import { showPrompt } from "./prompt";
import { showPromptForm } from "./prompt-form";
import { invokeCmd } from "./tauri";
import { showToast } from "./toast";

export function initGlobalListeners() {
  listenToTauriEvent<ShowToastRequest>("show_toast", (event) => {
    showToast({
      ...event.payload,
      message: localizePluginText(event.payload.message),
    });
  });

  // Show errors for any plugins that failed to load during startup
  void invokeCmd<[string, string][]>("cmd_plugin_init_errors").then((errors) => {
    for (const [dir, err] of errors) {
      const name = dir.split(/[/\\]/).pop() ?? dir;
      showToast({
        id: `plugin-init-error-${name}`,
        color: "danger",
        timeout: null,
        message: i18n.t("common:pluginUpdates.loadFailed", { name, error: err }),
      });
    }
  });

  listenToTauriEvent("settings", () => openSettings.mutate(null));

  // Track active dynamic form dialogs so follow-up input updates can reach them
  const activeForms = new Map<string, (inputs: FormInput[]) => void>();

  // Listen for plugin events
  listenToTauriEvent<InternalEvent>("plugin_event", async ({ payload: event }) => {
    if (event.payload.type === "prompt_text_request") {
      const value = await showPrompt({
        ...event.payload,
        title: localizePluginText(event.payload.title),
        label: localizePluginText(event.payload.label),
        description: event.payload.description
          ? localizePluginText(event.payload.description)
          : undefined,
        placeholder: event.payload.placeholder
          ? localizePluginText(event.payload.placeholder)
          : undefined,
        confirmText: event.payload.confirmText
          ? localizePluginText(event.payload.confirmText)
          : undefined,
        cancelText: event.payload.cancelText
          ? localizePluginText(event.payload.cancelText)
          : undefined,
      });
      const result: InternalEvent = {
        id: generateId(),
        replyId: event.id,
        pluginName: event.pluginName,
        pluginRefId: event.pluginRefId,
        context: event.context,
        payload: {
          type: "prompt_text_response",
          value,
        },
      };
      await emit(event.id, result);
    } else if (event.payload.type === "prompt_form_request") {
      if (event.replyId != null) {
        // Follow-up update from plugin runtime — update the active dialog's inputs
        const updateInputs = activeForms.get(event.replyId);
        if (updateInputs) {
          updateInputs(event.payload.inputs);
        }
        return;
      }

      // Initial request — show the dialog with bidirectional support
      const emitFormResponse = (values: Record<string, JsonPrimitive> | null, done: boolean) => {
        const result: InternalEvent = {
          id: generateId(),
          replyId: event.id,
          pluginName: event.pluginName,
          pluginRefId: event.pluginRefId,
          context: event.context,
          payload: {
            type: "prompt_form_response",
            values,
            done,
          },
        };
        void emit(event.id, result);
      };

      const values = await showPromptForm({
        id: event.payload.id,
        title: localizePluginText(event.payload.title),
        description: event.payload.description
          ? localizePluginText(event.payload.description)
          : undefined,
        size: event.payload.size,
        inputs: event.payload.inputs,
        confirmText: event.payload.confirmText
          ? localizePluginText(event.payload.confirmText)
          : undefined,
        cancelText: event.payload.cancelText
          ? localizePluginText(event.payload.cancelText)
          : undefined,
        onValuesChange: debounce((values) => emitFormResponse(values, false), 150),
        onInputsUpdated: (cb) => activeForms.set(event.id, cb),
      });

      // Clean up and send final response
      activeForms.delete(event.id);
      emitFormResponse(values, true);
    }
  });

  listenToTauriEvent<string>("update_installed", async ({ payload: version }) => {
    console.log("Got update installed event", version);
    showUpdateInstalledToast(version);
  });

  // Listen for update events
  listenToTauriEvent<UpdateInfo>("update_available", async ({ payload }) => {
    console.log("Got update available", payload);
    void showUpdateAvailableToast(payload);
  });

  listenToTauriEvent<YaakNotification>("notification", ({ payload }) => {
    console.log("Got notification event", payload);
    showNotificationToast(payload);
  });

  // Listen for plugin update events
  listenToTauriEvent<PluginUpdateNotification>("plugin_updates_available", ({ payload }) => {
    console.log("Got plugin updates event", payload);
    showPluginUpdatesToast(payload);
  });
}

function showUpdateInstalledToast(version: string) {
  const UPDATE_TOAST_ID = "update-info";

  showToast({
    id: UPDATE_TOAST_ID,
    color: "primary",
    timeout: null,
    message: (
      <VStack>
        <h2 className="font-semibold">{i18n.t("common:updates.installed", { version })}</h2>
        <p className="text-text-subtle text-sm">{i18n.t("common:updates.restartPrompt")}</p>
      </VStack>
    ),
    action: ({ hide }) => (
      <ButtonInfiniteLoading
        size="xs"
        className="mr-auto min-w-[5rem]"
        color="primary"
        loadingChildren={i18n.t("common:updates.restarting")}
        onClick={() => {
          hide();
          setTimeout(() => invokeCmd("cmd_restart", {}), 200);
        }}
      >
        {i18n.t("common:updates.relaunch")}
      </ButtonInfiniteLoading>
    ),
  });
}

async function showUpdateAvailableToast(updateInfo: UpdateInfo) {
  const UPDATE_TOAST_ID = "update-info";
  const { version, replyEventId, downloaded } = updateInfo;

  jotaiStore.set(updateAvailableAtom, { version, downloaded });

  // Acknowledge the event, so we don't time out and try the fallback update logic
  await emit<UpdateResponse>(replyEventId, { type: "ack" });

  showToast({
    id: UPDATE_TOAST_ID,
    color: "info",
    timeout: null,
    message: (
      <VStack>
        <h2 className="font-semibold">{i18n.t("common:updates.available", { version })}</h2>
        <p className="text-text-subtle text-sm">
          {downloaded
            ? i18n.t("common:updates.installPrompt")
            : i18n.t("common:updates.downloadPrompt")}
        </p>
      </VStack>
    ),
    action: () => (
      <HStack space={1.5}>
        <ButtonInfiniteLoading
          size="xs"
          color="info"
          className="min-w-[10rem]"
          loadingChildren={
            downloaded ? i18n.t("common:updates.installing") : i18n.t("common:updates.downloading")
          }
          onClick={async () => {
            await emit<UpdateResponse>(replyEventId, {
              type: "action",
              action: "install",
            });
          }}
        >
          {downloaded
            ? i18n.t("common:updates.installNow")
            : i18n.t("common:updates.downloadAndInstall")}
        </ButtonInfiniteLoading>
        <Button
          size="xs"
          color="info"
          variant="border"
          rightSlot={<Icon icon="external_link" />}
          onClick={async () => {
            await openUrl(`https://yaak.app/changelog/${version}`);
          }}
        >
          {i18n.t("common:updates.whatsNew")}
        </Button>
      </HStack>
    ),
  });
}

function showPluginUpdatesToast(updateInfo: PluginUpdateNotification) {
  const PLUGIN_UPDATE_TOAST_ID = "plugin-updates";
  const count = updateInfo.updateCount;
  const pluginNames = updateInfo.plugins.map((p: { name: string }) => p.name);

  showToast({
    id: PLUGIN_UPDATE_TOAST_ID,
    color: "info",
    timeout: null,
    message: (
      <VStack>
        <h2 className="font-semibold">{i18n.t("common:pluginUpdates.available", { count })}</h2>
        <p className="text-text-subtle text-sm">
          {count === 1
            ? pluginNames[0]
            : `${pluginNames.slice(0, 2).join(", ")}${
                count > 2 ? i18n.t("common:pluginUpdates.more", { count: count - 2 }) : ""
              }`}
        </p>
      </VStack>
    ),
    action: ({ hide }) => (
      <HStack space={1.5}>
        <ButtonInfiniteLoading
          size="xs"
          color="info"
          className="min-w-[5rem]"
          loadingChildren={i18n.t("common:pluginUpdates.updating")}
          onClick={async () => {
            const updated = await updateAllPlugins();
            hide();
            if (updated.length > 0) {
              showToast({
                color: "success",
                message: i18n.t("common:pluginUpdates.updated", { count: updated.length }),
              });
            }
          }}
        >
          {i18n.t("common:pluginUpdates.updateAll")}
        </ButtonInfiniteLoading>
        <Button
          size="xs"
          color="info"
          variant="border"
          onClick={() => {
            hide();
            openSettings.mutate("plugins:installed");
          }}
        >
          {i18n.t("common:pluginUpdates.viewUpdates")}
        </Button>
      </HStack>
    ),
  });
}

function showNotificationToast(n: YaakNotification) {
  const actionUrl = n.action?.url;
  const actionLabel = n.action?.label;
  showToast({
    id: n.id,
    timeout: n.timeout ?? null,
    color: stringToColor(n.color) ?? undefined,
    message: (
      <VStack>
        {n.title && <h2 className="font-semibold">{n.title}</h2>}
        <p className="text-text-subtle text-sm">{n.message}</p>
      </VStack>
    ),
    onClose: () => {
      invokeCmd("cmd_dismiss_notification", { notificationId: n.id }).catch(console.error);
    },
    action: ({ hide }) => {
      return actionLabel && actionUrl ? (
        <Button
          size="xs"
          color={stringToColor(n.color) ?? undefined}
          className="mr-auto min-w-[5rem]"
          rightSlot={<Icon icon="external_link" />}
          onClick={() => {
            hide();
            return openUrl(actionUrl);
          }}
        >
          {actionLabel}
        </Button>
      ) : null;
    },
  });
}
