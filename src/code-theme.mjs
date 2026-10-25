// Shiki theme for code blocks: keywords in accent, comments muted italic,
// everything else ink. Colors mirror the tokens in src/styles/global.css.
const ink = '#2A2925';
const muted = '#76726A';
const accent = '#A3502B';

export default {
  name: 'itsserhii',
  type: 'light',
  colors: {
    'editor.background': '#F6F4EE',
    'editor.foreground': ink,
  },
  tokenColors: [
    {
      // Some grammars (JS, Python) tag declaration keywords as `storage.*`.
      scope: [
        'keyword',
        'storage.modifier',
        'storage.type.function',
        'storage.type.class',
        'storage.type.js',
        'storage.type.ts',
        'storage.type.tsx',
        'keyword.operator.new',
        'keyword.operator.expression',
      ],
      settings: { foreground: accent },
    },
    {
      // Symbolic operators (:=, !=, +) stay ink.
      scope: ['keyword.operator'],
      settings: { foreground: ink },
    },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: muted, fontStyle: 'italic' },
    },
  ],
};
