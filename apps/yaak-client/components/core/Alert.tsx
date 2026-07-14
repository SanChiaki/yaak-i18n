import { HStack, VStack } from "@yaakapp-internal/ui";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";

export interface AlertProps {
  onHide: () => void;
  body: ReactNode;
}

export function Alert({ onHide, body }: AlertProps) {
  const { t } = useTranslation();
  return (
    <VStack space={3} className="pb-4">
      <div>{body}</div>
      <HStack space={2} justifyContent="end">
        <Button className="focus" color="primary" onClick={onHide}>
          {t("common:ok")}
        </Button>
      </HStack>
    </VStack>
  );
}
