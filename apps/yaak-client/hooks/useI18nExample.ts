import { useTranslation } from "react-i18next";

/**
 * Example hook showing how to use translations in components
 *
 * Usage:
 * ```tsx
 * const { t } = useTranslation();
 *
 * // Simple translation
 * <button>{t('common:save')}</button>
 *
 * // Translation with namespace
 * <h1>{t('settings:title')}</h1>
 *
 * // Translation with interpolation
 * <p>{t('workspace:deleteConfirm', { name: 'My Workspace' })}</p>
 *
 * // Translation with default namespace (common)
 * <span>{t('cancel')}</span>
 * ```
 */
export function useI18nExample() {
  const { t, i18n } = useTranslation();

  return {
    t,
    currentLanguage: i18n.language,
    changeLanguage: (lng: string) => i18n.changeLanguage(lng),
  };
}
