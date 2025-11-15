import { startStimulusApp } from '@symfony/stimulus-bridge';

const context = require.context(
    '@symfony/stimulus-bridge/lazy-controller-loader!./controllers',
    true,
    /\.[jt]sx?$/,
);

// Registers Stimulus controllers from controllers.json and in the controllers/ directory
export const app = startStimulusApp(context);

// register any custom, 3rd party controllers here
// app.register('some_controller_name', SomeImportedController);
