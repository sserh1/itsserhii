// Shiki theme for code blocks: keywords in accent, comments muted italic,
// everything else ink. Shiki needs real hex colors to tokenize, so the theme
// uses the light palette and `colorReplacements` swaps each one for its CSS
// token: code blocks then follow the light/dark theme in global.css.
const ink = '#2a2925';
const muted = '#76726a';
const accent = '#a3502b';
const codeBg = '#f6f4ee';

export default {
  name: 'itsserhii',
  type: 'light',
  colors: {
    'editor.background': codeBg,
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
  // Keys must be lowercase: Shiki lowercases colors before looking them up.
  colorReplacements: {
    [ink]: 'var(--ink)',
    [muted]: 'var(--muted)',
    [accent]: 'var(--accent)',
    [codeBg]: 'var(--code-bg)',
  },
};
