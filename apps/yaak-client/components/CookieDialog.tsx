import type { Cookie } from "@yaakapp-internal/models";
import { cookieJarsAtom, patchModel } from "@yaakapp-internal/models";
import { formatDate } from "date-fns/format";
import { enUS, zhCN } from "date-fns/locale";
import { useAtomValue } from "jotai";
import {
  type ComponentProps,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  type RefObject,
  useMemo,
  useRef,
  useState,
} from "react";
import { showDialog } from "../lib/dialog";
import { jotaiStore } from "../lib/jotai";
import { cookieDomain } from "../lib/model_util";
import {
  Icon,
  SplitLayout,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TruncatedWideTableCell,
} from "@yaakapp-internal/ui";
import { IconButton } from "./core/IconButton";
import { Checkbox } from "./core/Checkbox";
import classNames from "classnames";
import { EventDetailHeader } from "./core/EventViewer";
import { KeyValueRow, KeyValueRows } from "./core/KeyValueRow";
import { EmptyStateText } from "./EmptyStateText";
import { PlainInput } from "./core/PlainInput";
import { Select } from "./core/Select";
import { showAlert } from "../lib/alert";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

interface Props {
  cookieJarId: string | null;
}

export const CookieDialog = ({ cookieJarId }: Props) => {
  const { t } = useTranslation();
  const cookieJars = useAtomValue(cookieJarsAtom);
  const cookieJar = cookieJars?.find((c) => c.id === cookieJarId);
  const [filter, setFilter] = useState("");
  const [filterUpdateKey, setFilterUpdateKey] = useState(0);
  const [selectedCookieKey, setSelectedCookieKey] = useState<string | null>(null);
  const [editingCookieKey, setEditingCookieKey] = useState<string | null>(null);
  const [draftCookie, setDraftCookie] = useState<Cookie | null>(null);
  const [draftExpiresInput, setDraftExpiresInput] = useState("");
  const editorFormRef = useRef<HTMLFormElement>(null);
  const filteredCookies = useMemo(() => {
    return cookieJar?.cookies.filter((cookie) => cookieMatchesFilter(cookie, filter)) ?? [];
  }, [cookieJar?.cookies, filter]);
  const selectedCookie = useMemo(
    () =>
      selectedCookieKey == null
        ? null
        : (filteredCookies.find((cookie) => cookieKey(cookie) === selectedCookieKey) ?? null),
    [filteredCookies, selectedCookieKey],
  );
  const detailCookie = draftCookie ?? selectedCookie;
  const isCreatingCookie = editingCookieKey === NEW_COOKIE_KEY;
  const isEditingCookie = draftCookie != null;

  const handleAddCookie = () => {
    setSelectedCookieKey(null);
    setEditingCookieKey(NEW_COOKIE_KEY);
    setDraftCookie(newCookieDraft());
    setDraftExpiresInput("");
  };

  const handleEditCookie = () => {
    if (selectedCookie == null) {
      return;
    }

    setEditingCookieKey(cookieKey(selectedCookie));
    setDraftCookie(selectedCookie);
    setDraftExpiresInput(cookieExpiresInputValue(selectedCookie));
  };

  const handleCancelEdit = () => {
    if (isCreatingCookie) {
      setSelectedCookieKey(null);
    }
    setEditingCookieKey(null);
    setDraftCookie(null);
    setDraftExpiresInput("");
  };

  const handleCloseDetails = () => {
    if (isEditingCookie) {
      handleCancelEdit();
      return;
    }

    setSelectedCookieKey(null);
  };

  const handleSaveCookie = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (cookieJar == null || draftCookie == null) {
      return;
    }

    let nextCookie = normalizeCookie(draftCookie);
    if (nextCookie.expires !== "SessionEnd") {
      const expires = cookieExpiresFromInput(draftExpiresInput);
      if (expires == null) {
        showAlert({
          id: "invalid-cookie-expires",
          title: t("workspace:cookieJar.invalidCookie"),
          body: t("workspace:cookieJar.invalidExpiration"),
        });
        return;
      }

      nextCookie = { ...nextCookie, expires };
    }

    const nextCookieKey = cookieKey(nextCookie);
    const nextCookies = cookieJar.cookies.filter((cookie) => {
      const key = cookieKey(cookie);
      if (editingCookieKey != null && key === editingCookieKey) {
        return false;
      }
      return key !== nextCookieKey;
    });

    patchModel(cookieJar, { cookies: [...nextCookies, nextCookie] });
    setSelectedCookieKey(nextCookieKey);
    setEditingCookieKey(null);
    setDraftCookie(null);
    setDraftExpiresInput("");
  };

  if (cookieJar == null) {
    return <div>{t("workspace:cookieJar.noSelection")}</div>;
  }

  return (
    <div className="pb-2 grid grid-rows-[auto_minmax(0,1fr)] space-y-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <PlainInput
          name="cookie-filter"
          label={t("workspace:cookieJar.filter")}
          hideLabel
          placeholder={t("workspace:cookieJar.filter")}
          defaultValue={filter}
          forceUpdateKey={filterUpdateKey}
          onChange={setFilter}
          rightSlot={
            filter.length > 0 && (
              <IconButton
                className="!bg-transparent !h-auto min-h-full opacity-50 hover:opacity-100 -mr-1"
                icon="x"
                title={t("workspace:cookieJar.clearFilter")}
                onClick={() => {
                  setFilter("");
                  setFilterUpdateKey((key) => key + 1);
                }}
              />
            )
          }
        />
        <IconButton
          icon="plus"
          size="sm"
          title={t("workspace:cookieJar.add")}
          onClick={handleAddCookie}
        />
      </div>
      {cookieJar.cookies.length === 0 && detailCookie == null ? (
        <EmptyStateText>{t("workspace:cookieJar.empty")}</EmptyStateText>
      ) : filteredCookies.length === 0 && detailCookie == null ? (
        <EmptyStateText>{t("workspace:cookieJar.noMatches")}</EmptyStateText>
      ) : (
        <SplitLayout
          layout="vertical"
          storageKey="cookie-dialog-details"
          defaultRatio={0.5}
          className="-mx-2"
          minHeightPx={10}
          firstSlot={({ style }) =>
            filteredCookies.length === 0 ? (
              <div style={style}>
                <EmptyStateText>{t("workspace:cookieJar.noMatches")}</EmptyStateText>
              </div>
            ) : (
              <Table scrollable style={style} className="pr-0.5">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>{t("common:name")}</TableHeaderCell>
                    <TableHeaderCell>{t("common:value")}</TableHeaderCell>
                    <TableHeaderCell>{t("request:response.domain")}</TableHeaderCell>
                    <TableHeaderCell>{t("request:response.path")}</TableHeaderCell>
                    <TableHeaderCell>{t("request:response.expires")}</TableHeaderCell>
                    <TableHeaderCell>{t("request:response.size")}</TableHeaderCell>
                    <TableHeaderCell>{t("request:response.httpOnly")}</TableHeaderCell>
                    <TableHeaderCell>{t("request:response.secure")}</TableHeaderCell>
                    <TableHeaderCell>{t("request:response.sameSite")}</TableHeaderCell>
                    <TableHeaderCell>
                      <IconButton
                        icon="list_x"
                        size="sm"
                        className="text-text-subtle"
                        title={t("workspace:cookieJar.clearAll")}
                        onClick={() => {
                          setSelectedCookieKey(null);
                          setEditingCookieKey(null);
                          setDraftCookie(null);
                          setDraftExpiresInput("");
                          patchModel(cookieJar, { cookies: [] });
                        }}
                      />
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody className="[&_td]:select-auto [&_td]:cursor-auto">
                  {filteredCookies.map((c: Cookie) => {
                    const key = cookieKey(c);
                    const isSelected = key === selectedCookieKey;

                    return (
                      <TableRow
                        key={key}
                        className={classNames(
                          "group/tr cursor-default",
                          isSelected && "[&_td]:bg-surface-highlight",
                          !isSelected && "hover:[&_td]:bg-surface-hover",
                        )}
                        onClick={() => {
                          setSelectedCookieKey(key);
                          setEditingCookieKey(null);
                          setDraftCookie(null);
                          setDraftExpiresInput("");
                        }}
                      >
                        <TableCell className={classNames("pl-2", isSelected && "rounded-l")}>
                          {c.name}
                        </TableCell>
                        <TruncatedWideTableCell className="min-w-[10rem]">
                          {c.value}
                        </TruncatedWideTableCell>
                        <TableCell>{cookieDomain(c)}</TableCell>
                        <TableCell>{c.path}</TableCell>
                        <TableCell>{cookieExpires(c)}</TableCell>
                        <TableCell>{cookieSize(c)}</TableCell>
                        <TableCell>
                          <Icon
                            icon={c.httpOnly ? "check" : "x"}
                            className={classNames(!c.httpOnly && "opacity-10")}
                          />
                        </TableCell>
                        <TableCell>
                          <Icon
                            icon={c.secure ? "check" : "x"}
                            className={classNames(!c.secure && "opacity-10")}
                          />
                        </TableCell>
                        <TableCell>{c.sameSite}</TableCell>
                        <TableCell className="rounded-r pr-2">
                          <IconButton
                            icon="trash"
                            size="xs"
                            iconSize="sm"
                            title={t("common:delete")}
                            className="text-text-subtlest ml-auto group-hover/tr:text-text transition-colors"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (isSelected) {
                                setSelectedCookieKey(null);
                              }
                              if (editingCookieKey === key) {
                                setEditingCookieKey(null);
                                setDraftCookie(null);
                                setDraftExpiresInput("");
                              }
                              patchModel(cookieJar, {
                                cookies: cookieJar.cookies.filter(
                                  (c2: Cookie) => cookieKey(c2) !== key,
                                ),
                              });
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          }
          secondSlot={
            detailCookie == null
              ? null
              : ({ style }) => (
                  <CookieDetailsPane
                    formRef={editorFormRef}
                    isEditing={isEditingCookie}
                    onSubmit={handleSaveCookie}
                    style={style}
                  >
                    <EventDetailHeader
                      title={
                        isCreatingCookie
                          ? t("workspace:cookieJar.newCookie")
                          : detailCookie.name || t("workspace:cookieJar.cookie")
                      }
                      copyText={isEditingCookie ? undefined : detailCookie.value}
                      actions={
                        isEditingCookie
                          ? [
                              {
                                key: "save",
                                label: isCreatingCookie ? t("common:create") : t("common:save"),
                                onClick: () => editorFormRef.current?.requestSubmit(),
                              },
                              {
                                key: "cancel",
                                label: t("common:cancel"),
                                onClick: handleCancelEdit,
                              },
                            ]
                          : [
                              {
                                key: "edit",
                                label: t("common:edit"),
                                onClick: handleEditCookie,
                              },
                            ]
                      }
                      onClose={handleCloseDetails}
                    />
                    {isEditingCookie ? (
                      <CookieEditor
                        cookie={detailCookie}
                        expiresInputValue={draftExpiresInput}
                        onChange={setDraftCookie}
                        onExpiresInputChange={setDraftExpiresInput}
                      />
                    ) : (
                      <CookieDetails cookie={detailCookie} />
                    )}
                  </CookieDetailsPane>
                )
          }
        />
      )}
    </div>
  );
};

function CookieDetailsPane({
  children,
  formRef,
  isEditing,
  onSubmit,
  style,
}: {
  children: ReactNode;
  formRef: RefObject<HTMLFormElement | null>;
  isEditing: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  style: CSSProperties;
}) {
  const className = "grid grid-rows-[auto_minmax(0,1fr)] bg-surface border-t border-border pt-2";

  if (isEditing) {
    return (
      <form ref={formRef} style={style} className={className} onSubmit={onSubmit}>
        {children}
      </form>
    );
  }

  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}

CookieDialog.show = (cookieJarId: string | null) => {
  const cookieJar = jotaiStore.get(cookieJarsAtom)?.find((jar) => jar.id === cookieJarId);
  if (cookieJar == null) {
    showAlert({
      id: "invalid-jar",
      body: i18n.t("workspace:cookieJar.invalidJarDescription", { id: cookieJarId }),
      title: i18n.t("workspace:cookieJar.invalidJar"),
    });
    return;
  }

  showDialog({
    id: "cookies",
    title: i18n.t("workspace:cookieJar.dialogTitle", { name: cookieJar.name }),
    size: "full",
    render: () => <CookieDialog cookieJarId={cookieJarId} />,
  });
};

function CookieDetails({ cookie }: { cookie: Cookie }) {
  const { t } = useTranslation();
  return (
    <div className="overflow-y-auto">
      <KeyValueRows selectable>
        <CookieKeyValueRow label={t("common:name")}>{cookie.name}</CookieKeyValueRow>
        <CookieKeyValueRow label={t("common:value")} enableCopy copyText={cookie.value}>
          <pre className="whitespace-pre-wrap break-all">{cookie.value}</pre>
        </CookieKeyValueRow>
        <CookieKeyValueRow label={t("request:response.domain")}>
          {cookieDomain(cookie)}
        </CookieKeyValueRow>
        <CookieKeyValueRow label={t("request:response.path")}>{cookie.path}</CookieKeyValueRow>
        <CookieKeyValueRow label={t("request:response.expires")}>
          {cookieExpires(cookie)}
        </CookieKeyValueRow>
        <CookieKeyValueRow label={t("request:response.size")}>
          {cookieSize(cookie)}
        </CookieKeyValueRow>
        <CookieKeyValueRow label={t("request:response.httpOnly")}>
          {cookie.httpOnly ? t("common:yes") : t("common:no")}
        </CookieKeyValueRow>
        <CookieKeyValueRow label={t("request:response.secure")}>
          {cookie.secure ? t("common:yes") : t("common:no")}
        </CookieKeyValueRow>
        {cookie.sameSite && (
          <CookieKeyValueRow label={t("request:response.sameSite")}>
            {cookie.sameSite}
          </CookieKeyValueRow>
        )}
      </KeyValueRows>
    </div>
  );
}

function CookieEditor({
  cookie,
  expiresInputValue,
  onChange,
  onExpiresInputChange,
}: {
  cookie: Cookie;
  expiresInputValue: string;
  onChange: (cookie: Cookie) => void;
  onExpiresInputChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const sessionCookie = cookie.expires === "SessionEnd";

  return (
    <div className="overflow-y-auto">
      <KeyValueRows>
        <CookieKeyValueRow align="middle" label={t("common:name")}>
          <CookieTextInput
            required
            autoFocus
            pattern={NON_EMPTY_INPUT_PATTERN}
            value={cookie.name}
            onChange={(name) => onChange({ ...cookie, name })}
          />
        </CookieKeyValueRow>
        <CookieKeyValueRow label={t("common:value")}>
          <CookieTextarea
            value={cookie.value}
            onChange={(value) => onChange({ ...cookie, value })}
          />
        </CookieKeyValueRow>
        <CookieKeyValueRow align="middle" label={t("request:response.domain")}>
          <CookieTextInput
            required
            pattern={NON_EMPTY_INPUT_PATTERN}
            value={cookieDomainInputValue(cookie)}
            placeholder="example.com"
            onChange={(domain) => onChange(cookieWithDomain(cookie, domain))}
          />
        </CookieKeyValueRow>
        <CookieKeyValueRow align="middle" label={t("request:response.path")}>
          <CookieTextInput
            value={cookie.path}
            placeholder="/"
            onChange={(path) => onChange({ ...cookie, path })}
          />
        </CookieKeyValueRow>
        <CookieKeyValueRow label={t("request:response.expires")}>
          <div className="grid gap-1">
            <Checkbox
              checked={sessionCookie}
              title={t("workspace:cookieJar.session")}
              onChange={(checked) => {
                if (checked) {
                  onChange({ ...cookie, expires: "SessionEnd" });
                  return;
                }

                const expiresInput =
                  cookieExpiresFromInput(expiresInputValue) == null
                    ? defaultCookieExpiresInputValue()
                    : expiresInputValue;

                onExpiresInputChange(expiresInput);
                onChange({
                  ...cookie,
                  expires: cookieExpiresFromInput(expiresInput)!,
                });
              }}
            />
            <CookieTextInput
              value={sessionCookie ? "" : expiresInputValue}
              disabled={sessionCookie}
              onChange={(value) => {
                onExpiresInputChange(value);

                const expires = cookieExpiresFromInput(value);
                if (expires != null) {
                  onChange({ ...cookie, expires });
                }
              }}
            />
          </div>
        </CookieKeyValueRow>
        <CookieKeyValueRow label={t("request:response.size")}>
          {cookieSize(cookie)}
        </CookieKeyValueRow>
        <CookieKeyValueRow align="middle" label={t("request:response.httpOnly")}>
          <Checkbox
            hideLabel
            title={t("request:response.httpOnly")}
            checked={cookie.httpOnly}
            onChange={(httpOnly) => onChange({ ...cookie, httpOnly })}
          />
        </CookieKeyValueRow>
        <CookieKeyValueRow align="middle" label={t("request:response.secure")}>
          <Checkbox
            hideLabel
            title={t("request:response.secure")}
            checked={cookie.secure}
            onChange={(secure) => onChange({ ...cookie, secure })}
          />
        </CookieKeyValueRow>
        <CookieKeyValueRow align="middle" label={t("request:response.sameSite")}>
          <Select
            hideLabel
            name="cookie-same-site"
            label={t("request:response.sameSite")}
            value={cookie.sameSite ?? ""}
            size="xs"
            className="w-full"
            options={[
              { label: t("workspace:cookieJar.notApplicable"), value: "" },
              { label: "Lax", value: "Lax" },
              { label: "Strict", value: "Strict" },
              { label: "None", value: "None" },
            ]}
            onChange={(sameSite) =>
              onChange({
                ...cookie,
                sameSite: sameSite === "" ? null : (sameSite as Cookie["sameSite"]),
              })
            }
          />
        </CookieKeyValueRow>
      </KeyValueRows>
    </div>
  );
}

function CookieKeyValueRow({ labelClassName, ...props }: ComponentProps<typeof KeyValueRow>) {
  return <KeyValueRow labelClassName={classNames("w-[7rem]", labelClassName)} {...props} />;
}

function CookieTextInput({
  autoFocus,
  disabled,
  onChange,
  pattern,
  placeholder,
  required,
  value,
}: {
  autoFocus?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  pattern?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  return (
    <input
      autoFocus={autoFocus}
      className={cookieInputClassName}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      pattern={pattern}
      placeholder={placeholder}
      required={required}
      type="text"
      value={value}
    />
  );
}

function CookieTextarea({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  return (
    <textarea
      className={classNames(cookieInputClassName, "min-h-[5rem] resize-y")}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  );
}

const NEW_COOKIE_KEY = "__new-cookie__";
const NON_EMPTY_INPUT_PATTERN = ".*\\S.*";
const cookieInputClassName = classNames(
  "x-theme-input w-full min-w-0 min-h-sm rounded-md bg-transparent",
  "border border-border-subtle outline-none",
  "px-2 text-xs font-mono cursor-text placeholder:text-placeholder",
  "focus:border-border-focus invalid:border-danger",
  "disabled:opacity-disabled disabled:border-dotted",
);

function cookieSize(cookie: Cookie) {
  const encoder = new TextEncoder();
  return encoder.encode(cookie.name).length + encoder.encode(cookie.value).length;
}

function newCookieDraft(): Cookie {
  return {
    name: "",
    value: "",
    domain: "NotPresent",
    expires: "SessionEnd",
    path: "/",
    secure: false,
    httpOnly: false,
    sameSite: null,
  };
}

function normalizeCookie(cookie: Cookie): Cookie {
  return {
    ...cookie,
    domain: normalizeCookieDomain(cookie.domain),
    name: cookie.name.trim(),
    path: cookie.path.trim() || "/",
  };
}

function normalizeCookieDomain(domain: Cookie["domain"]): Cookie["domain"] {
  if (domain === "NotPresent" || domain === "Empty") {
    return domain;
  }

  if ("Suffix" in domain) {
    return { Suffix: domain.Suffix.trim() };
  }

  return { HostOnly: domain.HostOnly.trim() };
}

function cookieDomainInputValue(cookie: Cookie) {
  const domain = cookieDomain(cookie);
  return domain === "n/a" ? "" : domain;
}

function cookieWithDomain(cookie: Cookie, domain: string): Cookie {
  const trimmedDomain = domain.trim();
  if (trimmedDomain.length === 0) {
    return { ...cookie, domain: "NotPresent" };
  }

  if (cookie.domain !== "NotPresent" && cookie.domain !== "Empty" && "Suffix" in cookie.domain) {
    return { ...cookie, domain: { Suffix: trimmedDomain } };
  }

  return { ...cookie, domain: { HostOnly: trimmedDomain } };
}

function cookieExpires(cookie: Cookie) {
  if (cookie.expires === "SessionEnd") {
    return i18n.t("workspace:cookieJar.session");
  }

  const expiresSeconds = Number(cookie.expires.AtUtc);
  if (!Number.isFinite(expiresSeconds)) {
    return cookie.expires.AtUtc;
  }

  const date = new Date(expiresSeconds * 1000);
  return formatDate(date, "PPpp", {
    locale: i18n.resolvedLanguage === "zh-CN" ? zhCN : enUS,
  });
}

function cookieExpiresInputValue(cookie: Cookie) {
  if (cookie.expires === "SessionEnd") {
    return "";
  }

  const expiresSeconds = Number(cookie.expires.AtUtc);
  if (!Number.isFinite(expiresSeconds)) {
    return "";
  }

  return new Date(expiresSeconds * 1000).toISOString();
}

function defaultCookieExpiresInputValue() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

function cookieExpiresFromInput(value: string): Cookie["expires"] | null {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) {
    return null;
  }

  return { AtUtc: `${Math.floor(time / 1000)}` };
}

function cookieMatchesFilter(cookie: Cookie, filter: string) {
  const query = filter.trim().toLowerCase();
  if (query.length === 0) {
    return true;
  }

  return [cookie.name, cookie.value, cookieDomain(cookie)].some((value) =>
    value.toLowerCase().includes(query),
  );
}

function cookieKey(cookie: Cookie) {
  return [cookie.name, cookieDomainKey(cookie.domain), cookie.path].join("|");
}

function cookieDomainKey(domain: Cookie["domain"]) {
  if (typeof domain !== "string" && "HostOnly" in domain) {
    return `HostOnly:${domain.HostOnly}`;
  }

  if (typeof domain !== "string" && "Suffix" in domain) {
    return `Suffix:${domain.Suffix}`;
  }

  return domain;
}
