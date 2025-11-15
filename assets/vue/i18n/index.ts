import { createI18n } from 'vue-i18n';
import { messages } from './messages';

export const supportedLocales = Object.keys(messages);
export const defaultLocale = 'fr';
export const fallbackLocale = 'fr';

export function createI18nInstance(locale: string = defaultLocale) {
  const normalized = supportedLocales.includes(locale) ? locale : defaultLocale;

  return createI18n({
    legacy: false,
    globalInjection: true,
    locale: normalized,
    fallbackLocale,
    messages,
    warnHtmlMessage: false,
    flatJson: true,
  });
}
