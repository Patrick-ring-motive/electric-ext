'use strict';

const assert = require('node:assert/strict');
const {
  getColorableSpans
} = require('../src/scopes');

function scopedText(text, languageId) {
  return getColorableSpans(text, languageId)
    .map(({
      start,
      end
    }) => text.slice(start, end));
}

assert.deepEqual(
  scopedText('const red = 1; // blue 42\nconst x = "green";', 'javascript'),
  ['// blue 42', '"green"'],
);
assert.deepEqual(
  scopedText('red = 1 # yellow\nblue = "purple"\nx = 3', 'python'),
  ['# yellow', '"purple"'],
);
assert.deepEqual(
  scopedText('red /* green */ blue `orange`', 'typescript'),
  ['/* green */', '`orange`'],
);
assert.deepEqual(scopedText('"red": 1', 'json'), ['"red"']);
assert.deepEqual(
  scopedText('red = 1 # blue\ngreen = "purple"', 'toml'),
  ['# blue', '"purple"'],
);
assert.deepEqual(
  scopedText('red=1 ; blue\ngreen="purple"', 'ini'),
  ['; blue', '"purple"'],
);
assert.deepEqual(
  scopedText('pipeline { // blue\n  agent "green"\n  /* purple */\n}', 'jenkinsfile'),
  ['// blue', '"green"', '/* purple */'],
);
assert.deepEqual(
  scopedText("plugins { id 'red' } // yellow", 'gradle'),
  ["'red'", '// yellow'],
);
assert.deepEqual(scopedText('plain red text', 'unknown'), []);

console.log('scope tests passed');
