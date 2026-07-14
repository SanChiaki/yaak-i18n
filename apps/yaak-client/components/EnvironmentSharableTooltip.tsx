import { useTranslation } from "react-i18next";
import { IconTooltip } from "./core/IconTooltip";

export function EnvironmentSharableTooltip() {
  const { t } = useTranslation();
  return <IconTooltip content={t("workspace:environment.sharableTooltip")} />;
}
