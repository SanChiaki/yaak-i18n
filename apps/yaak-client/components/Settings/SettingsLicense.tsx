import { openUrl } from "@tauri-apps/plugin-opener";
import { useLicense } from "@yaakapp-internal/license";
import { Banner, HStack, Icon, VStack } from "@yaakapp-internal/ui";
import { differenceInDays } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToggle } from "../../hooks/useToggle";
import { CargoFeature } from "../CargoFeature";
import { Button } from "../core/Button";
import { Link } from "../core/Link";
import { PlainInput } from "../core/PlainInput";
import { Separator } from "../core/Separator";

export function SettingsLicense() {
  return (
    <CargoFeature feature="license">
      <SettingsLicenseCmp />
    </CargoFeature>
  );
}

function SettingsLicenseCmp() {
  const { t, i18n } = useTranslation();
  const { check, activate, deactivate } = useLicense();
  const [key, setKey] = useState<string>("");
  const [activateFormVisible, toggleActivateFormVisible] = useToggle(false);

  if (check.isPending) {
    return null;
  }

  const renderBanner = () => {
    if (!check.data) return null;

    switch (check.data.status) {
      case "active":
        return <Banner color="success">{t("settings:license.active")} 🥳</Banner>;

      case "trialing":
        return (
          <Banner color="info" className="max-w-lg">
            <p className="w-full">
              <strong>
                {t("settings:license.trialDays", {
                  count: differenceInDays(check.data.data.end, new Date()),
                })}
              </strong>{" "}
              {t("settings:license.trialRemaining")}
              <br />
              <span className="opacity-50">{t("settings:license.personalAlwaysFree")}</span>
              <Separator className="my-2" />
              <div className="flex flex-wrap items-center gap-x-2 text-sm text-notice">
                <Link noUnderline href={`https://yaak.app/pricing?s=learn&t=${check.data.status}`}>
                  {t("settings:license.learnMore")}
                </Link>
              </div>
            </p>
          </Banner>
        );

      case "personal_use":
        return (
          <Banner color="notice" className="max-w-lg">
            <p className="w-full">
              {t("settings:license.personalTrialEnded")}
              <br />
              <span className="opacity-50">
                {t("settings:license.personalOnly")}
                <br />
                {t("settings:license.commercialRequired")}
              </span>
              <Separator className="my-2" />
              <div className="flex flex-wrap items-center gap-x-2 text-sm text-notice">
                <Link noUnderline href={`https://yaak.app/pricing?s=learn&t=${check.data.status}`}>
                  {t("settings:license.learnMore")}
                </Link>
              </div>
            </p>
          </Banner>
        );

      case "inactive":
        return (
          <Banner color="danger">
            {t("settings:license.invalidBeforeSignIn")}{" "}
            <Link href="https://yaak.app/dashboard">{t("settings:license.signIn")}</Link>{" "}
            {t("settings:license.invalidAfterSignIn")}
          </Banner>
        );

      case "expired":
        return (
          <Banner color="notice">
            {t("settings:license.expiredBeforeDate")}{" "}
            <strong>
              {new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, {
                dateStyle: "long",
              }).format(new Date(check.data.data.periodEnd))}
            </strong>{" "}
            {t("settings:license.expiredBeforeResubscribe")}{" "}
            <Link href="https://yaak.app/dashboard">{t("settings:license.resubscribe")}</Link>{" "}
            {t("settings:license.expiredAfterResubscribe")}
            {check.data.data.changesUrl && (
              <>
                <br />
                <Link href={check.data.data.changesUrl}>{t("settings:license.whatsNew")}</Link>
              </>
            )}
          </Banner>
        );

      case "past_due":
        return (
          <Banner color="danger">
            <strong>{t("settings:license.paymentAttention")}</strong>
            <br />
            {t("settings:license.reactivateBeforeBilling")}{" "}
            <Link href={check.data.data.billingUrl}>{t("settings:license.updateBilling")}</Link>
            {t("settings:license.reactivateAfterBilling")}
          </Banner>
        );

      case "error":
        return (
          <Banner color="danger">
            {t("settings:license.checkFailed", {
              message: check.data.data.message,
              code: check.data.data.code,
            })}
          </Banner>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      {renderBanner()}

      {check.error && <Banner color="danger">{check.error}</Banner>}
      {activate.error && <Banner color="danger">{activate.error}</Banner>}

      {check.data?.status === "active" ? (
        <HStack space={2}>
          <Button variant="border" color="secondary" size="sm" onClick={() => deactivate.mutate()}>
            {t("settings:license.deactivate")}
          </Button>
          <Button
            color="secondary"
            size="sm"
            onClick={() => openUrl("https://yaak.app/dashboard?s=support&ref=app.yaak.desktop")}
            rightSlot={<Icon icon="external_link" />}
          >
            {t("settings:license.support")}
          </Button>
        </HStack>
      ) : (
        <HStack space={2}>
          <Button variant="border" color="secondary" size="sm" onClick={toggleActivateFormVisible}>
            {t("settings:license.activate")}
          </Button>
          <Button
            size="sm"
            color="primary"
            rightSlot={<Icon icon="external_link" />}
            onClick={() =>
              openUrl(
                `https://yaak.app/pricing?s=purchase&ref=app.yaak.desktop&t=${check.data?.status ?? ""}`,
              )
            }
          >
            {t("settings:license.purchase")}
          </Button>
        </HStack>
      )}

      {activateFormVisible && (
        <VStack
          as="form"
          space={3}
          className="max-w-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            await activate.mutateAsync({ licenseKey: key });
            toggleActivateFormVisible();
          }}
        >
          <PlainInput
            autoFocus
            label={t("settings:license.key")}
            name="key"
            onChange={setKey}
            placeholder="YK1-XXXXX-XXXXX-XXXXX-XXXXX"
          />
          <Button type="submit" color="primary" size="sm" isLoading={activate.isPending}>
            {t("settings:license.submit")}
          </Button>
        </VStack>
      )}
    </div>
  );
}
