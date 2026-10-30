// Markdown plugin: links to other sites open in a new tab.
const SITE = 'https://sserh1.github.io';

export default {
  name: 'external-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const href = String(node.properties?.href ?? '');
      if (!/^https?:\/\//.test(href) || href.startsWith(SITE)) return;
      ctx.setProperty(node, 'target', '_blank');
      ctx.setProperty(node, 'rel', ['noopener', 'noreferrer']);
    },
  },
};
