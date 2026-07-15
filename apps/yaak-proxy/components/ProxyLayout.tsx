import { HeaderSize, IconButton, SidebarLayout, SplitLayout } from "@yaakapp-internal/ui";
import classNames from "classnames";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "react-use";
import { useRpcQueryWithEvent } from "../hooks/useRpcQueryWithEvent";
import { getOsType } from "../lib/tauri";
import { ActionIconButton } from "./ActionIconButton";
import { ExchangesTable } from "./ExchangesTable";
import { filteredExchangesAtom, Sidebar } from "./Sidebar";

export function ProxyLayout() {
  const { t } = useTranslation();
  const os = getOsType();
  const exchanges = useAtomValue(filteredExchangesAtom);
  const [sidebarWidth, setSidebarWidth] = useLocalStorage("sidebar_width", 250);
  const [sidebarHidden, setSidebarHidden] = useLocalStorage("sidebar_hidden", false);
  const [floatingSidebarHidden, setFloatingSidebarHidden] = useLocalStorage(
    "floating_sidebar_hidden",
    true,
  );
  const [floating, setFloating] = useState(false);
  const { data: proxyState } = useRpcQueryWithEvent("get_proxy_state", {}, "proxy_state_changed");
  const isRunning = proxyState?.state === "running";
  const isHidden = floating ? (floatingSidebarHidden ?? true) : (sidebarHidden ?? false);

  return (
    <div
      className={classNames(
        "h-full w-full grid grid-rows-[auto_1fr]",
        os === "linux" && "border border-border-subtle",
      )}
    >
      <HeaderSize
        data-tauri-drag-region
        size="lg"
        osType={os}
        hideWindowControls={false}
        useNativeTitlebar={false}
        interfaceScale={1}
        windowControlLabels={{
          close: t("close"),
          maximize: t("maximize"),
          minimize: t("minimize"),
          unmaximize: t("unmaximize"),
        }}
        className="x-theme-appHeader bg-surface"
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center w-full h-full pointer-events-none">
          <div className="flex items-center pl-1 pointer-events-auto">
            <IconButton
              size="sm"
              title={t("toggleSidebar")}
              icon={isHidden ? "left_panel_hidden" : "left_panel_visible"}
              iconColor="secondary"
              onClick={() => {
                if (floating) {
                  setFloatingSidebarHidden(!floatingSidebarHidden);
                } else {
                  setSidebarHidden(!sidebarHidden);
                }
              }}
            />
          </div>
          <div
            data-tauri-drag-region
            className="pointer-events-none flex items-center text-sm px-2"
          >
            Yaak Proxy
          </div>
          <div className="flex items-center gap-1 pr-1 pointer-events-auto">
            {isRunning ? (
              <>
                <span className="text-2xs text-success">{t("running", { port: 9090 })}</span>
                <ActionIconButton
                  action={{ scope: "global", action: "proxy_stop" }}
                  title={t("stopProxy")}
                  icon="circle_stop"
                  iconColor="secondary"
                  size="sm"
                />
              </>
            ) : (
              <ActionIconButton
                action={{ scope: "global", action: "proxy_start" }}
                title={t("startProxy")}
                icon="circle_play"
                iconColor="secondary"
                size="sm"
              />
            )}
          </div>
        </div>
      </HeaderSize>
      <SidebarLayout
        width={sidebarWidth ?? 250}
        onWidthChange={setSidebarWidth}
        hidden={sidebarHidden ?? false}
        onHiddenChange={setSidebarHidden}
        floatingHidden={floatingSidebarHidden ?? true}
        onFloatingHiddenChange={setFloatingSidebarHidden}
        onFloatingChange={setFloating}
        sidebar={
          floating ? (
            <div
              className={classNames(
                "x-theme-sidebar",
                "h-full bg-surface border-r border-border-subtle",
                "grid grid-rows-[auto_1fr]",
              )}
            >
              <HeaderSize
                hideControls
                size="lg"
                className="border-transparent pl-1"
                osType={os}
                hideWindowControls={false}
                useNativeTitlebar={false}
                interfaceScale={1}
                windowControlLabels={{
                  close: t("close"),
                  maximize: t("maximize"),
                  minimize: t("minimize"),
                  unmaximize: t("unmaximize"),
                }}
              >
                <IconButton
                  size="sm"
                  title={t("toggleSidebar")}
                  icon="left_panel_visible"
                  iconColor="secondary"
                  onClick={() => setFloatingSidebarHidden(true)}
                />
              </HeaderSize>
              <Sidebar />
            </div>
          ) : (
            <Sidebar />
          )
        }
      >
        <SplitLayout
          storageKey="proxy_detail"
          layout="vertical"
          defaultRatio={0.4}
          firstSlot={({ style }) => (
            <ExchangesTable exchanges={exchanges} style={style} className="overflow-auto" />
          )}
          secondSlot={({ style }) => (
            <div
              style={style}
              className="p-3 text-text-subtlest text-sm border-t border-border-subtle"
            >
              {t("selectRequest")}
            </div>
          )}
        />
      </SidebarLayout>
    </div>
  );
}
