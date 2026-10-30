import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import codeTheme from './src/code-theme.mjs';
import externalLinks from './src/external-links.mjs';

export default defineConfig({
  site: 'https://sserh1.github.io',
  // About moved to the root page.
  redirects: { '/about': '/' },
  markdown: {
    // Keep straight quotes and plain dashes: curly ones look off in a monospace font.
    processor: satteri({ features: { smartPunctuation: false }, hastPlugins: [externalLinks] }),
    shikiConfig: { theme: codeTheme },
  },
});
