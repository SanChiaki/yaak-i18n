import type {
  AnyModel,
  Cookie,
  Environment,
  HttpResponseEvent,
  HttpResponseHeader,
} from "@yaakapp-internal/models";
import mime from "mime";
import { getMimeTypeFromContentType } from "./contentType";

export const BODY_TYPE_NONE = null;
export const BODY_TYPE_GRAPHQL = "graphql";
export const BODY_TYPE_JSON = "application/json";
export const BODY_TYPE_BINARY = "binary";
export const BODY_TYPE_OTHER = "other";
export const BODY_TYPE_FORM_URLENCODED = "application/x-www-form-urlencoded";
export const BODY_TYPE_FORM_MULTIPART = "multipart/form-data";
export const BODY_TYPE_XML = "text/xml";

export function cookieDomain(cookie: Cookie): string {
  if (cookie.domain === "NotPresent" || cookie.domain === "Empty") {
    return "n/a";
  }
  if ("HostOnly" in cookie.domain) {
    return cookie.domain.HostOnly;
  }
  if ("Suffix" in cookie.domain) {
    return cookie.domain.Suffix;
  }
  return "unknown";
}

export function modelsEq(a: AnyModel, b: AnyModel) {
  if (a.model !== b.model) {
    return false;
  }
  if (a.model === "key_value" && b.model === "key_value") {
    return a.key === b.key && a.namespace === b.namespace;
  }
  if ("id" in a && "id" in b) {
    return a.id === b.id;
  }
  return false;
}

export function getContentTypeFromHeaders(headers: HttpResponseHeader[] | null): string | null {
  return headers?.find((h) => h.name.toLowerCase() === "content-type")?.value ?? null;
}

export function getResponseSaveInfo(
  headers: HttpResponseHeader[],
  fallbackFilename: string,
): { filename: string; fileExtension: string | null } {
  const contentDisposition = getHeaderValue(headers, "content-disposition");
  const headerFilename = contentDisposition
    ? sanitizeFilename(getContentDispositionFilename(contentDisposition))
    : null;
  let filename = headerFilename ?? fallbackFilename;
  let fileExtension = getFileExtension(filename);

  if (fileExtension == null) {
    const contentType = getContentTypeFromHeaders(headers);
    fileExtension = contentType == null ? null : mime.getExtension(contentType);
    if (fileExtension != null) filename = `${filename}.${fileExtension}`;
  }

  return { filename, fileExtension };
}

function getHeaderValue(headers: HttpResponseHeader[], name: string): string | null {
  return headers.find((header) => header.name.toLowerCase() === name)?.value ?? null;
}

function getContentDispositionFilename(contentDisposition: string): string | null {
  let filename: string | null = null;
  let extendedFilename: string | null = null;
  const parameterPattern = /(?:^|;)\s*(filename\*|filename)\s*=\s*(?:"((?:\\.|[^"])*)"|([^;]*))/gi;

  for (const match of contentDisposition.matchAll(parameterPattern)) {
    const name = match[1]?.toLowerCase();
    const value =
      match[2] == null ? (match[3] ?? "").trim() : match[2].replace(/\\(.)/g, "$1").trim();
    if (name === "filename*") extendedFilename = decodeExtendedFilename(value);
    else if (name === "filename") filename = value;
  }

  return extendedFilename ?? filename;
}

function decodeExtendedFilename(value: string): string | null {
  const match = /^([^']*)'[^']*'(.*)$/.exec(value);
  if (match == null) return null;

  const charset = match[1]?.toLowerCase();
  const encodedFilename = match[2] ?? "";
  try {
    if (charset === "iso-8859-1") {
      return encodedFilename.replace(/%([0-9a-f]{2})/gi, (_, hex: string) =>
        String.fromCharCode(Number.parseInt(hex, 16)),
      );
    }
    if (charset === "utf-8" || charset === "") return decodeURIComponent(encodedFilename);
  } catch {
    return null;
  }
  return null;
}

function sanitizeFilename(filename: string | null): string | null {
  const basename = filename
    ?.split(/[\\/]/)
    .at(-1)
    ?.replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();
  return basename && basename !== "." && basename !== ".." ? basename : null;
}

function getFileExtension(filename: string): string | null {
  return /\.([a-z0-9][a-z0-9+_-]*)$/i.exec(filename)?.[1]?.toLowerCase() ?? null;
}

export function getCharsetFromContentType(headers: HttpResponseHeader[]): string | null {
  const contentType = getContentTypeFromHeaders(headers);
  if (contentType == null) return null;

  const mimeType = getMimeTypeFromContentType(contentType);
  return mimeType.parameters.get("charset") ?? null;
}

export function isBaseEnvironment(environment: Environment): boolean {
  return environment.parentModel === "workspace";
}

export function isSubEnvironment(environment: Environment): boolean {
  return environment.parentModel === "environment";
}

export function isFolderEnvironment(environment: Environment): boolean {
  return environment.parentModel === "folder";
}

export function getCookieCounts(events: HttpResponseEvent[] | undefined): {
  sent: number;
  received: number;
} {
  if (!events) return { sent: 0, received: 0 };

  // Use Sets to deduplicate by cookie name
  const sentNames = new Set<string>();
  const receivedNames = new Set<string>();

  for (const event of events) {
    const e = event.event;
    if (e.type === "header_up" && e.name.toLowerCase() === "cookie") {
      // Parse "Cookie: name=value; name2=value2" format
      for (const pair of e.value.split(";")) {
        const name = pair.split("=")[0]?.trim();
        if (name) sentNames.add(name);
      }
    } else if (e.type === "header_down" && e.name.toLowerCase() === "set-cookie") {
      // Parse "Set-Cookie: name=value; ..." - first part before ; is name=value
      const name = e.value.split(";")[0]?.split("=")[0]?.trim();
      if (name) receivedNames.add(name);
    }
  }

  return { sent: sentNames.size, received: receivedNames.size };
}
