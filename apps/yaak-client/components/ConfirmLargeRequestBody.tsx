import type { HttpRequest } from "@yaakapp-internal/models";
import { patchModel } from "@yaakapp-internal/models";
import { Banner, HStack, InlineCode } from "@yaakapp-internal/ui";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useToggle } from "../hooks/useToggle";
import { showConfirm } from "../lib/confirm";
import { Button } from "./core/Button";
import { Link } from "./core/Link";
import { SizeTag } from "./core/SizeTag";

interface Props {
  children: ReactNode;
  request: HttpRequest;
}

const LARGE_TEXT_BYTES = 2 * 1000 * 1000;

export function ConfirmLargeRequestBody({ children, request }: Props) {
  const { t } = useTranslation();
  const [showLargeResponse, toggleShowLargeResponse] = useToggle();

  if (request.body?.text == null) {
    return children;
  }

  const contentLength = request.body.text.length ?? 0;
  const tooLargeBytes = LARGE_TEXT_BYTES;
  const isLarge = contentLength > tooLargeBytes;
  if (!showLargeResponse && isLarge) {
    return (
      <Banner color="primary" className="flex flex-col gap-3">
        <p>
          {t("request:large.renderingOver")}{" "}
          <InlineCode>
            <SizeTag contentLength={tooLargeBytes} />
          </InlineCode>{" "}
          {t("request:large.performanceImpact")}
        </p>
        <p>
          {t("request:large.see")}{" "}
          <Link href="https://feedback.yaak.app/en/help/articles/1198684-working-with-large-values">
            {t("request:large.guide")}
          </Link>{" "}
          {t("request:large.forTips")}
        </p>
        <HStack wrap space={2}>
          <Button color="primary" size="xs" onClick={toggleShowLargeResponse}>
            {t("request:large.revealBody")}
          </Button>
          <Button
            color="danger"
            size="xs"
            variant="border"
            onClick={async () => {
              const confirm = await showConfirm({
                id: `delete-body-${request.id}`,
                confirmText: t("request:large.deleteBody"),
                title: t("request:large.deleteBodyText"),
                description: t("request:large.deleteBodyDescription"),
                color: "danger",
              });
              if (confirm) {
                await patchModel(request, { body: { ...request.body, text: "" } });
              }
            }}
          >
            {t("request:large.deleteBody")}
          </Button>
        </HStack>
      </Banner>
    );
  }

  return <>{children}</>;
}
