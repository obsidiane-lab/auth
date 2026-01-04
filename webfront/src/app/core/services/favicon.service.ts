import { Injectable, effect, inject } from '@angular/core';
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root',
})
export class FaviconService {
  private readonly themeService = inject(ThemeService);

  private readonly colorMap: Record<string, string> = {
    'base': '#E11D48',
    'violet': '#6E56CF',
    'red': '#CC0033',
    'blue': '#2490FF',
    'orange': '#EA580C',
    'yellow': '#FACC15',
    'green': '#22C55E',
    'cyan': '#06b6d4',
    'rose': '#f43f5e'
  };

  private readonly keySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="COLOR">
<path fill-rule="evenodd" d="M15.75 1.5a6.75 6.75 0 0 0-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 0 0-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 0 0 .75-.75v-1.5h1.5A.75.75 0 0 0 9 19.5V18h1.5a.75.75 0 0 0 .53-.22l2.658-2.658c.19-.189.517-.288.906-.22A6.75 6.75 0 1 0 15.75 1.5Zm0 3a.75.75 0 0 0 0 1.5A2.25 2.25 0 0 1 18 8.25a.75.75 0 0 0 1.5 0 3.75 3.75 0 0 0-3.75-3.75Z" clip-rule="evenodd"/>
</svg>`;

  constructor() {
    effect(() => {
      const theme = this.themeService.theme();
      this.updateFavicon(theme.color);
    });
  }

  private updateFavicon(themeColor: string): void {
    const color = this.colorMap[themeColor] || this.colorMap['base'];
    const svg = this.keySvg.replace('COLOR', color);

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    if (link.href.startsWith('blob:')) {
      URL.revokeObjectURL(link.href);
    }

    link.type = 'image/svg+xml';
    link.href = url;
  }
}
