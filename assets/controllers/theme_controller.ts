import { Controller } from '@hotwired/stimulus';

/*
  Controls initial theme (mode/color/direction) for the UI based on
  data-* values set on <body> by templates/base.html.twig.

  Usage (already present):
  <body
    data-controller="theme"
    data-theme-mode-value="dark|light"
    data-theme-color-value="red|blue|..."
    data-theme-direction-value="ltr|rtl">
  </body>
*/

export default class extends Controller<HTMLBodyElement> {
  static values = {
    mode: String,
    color: String,
    direction: String,
  };

  declare modeValue: string;
  declare colorValue: string;
  declare directionValue: string;

  connect() {
    this.applyDirection();
    this.applyMode();
    this.applyColor();
  }

  private applyDirection() {
    const dir = (this.directionValue || 'ltr').toLowerCase();
    document.documentElement.setAttribute('dir', dir === 'rtl' ? 'rtl' : 'ltr');
  }

  private applyMode() {
    const mode = (this.modeValue || 'dark').toLowerCase();
    const root = document.documentElement;

    if (mode === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }

  private applyColor() {
    const color = (this.colorValue || 'red').toLowerCase();
    // Base template already sets data-theme on <html>; keep it in sync.
    document.documentElement.setAttribute('data-theme', color);
  }
}
