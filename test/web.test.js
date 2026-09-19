'use strict';

const assert = require('node:assert/strict');
const {
  colorize,
  clipboardHtml,
  hueRotatedGreen,
  teamsColor,
} = require('../web/colorizer');

function colored(text) {
  return colorize(text).filter(({
    color
  }) => color);
}

assert.deepEqual(colored(String.raw`\b B blue Blueberry table`), [{
    text: String.raw`\b`,
    color: '#4e4eff'
  },
  {
    text: 'B',
    color: '#4e4eff'
  },
  {
    text: 'blue',
    color: '#4e4eff'
  },
  {
    text: 'Blueberry',
    color: '#4e4eff'
  },
]);
assert.deepEqual(colored('{[()]}<>*•42'), [{
    text: '{',
    color: '#ff79c6'
  },
  {
    text: '[',
    color: '#ba7dff'
  },
  {
    text: '()',
    color: '#ffa500'
  },
  {
    text: ']',
    color: '#ba7dff'
  },
  {
    text: '}',
    color: '#ff79c6'
  },
  {
    text: '<>',
    color: '#ffa500'
  },
  {
    text: '*•',
    color: '#6495ed'
  },
  {
    text: '42',
    color: '#00bfff'
  },
]);
assert.equal(hueRotatedGreen('+'), '#00ff26');
assert.equal(hueRotatedGreen('😀'), '#ff69bb');
assert.equal(colored('😀')[0].color, hueRotatedGreen('😀'));
assert.deepEqual(colored('apple123 _blue xylophone'), [{
    text: '123',
    color: '#00bfff'
  },
  {
    text: '_',
    color: hueRotatedGreen('_')
  },
]);
assert.match(
  clipboardHtml('<Blue & red>'),
  /<font color="#a85c00"><span style="color:#a85c00">&lt;<\/span><\/font><font color="#4e4eff"><span style="color:#4e4eff">Blue<\/span><\/font>/,
);
assert.match(clipboardHtml('<Blue & red>'), /&amp;/);
assert.doesNotMatch(clipboardHtml('<Blue & red>'), /<Blue/);
assert.match(clipboardHtml('a\nb'), /white-space:pre-wrap/);
assert.doesNotMatch(clipboardHtml('plain'), /color:#e6edf3|background/);

const helm = 'component: {{ printf "%s-%s" .Values.frost.nameOverride ' +
  '.Values.frost.instance | trunc 63 | trimSuffix "-" | quote }}';
const helmHtml = clipboardHtml(helm);
for (const expectedColor of ['#b31972', '#7132b8', teamsColor('#00f8ff'), '#006f99', teamsColor('#d6c700')]) {
  assert.match(helmHtml, new RegExp(`<font color="${expectedColor}">`));
}

assert.match(clipboardHtml('yellow green white'), /#806b00|#087f23|#333333/);
assert.equal(colorize('yellow')[0].color, '#ffff00');

console.log('web colorizer tests passed');
