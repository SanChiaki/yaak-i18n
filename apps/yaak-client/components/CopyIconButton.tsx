import { IconButton, type IconButtonProps, useTimedBoolean } from "@yaakapp-internal/ui";
import { useTranslation } from "react-i18next";
import { copyToClipboard } from "../lib/copy";
import { showToast } from "../lib/toast";

interface Props extends Omit<IconButtonProps, "onClick" | "icon"> {
  text: string | (() => Promise<string | null>);
}

export function CopyIconButton({ text, ...props }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useTimedBoolean();
  return (
    <IconButton
      {...props}
      icon={copied ? "check" : "copy"}
      showConfirm
      onClick={async () => {
        const content = typeof text === "function" ? await text() : text;
        if (content == null) {
          showToast({
            id: "failed-to-copy",
            color: "danger",
            message: t("common:failedToCopy"),
          });
        } else {
          copyToClipboard(content, { disableToast: true });
          setCopied();
        }
      }}
    />
  );
}
