import type { FormInput, JsonPrimitive } from "@yaakapp-internal/plugins";
import { HStack } from "@yaakapp-internal/ui";
import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { generateId } from "../../lib/generateId";
import { DynamicForm } from "../DynamicForm";
import { Button } from "./Button";

export interface PromptProps {
  inputs: FormInput[];
  onCancel: () => void;
  onResult: (value: Record<string, JsonPrimitive> | null) => void;
  confirmText?: string;
  cancelText?: string;
  onValuesChange?: (values: Record<string, JsonPrimitive>) => void;
  onInputsUpdated?: (cb: (inputs: FormInput[]) => void) => void;
}

export function Prompt({
  onCancel,
  inputs: initialInputs,
  onResult,
  confirmText,
  cancelText,
  onValuesChange,
  onInputsUpdated,
}: PromptProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState<Record<string, JsonPrimitive>>({});
  const [inputs, setInputs] = useState<FormInput[]>(initialInputs);
  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onResult(value);
    },
    [onResult, value],
  );

  // Register callback for external input updates (from plugin dynamic resolution)
  useEffect(() => {
    onInputsUpdated?.(setInputs);
  }, [onInputsUpdated]);

  // Notify of value changes for dynamic resolution
  useEffect(() => {
    onValuesChange?.(value);
  }, [value, onValuesChange]);

  const id = `prompt.form.${useRef(generateId()).current}`;

  return (
    <form
      className="grid grid-rows-[auto_auto] grid-cols-[minmax(0,1fr)] gap-4 mb-4"
      onSubmit={handleSubmit}
    >
      <DynamicForm inputs={inputs} onChange={setValue} data={value} stateKey={id} />
      <HStack space={2} justifyContent="end">
        <Button onClick={onCancel} variant="border" color="secondary">
          {cancelText || t("common:cancel")}
        </Button>
        <Button type="submit" color="primary">
          {confirmText || t("common:confirm")}
        </Button>
      </HStack>
    </form>
  );
}
