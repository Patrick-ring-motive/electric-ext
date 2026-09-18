'use strict';

const vscode = require('vscode');
const {
  rules
} = require('./colors');
const {
  getColorableSpans
} = require('./scopes');

const decorations = new Map();
let enabled = true;
let subscriptions;

function getDecoration(rule, filter) {
  const key = filter ? `${rule.name}:${filter}` : rule.name;
  if (!decorations.has(key)) {
    const decoration = vscode.window.createTextEditorDecorationType({
      color: rule.color,
      ...(filter && {
        textDecoration: `none; filter: ${filter}`
      }),
    });
    decorations.set(key, decoration);
    subscriptions.push(decoration);
  }
  return decorations.get(key);
}

function getMode(editor) {
  const configuration = vscode.workspace.getConfiguration('electricColor');
  const languageId = editor.document.languageId;
  const languages = configuration.get('languages', ['*']);
  if (languages.includes('*') || languages.includes(languageId)) {
    return 'document';
  }
  if (configuration.get('scopedLanguages', []).includes(languageId)) {
    return 'scoped';
  }
  return undefined;
}

function clear(editor) {
  for (const decoration of decorations.values()) {
    editor.setDecorations(decoration, []);
  }
}

function update(editor = vscode.window.activeTextEditor) {
  if (!editor) {
    return;
  }

  clear(editor);
  const mode = getMode(editor);
  if (!enabled || !mode) {
    return;
  }

  const text = editor.document.getText();
  const spans = mode === 'document' ?
    [{
      start: 0,
      end: text.length
    }] :
    getColorableSpans(text, editor.document.languageId);

  for (const rule of rules) {
    const rangesByDecoration = new Map();
    for (const span of spans) {
      const scopedText = text.slice(span.start, span.end);
      rule.pattern.lastIndex = 0;
      for (const match of scopedText.matchAll(rule.pattern)) {
        const matchOffset = span.start + match.index;
        const parts = rule.filter ? [...match[0]] : [match[0]];
        let partOffset = matchOffset;

        for (const part of parts) {
          const decoration = getDecoration(rule, rule.filter?.(part));
          const ranges = rangesByDecoration.get(decoration) || [];
          const start = editor.document.positionAt(partOffset);
          const end = editor.document.positionAt(partOffset + part.length);
          ranges.push(new vscode.Range(start, end));
          rangesByDecoration.set(decoration, ranges);
          partOffset += part.length;
        }
      }
    }

    for (const [decoration, ranges] of rangesByDecoration) {
      editor.setDecorations(decoration, ranges);
    }
  }
}

function activate(context) {
  subscriptions = context.subscriptions;
  for (const rule of rules.filter(({
      filter
    }) => !filter)) {
    getDecoration(rule);
  }

  let timer;
  const scheduleUpdate = (editor = vscode.window.activeTextEditor) => {
    clearTimeout(timer);
    timer = setTimeout(() => update(editor), 75);
  };

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => update(editor)),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document === vscode.window.activeTextEditor?.document) {
        scheduleUpdate();
      }
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('electricColor')) {
        update();
      }
    }),
    vscode.commands.registerCommand('electricColor.toggle', () => {
      enabled = !enabled;
      update();
      vscode.window.setStatusBarMessage(
        `Electric Color: ${enabled ? 'enabled' : 'disabled'}`,
        2000,
      );
    }), {
      dispose: () => clearTimeout(timer)
    },
  );

  update();
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
