'use strict';

const profiles = {
  javascript: { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'", '`'] },
  javascriptreact: { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'", '`'] },
  typescript: { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'", '`'] },
  typescriptreact: { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'", '`'] },
  java: { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'"] },
  c: { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'"] },
  cpp: { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'"] },
  csharp: { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'"] },
  go: { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'", '`'] },
  rust: { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'"] },
  groovy: { line: ['//'], block: [['/*', '*/']], quotes: ['"""', "'''", '"', "'"] },
  jenkinsfile: { line: ['//'], block: [['/*', '*/']], quotes: ['"""', "'''", '"', "'"] },
  gradle: { line: ['//'], block: [['/*', '*/']], quotes: ['"""', "'''", '"', "'"] },
  css: { line: [], block: [['/*', '*/']], quotes: ['"', "'"] },
  scss: { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'"] },
  less: { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'"] },
  json: { line: [], block: [], quotes: ['"'] },
  jsonc: { line: ['//'], block: [['/*', '*/']], quotes: ['"'] },
  toml: { line: ['#'], block: [], quotes: ['"""', "'''", '"', "'"] },
  ini: { line: [';', '#'], block: [], quotes: ['"', "'"] },
  properties: { line: ['#', '!'], block: [], quotes: ['"', "'"] },
  dotenv: { line: ['#'], block: [], quotes: ['"', "'"] },
  conf: { line: ['#', ';'], block: [], quotes: ['"', "'"] },
  python: { line: ['#'], block: [], quotes: ['"""', "'''", '"', "'"] },
  ruby: { line: ['#'], block: [], quotes: ['"', "'"] },
  shellscript: { line: ['#'], block: [], quotes: ['"', "'", '`'] },
  yaml: { line: ['#'], block: [], quotes: ['"', "'"] },
  dockerfile: { line: ['#'], block: [], quotes: ['"', "'"] },
  html: { line: [], block: [['<!--', '-->']], quotes: ['"', "'"] },
  xml: { line: [], block: [['<!--', '-->']], quotes: ['"', "'"] },
  php: { line: ['//', '#'], block: [['/*', '*/']], quotes: ['"', "'"] },
  swift: { line: ['//'], block: [['/*', '*/']], quotes: ['"'] },
  kotlin: { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'"] },
};

function earliestAt(text, index, candidates) {
  return candidates.find((candidate) => text.startsWith(candidate, index));
}

function findQuotedEnd(text, start, delimiter) {
  let index = start + delimiter.length;
  while (index < text.length) {
    if (text[index] === '\\') {
      index += 2;
      continue;
    }
    if (text.startsWith(delimiter, index)) {
      return index + delimiter.length;
    }
    index += 1;
  }
  return text.length;
}

function getColorableSpans(text, languageId) {
  const profile = profiles[languageId];
  if (!profile) {
    return [];
  }

  const spans = [];
  let index = 0;
  while (index < text.length) {
    const lineStart = earliestAt(text, index, profile.line);
    if (lineStart) {
      const end = text.indexOf('\n', index + lineStart.length);
      const stop = end === -1 ? text.length : end;
      spans.push({ start: index, end: stop });
      index = stop;
      continue;
    }

    const block = profile.block.find(([start]) => text.startsWith(start, index));
    if (block) {
      const end = text.indexOf(block[1], index + block[0].length);
      const stop = end === -1 ? text.length : end + block[1].length;
      spans.push({ start: index, end: stop });
      index = stop;
      continue;
    }

    const quote = earliestAt(text, index, profile.quotes);
    if (quote) {
      const stop = findQuotedEnd(text, index, quote);
      spans.push({ start: index, end: stop });
      index = stop;
      continue;
    }

    index += 1;
  }

  return spans;
}

module.exports = { getColorableSpans, profiles };
