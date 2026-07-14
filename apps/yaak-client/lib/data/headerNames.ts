import type { GenericCompletionOption } from "@yaakapp-internal/plugins";
import type { TFunction } from "i18next";

export function getHeaderNames(t: TFunction): (GenericCompletionOption | string)[] {
  return [
    {
      type: "constant",
      label: "Content-Type",
      info: t("request:headers.contentTypeInfo"),
    },
    {
      type: "constant",
      label: "Content-Length",
      info: t("request:headers.contentLengthInfo"),
    },
    {
      type: "constant",
      label: "Accept",
      info: t("request:headers.acceptInfo"),
    },
    {
      type: "constant",
      label: "Accept-Encoding",
      info: t("request:headers.acceptEncodingInfo"),
    },
    {
      type: "constant",
      label: "Accept-Language",
      info: t("request:headers.acceptLanguageInfo"),
    },
    {
      type: "constant",
      label: "Authorization",
      info: t("request:headers.authorizationInfo"),
    },
    "Cache-Control",
    "Cookie",
    "Connection",
    "Content-MD5",
    "Date",
    "Expect",
    "Forwarded",
    "From",
    "Host",
    "If-Match",
    "If-Modified-Since",
    "If-None-Match",
    "If-Range",
    "If-Unmodified-Since",
    "Max-Forwards",
    "Origin",
    "Pragma",
    "Proxy-Authorization",
    "Range",
    "Referer",
    "TE",
    "User-Agent",
    "Upgrade",
    "Via",
    "Warning",
  ];
}
