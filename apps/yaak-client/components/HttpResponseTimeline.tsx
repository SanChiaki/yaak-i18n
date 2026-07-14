import type {
  AnyModel,
  HttpResponse,
  HttpResponseEvent,
  HttpResponseEventData,
} from "@yaakapp-internal/models";
import { foldersAtom, workspacesAtom } from "@yaakapp-internal/models";
import { useAtomValue } from "jotai";
import { type ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useHttpResponseEvents } from "../hooks/useHttpResponseEvents";
import { useAllRequests } from "../hooks/useAllRequests";
import { resolvedModelName } from "../lib/resolvedModelName";
import { Editor } from "./core/Editor/LazyEditor";
import { type EventDetailAction, EventDetailHeader, EventViewer } from "./core/EventViewer";
import { EventViewerRow } from "./core/EventViewerRow";
import { HttpStatusTagRaw } from "./core/HttpStatusTag";
import { Icon, type IconProps } from "@yaakapp-internal/ui";
import { KeyValueRow, KeyValueRows } from "./core/KeyValueRow";
import type { TimelineViewMode } from "./HttpResponsePane";

interface Props {
  response: HttpResponse;
  viewMode: TimelineViewMode;
}

export function HttpResponseTimeline({ response, viewMode }: Props) {
  return <Inner key={response.id} response={response} viewMode={viewMode} />;
}

