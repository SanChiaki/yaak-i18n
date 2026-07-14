import type { HttpRequest } from "@yaakapp-internal/models";
import { Banner, HStack, InlineCode, VStack } from "@yaakapp-internal/ui";
import mime from "mime";
import { useTranslation } from "react-i18next";
import { useKeyValue } from "../hooks/useKeyValue";
import { Button } from "./core/Button";
import { SelectFile } from "./SelectFile";

type Props = {
  requestId: string;
  contentType: string | null;
  body: HttpRequest["body"];
  onChange: (body: HttpRequest["body"]) => void;
  onChangeContentType: (contentType: string | null) => void;
};

export function BinaryFileEditor({
  contentType,
  body,
  onChange,
  onChangeContentType,
  requestId,
}: Props) {
  const { t } = useTranslation();
  const ignoreContentType = useKeyValue<boolean>({
    namespace: "global",
    key: ["ignore_content_type", requestId],
    fallback: false,
  });

  const handleChange = async ({ filePath }: { filePath: string | null }) => {
    await ignoreContentType.set(false);
    onChange({ filePath: filePath ?? undefined });
  };

  const filePath = typeof body.filePath === "string" ? body.filePath : null;
  const mimeType = mime.getType(filePath ?? "") ?? "application/octet-stream";

  return (
    <VStack space={2}>
      <SelectFile onChange={handleChange} filePath={filePath} />
      {filePath != null && mimeType !== contentType && !ignoreContentType.value && (
        <Banner className="mt-3 !py-5">
          <div className="mb-4 text-center">
            <div>{t("request:binary.setContentType")}</div>
            <InlineCode>{mimeType}</InlineCode> {t("request:binary.forCurrentRequest")}
          </div>
          <HStack space={1.5} justifyContent="center">
            <Button size="sm" variant="border" onClick={() => ignoreContentType.set(true)}>
              {t("request:binary.ignore")}
            </Button>
            <Button
              variant="solid"
              color="primary"
              size="sm"
              onClick={() => onChangeContentType(mimeType)}
            >
              {t("request:binary.setHeader")}
            </Button>
          </HStack>
        </Banner>
      )}
    </VStack>
  );
}
