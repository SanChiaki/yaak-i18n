import type { HttpRequest } from "@yaakapp-internal/models";
import { patchModel } from "@yaakapp-internal/models";
import classNames from "classnames";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { showPrompt } from "../lib/prompt";
import { Button } from "./core/Button";
import type { DropdownItem } from "./core/Dropdown";
import { HttpMethodTag, HttpMethodTagRaw } from "./core/HttpMethodTag";
import { Icon } from "@yaakapp-internal/ui";
import type { RadioDropdownItem } from "./core/RadioDropdown";
import { RadioDropdown } from "./core/RadioDropdown";

type Props = {
  request: HttpRequest;
  className?: string;
};

const radioItems: RadioDropdownItem<string>[] = [
  "GET",
  "PUT",
  "POST",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "QUERY",
  "HEAD",
].map((m) => ({
  value: m,
  label: <HttpMethodTagRaw method={m} />,
}));

export const RequestMethodDropdown = memo(function RequestMethodDropdown({
  request,
  className,
}: Props) {
  const { t } = useTranslation();
  const handleChange = useCallback(
    async (method: string) => {
      await patchModel(request, { method });
    },
    [request],
  );

  const itemsAfter = useMemo<DropdownItem[]>(
    () => [
      {
        key: "custom",
        label: "CUSTOM",
        leftSlot: <Icon icon="sparkles" />,
        onSelect: async () => {
          const newMethod = await showPrompt({
            id: "custom-method",
            label: t("request:method.httpMethod"),
            title: t("request:method.customMethod"),
            confirmText: t("common:save"),
            description: t("request:method.customDescription"),
            placeholder: "CUSTOM",
          });
          if (newMethod == null) return;
          await handleChange(newMethod);
        },
      },
    ],
    [handleChange, t],
  );

  return (
    <RadioDropdown
      value={request.method}
      items={radioItems}
      itemsAfter={itemsAfter}
      onChange={handleChange}
    >
      <Button size="xs" className={classNames(className, "text-text-subtle hover:text")}>
        <HttpMethodTag request={request} noAlias />
      </Button>
    </RadioDropdown>
  );
});
