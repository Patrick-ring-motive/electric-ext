'use strict';

const assert = require('node:assert/strict');
const {
  rules
} = require('../src/colors');

function matches(ruleName, text) {
  const rule = rules.find(({
    name
  }) => name === ruleName);
  rule.pattern.lastIndex = 0;
  return [...text.matchAll(rule.pattern)].map((match) => match[0]);
}

assert.deepEqual(matches('blue', String.raw`\b B blue Blueberry`), [
  String.raw`\b`,
  'B',
  'blue',
  'Blueberry',
]);
assert.deepEqual(matches('blue', 'table subtle'), []);
assert.deepEqual(matches('angle', '<div> <= >'), ['<', '>', '<', '>']);
assert.deepEqual(matches('symbol', String.raw`\b`), []);
assert.deepEqual(matches('symbol', String.raw`\d + \B`), ['\\', '+']);
assert.deepEqual(matches('symbol', '<>'), []);
const angleRule = rules.find(({
  name
}) => name === 'angle');
assert.equal(angleRule.color, 'orange');
const symbolRule = rules.find(({
  name
}) => name === 'symbol');
assert.equal(symbolRule.filter('+'), 'hue-rotate(11deg)');
assert.equal(symbolRule.filter('😀'), 'hue-rotate(224deg)');
assert.ok(
  rules.findIndex(({
    name
  }) => name === 'symbol') <
  rules.findIndex(({
    name
  }) => name === 'blue'),
);

console.log('color tests passed');