function Inner({ response, viewMode }: Props) {
  const { t } = useTranslation();
  const [showRaw, setShowRaw] = useState(false);
  const { data: events, error, isLoading } = useHttpResponseEvents(response);

  // Generate plain text representation of all events (with prefixes for timeline view)
  const plainText = useMemo(() => {
    if (!events || events.length === 0) return "";
    return events.map((event) => formatEventText(event.event, true, t)).join("\n");
  }, [events, t]);

  // Plain text view - show all events as text in an editor
  if (viewMode === "text") {
    if (isLoading) {
      return <div className="p-4 text-text-subtlest">{t("common:ui.loadingEvents")}</div>;
    } else if (error) {
      return <div className="p-4 text-danger">{String(error)}</div>;
    } else if (!events || events.length === 0) {
      return <div className="p-4 text-text-subtlest">{t("common:ui.noEvents")}</div>;
    } else {
      return (
        <Editor language="timeline" defaultValue={plainText} readOnly stateKey={null} hideGutter />
      );
    }
  }

  return (
    <EventViewer
      events={events ?? []}
      getEventKey={(event) => event.id}
      error={error ? String(error) : null}
      isLoading={isLoading}
      loadingMessage={t("common:ui.loadingEvents")}
      emptyMessage={t("common:ui.noEvents")}
      splitLayoutStorageKey="http_response_events"
      defaultRatio={0.25}
      renderRow={({ event, isActive, onClick }) => {
        const display = getEventDisplay(event.event, t);
        return (
          <EventViewerRow
            isActive={isActive}
            onClick={onClick}
            icon={<Icon color={display.color} icon={display.icon} size="sm" />}
            content={display.summary}
            timestamp={event.createdAt}
          />
        );
      }}
      renderDetail={({ event, onClose }) => (
        <EventDetails event={event} showRaw={showRaw} setShowRaw={setShowRaw} onClose={onClose} />
      )}
    />
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function EventDetails({
  event,
  showRaw,
  setShowRaw,
  onClose,
}: {
  event: HttpResponseEvent;
  showRaw: boolean;
  setShowRaw: (v: boolean) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { label } = getEventDisplay(event.event, t);
  const e = event.event;
  const settingSourceModels = useSettingSourceModels();

  const actions: EventDetailAction[] = [
    {
      key: "toggle-raw",
      label: showRaw
        ? t("request:response.timelineFormatted")
        : t("request:response.timelineTextView"),
      onClick: () => setShowRaw(!showRaw),
    },
  ];

  // Determine the title based on event type
  const title = (() => {
    switch (e.type) {
      case "header_up":
        return t("request:response.headerSent");
      case "header_down":
        return t("request:response.headerReceived");
      case "send_url":
        return t("request:request.title");
      case "receive_url":
        return t("request:response.title");
      case "redirect":
        return t("request:response.redirect");
      case "setting":
        return t("request:response.applySetting");
      case "chunk_sent":
        return t("request:response.dataSent");
      case "chunk_received":
        return t("request:response.dataReceived");
      case "dns_resolved":
        return e.overridden
          ? t("request:response.dnsOverride")
          : t("request:response.dnsResolution");
      default:
        return label;
    }
  })();

  // Render content based on view mode and event type
  const renderContent = () => {
    // Raw view - show plaintext representation (without prefix)
    if (showRaw) {
      const rawText = formatEventText(event.event, false, t);
      return <Editor language="text" defaultValue={rawText} readOnly stateKey={null} hideGutter />;
    }

    // Headers - show name and value
    if (e.type === "header_up" || e.type === "header_down") {
      return (
        <KeyValueRows>
          <KeyValueRow label={t("request:response.header")}>{e.name}</KeyValueRow>
          <KeyValueRow label={t("common:value")}>{e.value}</KeyValueRow>
        </KeyValueRows>
      );
    }

    // Request URL - show all URL parts separately
    if (e.type === "send_url") {
      const auth = e.username || e.password ? `${e.username}:${e.password}@` : "";
      const isDefaultPort =
        (e.scheme === "http" && e.port === 80) || (e.scheme === "https" && e.port === 443);
      const portStr = isDefaultPort ? "" : `:${e.port}`;
      const query = e.query ? `?${e.query}` : "";
      const fragment = e.fragment ? `#${e.fragment}` : "";
      const fullUrl = `${e.scheme}://${auth}${e.host}${portStr}${e.path}${query}${fragment}`;
      return (
        <KeyValueRows>
          <KeyValueRow label="URL">{fullUrl}</KeyValueRow>
          <KeyValueRow label={t("request:request.method")}>{e.method}</KeyValueRow>
          <KeyValueRow label={t("request:response.scheme")}>{e.scheme}</KeyValueRow>
          {e.username ? (
            <KeyValueRow label={t("request:response.username")}>{e.username}</KeyValueRow>
          ) : null}
          {e.password ? (
            <KeyValueRow label={t("request:response.password")}>{e.password}</KeyValueRow>
          ) : null}
          <KeyValueRow label={t("request:response.host")}>{e.host}</KeyValueRow>
          {!isDefaultPort ? (
            <KeyValueRow label={t("request:response.port")}>{e.port}</KeyValueRow>
          ) : null}
          <KeyValueRow label={t("request:response.path")}>{e.path}</KeyValueRow>
          {e.query ? (
            <KeyValueRow label={t("request:response.queryValue")}>{e.query}</KeyValueRow>
          ) : null}
          {e.fragment ? (
            <KeyValueRow label={t("request:response.fragment")}>{e.fragment}</KeyValueRow>
          ) : null}
        </KeyValueRows>
      );
    }

    // Response status - show version and status separately
    if (e.type === "receive_url") {
      return (
        <KeyValueRows>
          <KeyValueRow label={t("request:response.httpVersion")}>{e.version}</KeyValueRow>
          <KeyValueRow label={t("request:response.status")}>
            <HttpStatusTagRaw status={e.status} />
          </KeyValueRow>
        </KeyValueRows>
      );
    }

    // Redirect - show status, URL, and behavior
    if (e.type === "redirect") {
      const droppedHeaders = e.dropped_headers ?? [];
      return (
        <KeyValueRows>
          <KeyValueRow label={t("request:response.status")}>
            <HttpStatusTagRaw status={e.status} />
          </KeyValueRow>
          <KeyValueRow label={t("request:response.location")}>{e.url}</KeyValueRow>
          <KeyValueRow label={t("request:response.behavior")}>
            {e.behavior === "drop_body"
              ? t("request:response.dropBodyBehavior")
              : t("request:response.preserveBehavior")}
          </KeyValueRow>
          <KeyValueRow label={t("request:response.bodyDroppedLabel")}>
            {e.dropped_body ? t("common:yes") : t("common:no")}
          </KeyValueRow>
          <KeyValueRow label={t("request:response.headersDroppedLabel")}>
            {droppedHeaders.length > 0 ? droppedHeaders.join(", ") : "--"}
          </KeyValueRow>
        </KeyValueRows>
      );
    }

    // Settings - show as key/value
    if (e.type === "setting") {
      return (
        <KeyValueRows>
          <KeyValueRow label={t("request:response.setting")}>{e.name}</KeyValueRow>
          <KeyValueRow label={t("common:value")}>{e.value}</KeyValueRow>
          {e.source_model != null ? (
            <KeyValueRow label={t("request:response.source")}>
              {formatSettingSource(e, settingSourceModels, t)}
            </KeyValueRow>
          ) : null}
        </KeyValueRows>
      );
    }

    // Chunks - show formatted bytes
    if (e.type === "chunk_sent" || e.type === "chunk_received") {
      return <div className="font-mono text-editor">{formatBytes(e.bytes)}</div>;
    }

    // DNS Resolution - show hostname, addresses, and timing
    if (e.type === "dns_resolved") {
      return (
        <KeyValueRows>
          <KeyValueRow label={t("workspace:dns.hostname")}>{e.hostname}</KeyValueRow>
          <KeyValueRow label={t("request:response.addresses")}>
            {e.addresses.join(", ")}
          </KeyValueRow>
          <KeyValueRow label={t("request:response.duration")}>
            {e.overridden ? (
              <span className="text-text-subtlest">--</span>
            ) : (
              `${String(e.duration)}ms`
            )}
          </KeyValueRow>
          {e.overridden ? (
            <KeyValueRow label={t("request:response.source")}>
              {t("request:response.workspaceOverride")}
            </KeyValueRow>
          ) : null}
        </KeyValueRows>
      );
    }

    // Default - use summary
    const { summary } = getEventDisplay(event.event, t);
    return <div className="font-mono text-editor">{summary}</div>;
  };
  return (
    <div className="flex flex-col gap-2 h-full">
      <EventDetailHeader
        title={title}
        timestamp={event.createdAt}
        actions={actions}
        onClose={onClose}
      />
      {renderContent()}
    </div>
  );
}

type EventTextParts = { prefix: ">" | "<" | "*"; text: string };

/** Get the prefix and text for an event */
function getEventTextParts(event: HttpResponseEventData, t: TFunction): EventTextParts {
  switch (event.type) {
    case "send_url":
      return {
        prefix: ">",
        text: `${event.method} ${event.path}${event.query ? `?${event.query}` : ""}${event.fragment ? `#${event.fragment}` : ""}`,
      };
    case "receive_url":
      return { prefix: "<", text: `${event.version} ${event.status}` };
    case "header_up":
      return { prefix: ">", text: `${event.name}: ${event.value}` };
    case "header_down":
      return { prefix: "<", text: `${event.name}: ${event.value}` };
    case "redirect": {
      const behavior =
        event.behavior === "drop_body"
          ? t("request:response.dropBodyShort")
          : t("request:response.preserveShort");
      const droppedHeaders = event.dropped_headers ?? [];
      const dropped = [
        event.dropped_body ? t("request:response.bodyDroppedShort") : null,
        droppedHeaders.length > 0
          ? t("request:response.headersDroppedShort", {
              headers: droppedHeaders.join(", "),
            })
          : null,
      ]
        .filter(Boolean)
        .join(", ");
      return {
        prefix: "*",
        text: t("request:response.redirectEvent", {
          status: event.status,
          url: event.url,
          behavior,
          dropped: dropped ? `, ${dropped}` : "",
        }),
      };
    }
    case "setting":
      return {
        prefix: "*",
        text: t("request:response.settingEvent", { name: event.name, value: event.value }),
      };
    case "info":
      return { prefix: "*", text: event.message };
    case "chunk_sent":
      return {
        prefix: "*",
        text: t("request:response.bytesSent", { size: formatBytes(event.bytes) }),
      };
    case "chunk_received":
      return {
        prefix: "*",
        text: t("request:response.bytesReceived", { size: formatBytes(event.bytes) }),
      };
    case "dns_resolved":
      if (event.overridden) {
        return {
          prefix: "*",
          text: t("request:response.dnsOverrideEvent", {
            hostname: event.hostname,
            addresses: event.addresses.join(", "),
          }),
        };
      }
      return {
        prefix: "*",
        text: t("request:response.dnsResolvedEvent", {
          hostname: event.hostname,
          addresses: event.addresses.join(", "),
          duration: event.duration,
        }),
      };
    default:
      return { prefix: "*", text: t("request:response.unknownEventBracketed") };
  }
}

/** Format event as plaintext, optionally with curl-style prefix (> outgoing, < incoming, * info) */
function formatEventText(
  event: HttpResponseEventData,
  includePrefix: boolean,
  t: TFunction,
): string {
  const { prefix, text } = getEventTextParts(event, t);
  return includePrefix ? `${prefix} ${text}` : text;
}

function useSettingSourceModels() {
  const requests = useAllRequests();
  const folders = useAtomValue(foldersAtom);
  const workspaces = useAtomValue(workspacesAtom);

  return useMemo<AnyModel[]>(
    () => [...requests, ...folders, ...workspaces],
    [requests, folders, workspaces],
  );
}

function formatSettingSource(
  event: Extract<HttpResponseEventData, { type: "setting" }>,
  models: AnyModel[],
  t: TFunction,
): string {
  const sourceModel = event.source_model;
  if (sourceModel == null || sourceModel === "default") {
    return t("request:response.defaultSource");
  }

  const model =
    event.source_id == null
      ? null
      : (models.find((m) => m.model === sourceModel && m.id === event.source_id) ?? null);
  const name = model == null ? event.source_name : resolvedModelName(model);
  const label = sourceModel.replaceAll("_", " ");
  return name == null || name.length === 0 ? label : `${name} (${label})`;
}

function formatSettingSourceModel(event: Extract<HttpResponseEventData, { type: "setting" }>) {
  const sourceModel = event.source_model;
  if (sourceModel == null || sourceModel === "default" || sourceModel === "workspace") {
    return null;
  }

  return sourceModel;
}

type EventDisplay = {
  icon: IconProps["icon"];
  color: IconProps["color"];
  label: string;
  summary: ReactNode;
};

function getEventDisplay(event: HttpResponseEventData, t: TFunction): EventDisplay {
  switch (event.type) {
    case "setting":
      const sourceModel = formatSettingSourceModel(event);
      return {
        icon: "settings",
        color: "secondary",
        label: t("request:response.setting"),
        summary: `${event.name} = ${event.value}${sourceModel == null ? "" : ` (${sourceModel})`}`,
      };
    case "info":
      return {
        icon: "info",
        color: "secondary",
        label: t("common:info"),
        summary: event.message,
      };
    case "redirect": {
      const droppedHeaders = event.dropped_headers ?? [];
      const dropped = [
        event.dropped_body ? t("request:response.dropBodyShort") : null,
        droppedHeaders.length > 0
          ? t("request:response.dropHeaders", { count: droppedHeaders.length })
          : null,
      ]
        .filter(Boolean)
        .join(", ");
      return {
        icon: "arrow_big_right_dash",
        color: "success",
        label: t("request:response.redirect"),
        summary: t("request:response.redirecting", {
          status: event.status,
          url: event.url,
          dropped: dropped ? ` (${dropped})` : "",
        }),
      };
    }
    case "send_url":
      return {
        icon: "arrow_big_up_dash",
        color: "primary",
        label: t("request:request.title"),
        summary: `${event.method} ${event.path}${event.query ? `?${event.query}` : ""}${event.fragment ? `#${event.fragment}` : ""}`,
      };
    case "receive_url":
      return {
        icon: "arrow_big_down_dash",
        color: "info",
        label: t("request:response.title"),
        summary: `${event.version} ${event.status}`,
      };
    case "header_up":
      return {
        icon: "arrow_big_up_dash",
        color: "primary",
        label: t("request:response.header"),
        summary: `${event.name}: ${event.value}`,
      };
    case "header_down":
      return {
        icon: "arrow_big_down_dash",
        color: "info",
        label: t("request:response.header"),
        summary: `${event.name}: ${event.value}`,
      };

    case "chunk_sent":
      return {
        icon: "info",
        color: "secondary",
        label: t("request:response.chunk"),
        summary: t("request:response.chunkSent", { size: formatBytes(event.bytes) }),
      };
    case "chunk_received":
      return {
        icon: "info",
        color: "secondary",
        label: t("request:response.chunk"),
        summary: t("request:response.chunkReceived", { size: formatBytes(event.bytes) }),
      };
    case "dns_resolved":
      return {
        icon: "globe",
        color: event.overridden ? "success" : "secondary",
        label: event.overridden ? t("request:response.dnsOverride") : "DNS",
        summary: event.overridden
          ? t("request:response.dnsOverriddenSummary", {
              hostname: event.hostname,
              addresses: event.addresses.join(", "),
            })
          : `${event.hostname} → ${event.addresses.join(", ")} (${event.duration}ms)`,
      };
    default:
      return {
        icon: "info",
        color: "secondary",
        label: t("request:response.unknown"),
        summary: t("request:response.unknownEvent"),
      };
  }
}
