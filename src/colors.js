'use strict';

const rules = [
  { name: 'star', pattern: /[\*•]+/g, color: 'cornflowerblue' },
  { name: 'curly', pattern: /[\{\}‘’']+/g, color: '#ff79c6' },
  { name: 'square', pattern: /[\[\]“”"]+/g, color: '#ba7dff' },
  { name: 'paren', pattern: /[\(\)]+/g, color: 'orange' },
  { name: 'angle', pattern: /[<>]+/g, color: 'orange' },
  { name: 'number', pattern: /[0-9]+/g, color: 'deepskyblue' },
  {
    name: 'symbol',
    pattern: /(?:\\(?!b)|[^a-zA-Z0-9\s*•{}‘’'\[\]“”"()<>\\])+/gi,
    color: '#00ff00',
    filter: (x) => `hue-rotate(${(x.codePointAt(0) * 17) % 360}deg)`,
  },
  { name: 'yellow', pattern: /\b(Y|Yellows?|banana[a-z]*|lemons?|corn|maize)\b/gi, color: 'yellow' },
  { name: 'red', pattern: /\b(R|Reds?|Apple[a-z]*|tomatoe?s?|strawberry|strawberries)\b/gi, color: 'red' },
  { name: 'green', pattern: /\b(G|Green[a-z]*|plants?|trees?|leaf|limes?|lettuce|vegetables?)\b/gi, color: '#00ff00' },
  { name: 'blue', pattern: /(?:\\b|\b(?:B|Blue[a-z]*)\b)/gi, color: '#4e4eff' },
  { name: 'orange', pattern: /\b(O|Oranges?|pumpkins?)\b/gi, color: 'orange' },
  { name: 'pink', pattern: /\b(P|Pinks?|Magentas?)\b/gi, color: '#ff69b4' },
  { name: 'purple', pattern: /\b(V|Violets?|Purples?|grapes?|eggplants?)\b/gi, color: '#ba7dff' },
  { name: 'white', pattern: /\b(W|Whites?)\b/gi, color: '#ffffff' },
  { name: 'x', pattern: /\bx\b/gi, color: '#ffffff' },
];

module.exports = { rules };
