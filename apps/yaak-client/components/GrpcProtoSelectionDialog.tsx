import { open } from "@tauri-apps/plugin-dialog";
import type { GrpcRequest } from "@yaakapp-internal/models";
import { Banner, HStack, Icon, InlineCode, VStack } from "@yaakapp-internal/ui";
import { useTranslation } from "react-i18next";
import { useActiveRequest } from "../hooks/useActiveRequest";
import { useGrpc } from "../hooks/useGrpc";
import { useGrpcProtoFiles } from "../hooks/useGrpcProtoFiles";
import { Button } from "./core/Button";
import { IconButton } from "./core/IconButton";
import { Link } from "./core/Link";

interface Props {
  onDone: () => void;
}

export function GrpcProtoSelectionDialog(props: Props) {
  const request = useActiveRequest();
  if (request?.model !== "grpc_request") return null;

  return <GrpcProtoSelectionDialogWithRequest request={request} {...props} />;
}

function GrpcProtoSelectionDialogWithRequest({ request }: Props & { request: GrpcRequest }) {
  const { t } = useTranslation();
  const protoFilesKv = useGrpcProtoFiles(request.id);
  const protoFiles = protoFilesKv.value ?? [];
  const grpc = useGrpc(request, null, protoFiles);
  const services = grpc.reflect.data;
  const serverReflection = protoFiles.length === 0 && services != null;
  let reflectError = grpc.reflect.error ?? null;
  const reflectionUnimplemented = String(reflectError).match(/unimplemented/i);

  if (reflectionUnimplemented) {
    reflectError = null;
  }

  if (request == null) {
    return null;
  }

  return (
    <VStack className="flex-col-reverse mb-3" space={3}>
      {/* Buttons on top so they get focus first */}
      <HStack space={2} justifyContent="start" className="flex-row-reverse mt-3">
        <Button
          color="primary"
          variant="border"
          onClick={async () => {
            const selected = await open({
              title: t("request:grpc.selectProtoFiles"),
              multiple: true,
              filters: [{ name: t("request:grpc.protoFilesFilter"), extensions: ["proto"] }],
            });
            if (selected == null) return;

            const newFiles = selected.filter((p) => !protoFiles.includes(p));
            await protoFilesKv.set([...protoFiles, ...newFiles]);
            await grpc.reflect.refetch();
          }}
        >
          {t("request:grpc.addProtoFiles")}
        </Button>
        <Button
          variant="border"
          color="primary"
          onClick={async () => {
            const selected = await open({
              title: t("request:grpc.selectProtoDirectory"),
              directory: true,
            });
            if (selected == null) return;

            await protoFilesKv.set([...protoFiles.filter((f) => f !== selected), selected]);
            await grpc.reflect.refetch();
          }}
        >
          {t("request:grpc.addImportFolders")}
        </Button>
        <Button
          isLoading={grpc.reflect.isFetching}
          disabled={grpc.reflect.isFetching}
          variant="border"
          color="secondary"
          onClick={() => grpc.reflect.refetch()}
        >
          {t("request:grpc.refreshSchema")}
        </Button>
      </HStack>
      <VStack space={5}>
        {reflectError && (
          <Banner color="warning">
            <h1 className="font-bold">
              {t("request:grpc.reflectionFailed")} <InlineCode>{request.url || "n/a"}</InlineCode>
            </h1>
            <p>{reflectError.trim()}</p>
          </Banner>
        )}
        {!serverReflection && services != null && services.length > 0 && (
          <Banner className="flex flex-col gap-2">
            <p>
              {t("request:grpc.foundServices")}{" "}
              {services?.slice(0, 5).map((s, i) => {
                return (
                  <span key={s.name + s.methods.map((m) => m.name).join(",")}>
                    <InlineCode>{s.name}</InlineCode>
                    {i === services.length - 1
                      ? ""
                      : i === services.length - 2
                        ? ` ${t("common:and")} `
                        : ", "}
                  </span>
                );
              })}
              {services?.length > 5 &&
                t("request:grpc.otherServices", { count: services.length - 5 })}
            </p>
          </Banner>
        )}
        {serverReflection && services != null && services.length > 0 && (
          <Banner className="flex flex-col gap-2">
            <p>
              {t("request:grpc.reflectionFoundServices")}{" "}
              {services?.map((s, i) => {
                return (
                  <span key={s.name + s.methods.map((m) => m.name).join(",")}>
                    <InlineCode>{s.name}</InlineCode>
                    {i === services.length - 1
                      ? ""
                      : i === services.length - 2
                        ? ` ${t("common:and")} `
                        : ", "}
                  </span>
                );
              })}
              {t("request:grpc.overrideSchemaBefore")} <InlineCode>*.proto</InlineCode>{" "}
              {t("request:grpc.overrideSchemaAfter")}
            </p>
          </Banner>
        )}

        {protoFiles.length > 0 && (
          <table className="w-full divide-y divide-surface-highlight">
            <thead>
              <tr>
                <th className="text-text-subtlest" colSpan={3}>
                  {t("request:grpc.addedFilePaths")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-highlight">
              {protoFiles.map((f, i) => {
                const parts = f.split("/");
                // oxlint-disable-next-line no-array-index-key -- none
                return (
                  <tr key={f + i} className="group">
                    <td>
                      <Icon icon={f.endsWith(".proto") ? "file_code" : "folder_code"} />
                    </td>
                    <td className="pl-1 font-mono text-sm" title={f}>
                      {parts.length > 3 && ".../"}
                      {parts.slice(-3).join("/")}
                    </td>
                    <td className="w-0 py-0.5">
                      <IconButton
                        title={t("request:grpc.removeFile")}
                        variant="border"
                        size="xs"
                        icon="trash"
                        className="my-0.5 ml-auto opacity-50 transition-opacity group-hover:opacity-100"
                        onClick={async () => {
                          await protoFilesKv.set(protoFiles.filter((p) => p !== f));
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {reflectionUnimplemented && protoFiles.length === 0 && (
          <Banner>
            <InlineCode>{request.url}</InlineCode> {t("request:grpc.noReflectionBefore")}{" "}
            <Link href="https://github.com/grpc/grpc/blob/9aa3c5835a4ed6afae9455b63ed45c761d695bca/doc/server-reflection.md">
              {t("request:grpc.serverReflection")}
            </Link>{" "}
            {t("request:grpc.noReflectionAfterBefore")} <InlineCode>.proto</InlineCode>{" "}
            {t("request:grpc.noReflectionAfter")}
          </Banner>
        )}
      </VStack>
    </VStack>
  );
}
