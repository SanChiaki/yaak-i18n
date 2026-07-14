import { formatSize } from "@yaakapp-internal/lib/formatSize";
import { useTranslation } from "react-i18next";

interface Props {
  contentLength: number;
  contentLengthCompressed?: number | null;
}

export function SizeTag({ contentLength, contentLengthCompressed }: Props) {
  const { t } = useTranslation();
  return (
    <span
      className="font-mono"
      title={
        t("common:size.bytes", { count: contentLength }) +
        (contentLengthCompressed
          ? `\n${t("common:size.bytesCompressed", { count: contentLengthCompressed })}`
          : "")
      }
    >
      {formatSize(contentLength)}
    </span>
  );
}
