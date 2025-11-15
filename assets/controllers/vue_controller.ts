import { Controller } from '@hotwired/stimulus';
import { createApp, type App as VueApp } from 'vue';
import { createI18nInstance } from '../vue/i18n';

export default class extends Controller {
  static values = {
    component: String,
    props: Object,
  };

  componentValue!: string;
  propsValue?: object;
  private vueApp?: VueApp;

  async connect() {
    const { default: component } = await import(`../vue/pages/${this.componentValue}.vue`);
    const props = this.normalizeProps(this.propsValue);
    this.vueApp = createApp(component, props);

    const i18n = createI18nInstance();

    this.vueApp.use(i18n);
    this.vueApp.mount(this.element);
  }

  disconnect() {
    if (this.vueApp) {
      this.vueApp.unmount();
      this.vueApp = undefined;
    }
  }

  private normalizeProps(props: object | undefined): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};

    if (!props) {
      return normalized;
    }

    Object.entries(props).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        const decoded = this.decodeHtmlEntities(trimmed);

        if (
          (decoded.startsWith('{') && decoded.endsWith('}')) ||
          (decoded.startsWith('[') && decoded.endsWith(']'))
        ) {
          try {
            normalized[key] = JSON.parse(decoded);
            return;
          } catch {
            // fall through to assign raw value
          }
        }

        normalized[key] = decoded;

        return;
      }

      normalized[key] = value;
    });

    return normalized;
  }

  private decodeHtmlEntities(value: string): string {
    return value
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }

}
