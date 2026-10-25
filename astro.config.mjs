import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import codeTheme from './src/code-theme.mjs';

export default defineConfig({
  site: 'https://itsserhii.github.io',
  markdown: {
    // Keep straight quotes and plain dashes: curly ones look off in a monospace font.
    processor: satteri({ features: { smartPunctuation: false } }),
    shikiConfig: { theme: codeTheme },
  },
});
