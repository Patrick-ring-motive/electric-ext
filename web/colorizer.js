'use strict';

(function exposeElectricColor(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  (root ?? {}).ElectricColor = api;
})(typeof globalThis === 'object' ? globalThis : this, () => {
  const colors = {
    star: '#6495ed',
    curly: '#ff79c6',
    square: '#ba7dff',
    paren: '#ffa500',
    angle: '#ffa500',
    number: '#00bfff',
    yellow: '#ffff00',
    red: '#ff0000',
    green: '#00ff00',
    blue: '#4e4eff',
    orange: '#ffa500',
    pink: '#ff69b4',
    purple: '#ba7dff',
    white: '#ffffff',
    x: '#ffffff',
  };

  // Teams messages commonly render on a white background. Keep the vivid
  // preview palette, but use higher-contrast variants in copied rich text.
  const teamsColors = {
    '#6495ed': '#315fba',
    '#ff79c6': '#b31972',
    '#ba7dff': '#7132b8',
    '#ffa500': '#a85c00',
    '#00bfff': '#006f99',
    '#ffff00': '#806b00',
    '#ff0000': '#c00000',
    '#00ff00': '#087f23',
    '#ff69b4': '#ad1457',
    '#ffffff': '#333333',
  };

  const fixedRules = [
    ['star', /^[*•]+/u],
    ['curly', /^[{}‘’']+/u],
    ['square', /^[\[\]“”"]+/u],
    ['paren', /^[()]+/u],
    ['angle', /^[<>]+/u],
    ['number', /^[0-9]+/u],
  ];

  const wordRules = [
    ['yellow', /^(?:Y|Yellows?|banana[a-z]*|lemons?|corn|maize)$/i],
    ['red', /^(?:R|Reds?|Apple[a-z]*|tomatoe?s?|strawberry|strawberries)$/i],
    ['green', /^(?:G|Green[a-z]*|plants?|trees?|leaf|limes?|lettuce|vegetables?)$/i],
    ['blue', /^(?:B|Blue[a-z]*)$/i],
    ['orange', /^(?:O|Oranges?|pumpkins?)$/i],
    ['pink', /^(?:P|Pinks?|Magentas?)$/i],
    ['purple', /^(?:V|Violets?|Purples?|grapes?|eggplants?)$/i],
    ['white', /^(?:W|Whites?)$/i],
    ['x', /^x$/i],
  ];

  const asciiLetter = /[A-Za-z]/;
  const asciiWord = /[A-Za-z0-9_]/;
  const whitespace = /\s/u;

  function channel(value) {
    return Math.round(Math.min(1, Math.max(0, value)) * 255);
  }

  function hexByte(value) {
    return value.toString(16).padStart(2, '0');
  }

  function hueRotatedGreen(character) {
    const degrees = (character.codePointAt(0) * 17) % 360;
    const radians = degrees * Math.PI / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const red = channel(0.715 - 0.715 * cosine - 0.715 * sine);
    const green = channel(0.715 + 0.285 * cosine + 0.140 * sine);
    const blue = channel(0.715 - 0.715 * cosine + 0.715 * sine);
    return `#${hexByte(red)}${hexByte(green)}${hexByte(blue)}`;
  }

  function appendRun(runs, text, color) {
    if (!text) return;
    const previous = runs.at(-1);
    if (previous && previous.color === color) {
      previous.text += text;
    } else {
      runs.push({
        text,
        color
      });
    }
  }

  function colorize(text) {
    const value = String(text ?? '');
    const characters = [...value];
    const runs = [];
    let index = 0;

    while (index < characters.length) {
      const rest = characters.slice(index).join('');
      const character = characters[index];

      if (character === '\\' && /^[bB]$/.test(characters[index + 1] || '')) {
        appendRun(runs, character + characters[index + 1], colors.blue);
        index += 2;
        continue;
      }

      let fixedMatch;
      for (const [name, pattern] of fixedRules) {
        const match = rest.match(pattern);
        if (match) {
          fixedMatch = {
            text: match[0],
            color: colors[name]
          };
          break;
        }
      }
      if (fixedMatch) {
        appendRun(runs, fixedMatch.text, fixedMatch.color);
        index += [...fixedMatch.text].length;
        continue;
      }

      if (asciiLetter.test(character)) {
        let end = index + 1;
        while (end < characters.length && asciiLetter.test(characters[end])) end += 1;
        const word = characters.slice(index, end).join('');
        const leftBoundary = index === 0 || !asciiWord.test(characters[index - 1]);
        const rightBoundary = end === characters.length || !asciiWord.test(characters[end]);
        const rule = leftBoundary && rightBoundary ?
          wordRules.find(([, pattern]) => pattern.test(word)) :
          undefined;
        if (rule) {
          appendRun(runs, word, colors[rule[0]]);
          index = end;
          continue;
        }
      }

      if (whitespace.test(character) || /[A-Za-z0-9]/.test(character)) {
        appendRun(runs, character);
      } else {
        appendRun(runs, character, hueRotatedGreen(character));
      }
      index += 1;
    }

    return runs;
  }

  function escapeHtml(text) {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function relativeLuminance(hex) {
    const channels = hex.match(/[0-9a-f]{2}/gi).map((value) => {
      const channel = parseInt(value, 16) / 255;
      return channel <= 0.04045 ?
        channel / 12.92 :
        ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function teamsColor(color) {
    const normalized = color.toLowerCase();
    if (teamsColors[normalized]) return teamsColors[normalized];
    if (!/^#[0-9a-f]{6}$/.test(normalized)) return color;

    let channels = normalized.match(/[0-9a-f]{2}/g).map((value) => parseInt(value, 16));
    let candidate = normalized;
    while (relativeLuminance(candidate) > 0.183) {
      channels = channels.map((value) => Math.floor(value * 0.9));
      candidate = `#${channels.map(hexByte).join('')}`;
    }
    return candidate;
  }

  function runsToHtml(runs, options = {}) {
    const defaultColor = options.defaultColor;
    const palette = options.palette;
    return runs.map(({
      text,
      color
    }) => {
      const safeText = escapeHtml(text);
      if (color) {
        const outputColor = palette ?
          palette[color.toLowerCase()] || teamsColor(color) :
          color;
        // Teams' editor may discard span styles but still honors the HTML
        // color attribute used by Outlook/Word clipboard content.
        return `<font color="${outputColor}"><span style="color:${outputColor}">${safeText}</span></font>`;
      }
      return defaultColor ?
        `<font color="${defaultColor}"><span style="color:${defaultColor}">${safeText}</span></font>` :
        safeText;
    }).join('');
  }

  function clipboardHtml(text, options = {}) {
    const background = options.background;
    const defaultColor = options.defaultColor;
    const content = runsToHtml(colorize(text), {
      defaultColor,
      palette: options.palette || teamsColors,
    });
    const backgroundStyle = background ? `background-color:${background};` : '';
    const defaultColorStyle = defaultColor ? `color:${defaultColor};` : '';
    return `<div style="margin:0;${backgroundStyle}${defaultColorStyle}font-family:Consolas,'Courier New',monospace;font-size:14px;line-height:1.5;white-space:pre-wrap">${content}</div>`;
  }

  return {
    colorize,
    runsToHtml,
    clipboardHtml,
    hueRotatedGreen,
    teamsColor,
    teamsColors,
  };
});
