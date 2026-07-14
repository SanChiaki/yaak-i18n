import { VStack } from "@yaakapp-internal/ui";
import { useTranslation } from "react-i18next";

export function EncryptionHelp() {
  const { t } = useTranslation();
  return (
    <VStack space={3}>
      <p>{t("workspace:encryption.helpEnable")}</p>
      <p>{t("workspace:encryption.helpSharing")}</p>
    </VStack>
  );
}
