import './stimulus_bootstrap';

import './styles/app.css';

import { registerVueControllerComponents } from '@symfony/ux-vue';
import type { App } from 'vue';
import { createI18nInstance } from './vue/i18n';

type VueBeforeMountEvent = CustomEvent<{
    componentName: string;
    props: Record<string, unknown>;
    app: App;
}>;

registerVueControllerComponents(require.context('./vue/controllers', true, /\.vue$/));

document.addEventListener('vue:before-mount', (event) => {
    const { detail } = event as VueBeforeMountEvent;
    detail.app.use(createI18nInstance());
});
