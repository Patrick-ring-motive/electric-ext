(() => {
  const rules = {
    yellow: [/\b(Yellows?|banana[a-z]*|lemons?|corn|maize)\b/i, "yellow"],
    red: [/\b(Reds?|Apple[a-z]*|tomatoe?s?|strawberry|strawberries)\b/i, "red"],
    green: [/\b(Green[a-z]*|plants?|trees?|leaf|limes?|lettuce|vegetables?)\b/i, "#00ff00"],
    blue: [/\b(Blue[a-z]*)\b/i, "#4e4eff"],
    orange: [/\b(Oranges?|pumpkins?)\b/i, "orange"],
    pink: [/\b(Pinks?|Magentas?)\b/i, "#FF69B4"],
    purple: [/\b(Violets?|Purples?|grapes?|eggplants?)\b/i, "#ba7dff"],
    white: [/\b(Whites?)\b/i, "#ffffff"],
    x: [/(\bx\b)/i, "#ffffff"],
    symbol: [
      /[^a-zA-Z0-9\s*•{}‘’'\[\]“”"()]+/,
      "#00ff00",
      x => `hue-rotate(${(x.codePointAt(0) * 17) % 360}deg)`,
    ],
    star: [/[\*•]+/, "cornflowerblue"],
    curly: [/[\{\}‘’']+/, "#ff79c6"],
    square: [/[\[\]“”""]+/, "#ba7dff"],
    paren: [/[\(\)]+/, "orange"],
    number: [/[0-9]+/, "deepskyblue"],
  };
  const allPattern = new RegExp(
    Object.values(rules).map(([pattern]) => pattern.source).join("|"),
    "gi",
  );
  const getRule = text => {
    for (const [pattern, color, filter] of Object.values(rules)) {
      if (pattern.test(text)) return {
        color,
        filter
      };
    }
    return {};
  };
  const getRuns = text => {
    const value = String(text);
    const runs = [];
    let offset = 0;
    for (const match of value.matchAll(allPattern)) {
      if (match.index > offset) {
        runs.push({
          text: value.slice(offset, match.index)
        });
      }
      const rule = getRule(match[0]);
      const parts = rule.filter ? [...match[0]] : [match[0]];
      for (const part of parts) {
        runs.push({
          text: part,
          color: rule.color,
          filter: rule.filter?.(part),
        });
      }
      offset = match.index + match[0].length;
    }
    if (offset < value.length) runs.push({
      text: value.slice(offset)
    });
    return runs;
  };

  const context = globalThis.CanvasRenderingContext2D?.prototype;
  if (!context) return;

  for (const method of ["fillText", "strokeText"]) {
    const nativeDraw = context[method];
    if (!String(nativeDraw).includes("[native code]")) continue;

    context[method] = Object.setPrototypeOf(function drawColoredText(
      text,
      x,
      y,
      maxWidth,
    ) {
      const runs = getRuns(text);
      if (!runs.some(run => run.color)) {
        return nativeDraw.apply(this, arguments);
      }

      const widths = runs.map(run => this.measureText(run.text).width);
      const naturalWidth = widths.reduce((sum, width) => sum + width, 0);
      if (!naturalWidth) return nativeDraw.apply(this, arguments);

      const scale = Number.isFinite(maxWidth) && maxWidth >= 0 ?
        Math.min(1, maxWidth / naturalWidth) :
        1;
      const direction = this.direction === "rtl" ? "rtl" : "ltr";
      const align = this.textAlign === "start" ?
        (direction === "rtl" ? "right" : "left") :
        this.textAlign === "end" ?
        (direction === "rtl" ? "left" : "right") :
        this.textAlign;
      const start = align === "center" ?
        -naturalWidth / 2 :
        align === "right" ?
        -naturalWidth :
        0;
      const styleProperty = method === "fillText" ? "fillStyle" : "strokeStyle";
      const originalStyle = this[styleProperty];
      const originalFilter = this.filter;

      this.save();
      try {
        this.translate(x, 0);
        this.scale(scale, 1);
        this.textAlign = "left";
        let offset = start;
        for (let index = 0; index < runs.length; index += 1) {
          this[styleProperty] = runs[index].color ?? originalStyle;
          this.filter = runs[index].filter ?? originalFilter;
          nativeDraw.call(this, runs[index].text, offset, y);
          offset += widths[index];
        }
      } finally {
        this.restore();
      }
    }, nativeDraw);
  }
})();

(() => {
  const {
    keys,
    values,
    entries
  } = Object;
  const isString = x => typeof x === 'string' || x instanceof String;
  const isObject = x => typeof x === 'object' && x !== null;
  const toArray = x => x?.[Symbol.iterator] ? [...x] : (isObject(x) ? entries(x) : [...String(x)]);
  const stringify = (...args) => {
    const x = args[0];
    try {
      if (isString(x)) {
        return String(x);
      }
      return String(JSON.stringify(...args));
    } catch (e) {
      console.warn(e, ...args.map(Boolean));
      return String(x);
    }
  };
  const re = (...args) => {
    try {
      return RegExp(...args);
    } catch (e) {
      console.warn(e, ...args);
      return RegExp();
    }
  };
  const g = x => re(x, [...new Set(`${x?.flags||''}g`)].join``);
  const _g = x => re(x, String(x?.flags || '').replaceAll('g', ''));
  const rm = (x, y) => String(x).replaceAll(g(y), '');
  const split = (x, y) => String(x).split(_g(y));
  const join = (x = [], y = '') => [...(x[Symbol.iterator] ? x : toArray(x))].map(stringify).join(String(y));
  const test = (x, str) => re(x).test(stringify(str));
  const regexes = {
    star: [/[\*•]+/, 'cornflowerblue'],
    curly: [/[\{\}‘’']+/, '#ff79c6'],
    square: [/[\[\]“”""]+/, '#ba7dff'],
    paren: [/[\(\)]+/, 'orange'],
    number: [/[0-9]+/, 'deepskyblue'],
  };
  const compoundRe = {
    yellow: [/\b(Y|Yellows?|banana[a-z]*|lemons?|corn|maize)\b/i, 'yellow'],
    red: [/\b(R|Reds?|Apple[a-z]*|tomatoe?s?|strawberry|strawberries)\b/i, 'red'],
    green: [/\b(G|Green[a-z]*|plants?|trees?|leaf|limes?|lettuce|vegetables?)\b/i, '#00ff00'],
    blue: [/\b(\\b|B|Blue[a-z]*)\b/i, '#4e4eff'],
    orange: [/\b(O|Oranges?|pumpkins?)\b/i, 'orange'],
    pink: [/\b(P|Pinks?|Magentas?)\b/i, '#FF69B4'],
    purple: [/\b(V|Violets?|Purples?|grapes?|eggplants?)\b/i, '#ba7dff'],
    white: [/\b(W|Whites?)\b/i, '#ffffff'],
    x: [/(\bx\b)/i, '#ffffff'],
    symbol: [re(`[^a-zA-Z0-9\\s${join(values(regexes).map(x =>x[0].source.slice(1,-2)))}]+`), '#00ff00'],
    ...regexes
  };
  const allRegex = re(join(values(compoundRe).map(x => x[0].source), '|'), 'ig');
  const ts = 'black';
  const sz = '0.1ch';
  const matchColor = text => {
    for (const key in compoundRe) {
      if (test(compoundRe[key]?.[0], text)) {
        return {
          key,
          color: compoundRe[key][1]
        };
      }
    }
    return undefined;
  };
  const hueFilter = x => `hue-rotate(${(x.codePointAt(0) * 17) % 360}deg)`;
  globalThis.color ??= (text) =>
    text.replace(allRegex, ch => {
      const matched = matchColor(ch);
      if (!matched) return ch;
      if (matched.key === 'symbol') {
        return [...ch].map(x =>
          `<span class="color-symbol" style="filter:${hueFilter(x)}">${rm(x,/[<>]/g)}</span>`
        ).join('');
      }
      return `<span class="color-${matched.key}">${rm(ch,/[<>]/g)}</span>`;
    });
  const style = document.createElement('style');
  style.textContent = join(keys(compoundRe).map(key =>
    `.color-${key} ${
      rm(stringify({
        color: `${compoundRe[key]?.[1]} !important`,
        "xxtext-shadow": `-${sz} -${sz} 0 ${ts}, ${sz} -${sz} 0 ${ts}, -${sz} ${sz} 0 ${ts}, ${sz} ${sz} 0 ${ts} !important`,
      },null,2),'"').replace(/!important,?/g,'!important;')
    }`), ' ');
  document.firstElementChild.appendChild(style);
})();

(() => {
  let locked;
  const _appendChild = Node.prototype.appendChild;
  const _replaceChild = Node.prototype.replaceChild;

  function wrapTextNodes(root = document.body) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          // Skip empty/whitespace text nodes
          if (!node.nodeValue.trim()) {
            return NodeFilter.FILTER_REJECT;
          }

          const parent = node.parentElement;
          if (!parent) {
            return NodeFilter.FILTER_REJECT;
          }

          // Only text rendered inside a configured scope
          if (!parent.closest(scopeSelector)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip anything under script/style
          if (node.parentNode.closest('script,style,title')) {
            return NodeFilter.FILTER_REJECT;
          }

          // Only direct parents matching :has(*)
          if (!parent.matches(':has(*)')) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];

    // Collect first because replacing mutates the tree
    for (let node;
      (node = walker.nextNode());) {
      nodes.push(node);
    }

    for (const text of nodes) {
      const span = document.createElement('span');
      //  span.setAttribute('asdf','asdf');
      _appendChild.call(span, text.cloneNode());

      _replaceChild.call(text.parentNode, span, text);
    }
  }

  const isString = (x) => typeof x === "string" || x instanceof String;
  const isNull = (x) => x === null || x === undefined;
  const scopeSelector = [
    'code',
    '.icon-label',
    '.rendered-markdown > p',
    '.chat-confirmation-widget-message span:not(:has(*))',
    '.chat-footer-details',
    '.monaco-highlighted-label',
  ].join(', ');
  const scopedLeafSelector = scopeSelector
    .split(', ')
    .flatMap(selector => [
      `${selector}:not(:has(*))`,
      `${selector} *:not(script):not(style):not(link):not(meta):not(title):not(:has(*)):not([class^="color"],[class^="color"] *)`,
    ])
    .join(', ');
  const isInScope = (node) => node?.nodeType === Node.TEXT_NODE ?
    Boolean(node.parentElement?.closest?.(scopeSelector)) :
    Boolean(node?.closest?.(scopeSelector));
  const setHTML = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML").set;
  (() => {
    const skips = ["SCRIPT", "STYLE", "LINK", "META", "TITLE"];
    const skipCss = skips.map((x) => "" + x + ", " + x + " *").join(", ");
    for (const node of [Node, Element, HTMLElement]) {
      for (const method of [
          "appendChild",
          "insertBefore",
          "removeChild",
          "replaceChild",
          "insertAdjacentElement",
          "before",
          "after",
          "replaceWith",
          "prepend",
          "append",
        ]) {
        (() => {
          const _NodeMethod = node.prototype[method];
          if (!_NodeMethod) {
            return;
          }
          if (!String(node.prototype[method]).includes('[native code]')) {
            return;
          }
          node.prototype[method] = Object.setPrototypeOf(function NodeMethod(
            ...args
          ) {
            try {
              if (locked) {
                return _NodeMethod.apply(this, args);
              }
              locked = true;
              if (
                isInScope(this) &&
                (isString(args[0]) || args[0]?.nodeName === "#text") && args[0]?.textContent?.trim?.() &&
                !this?.matches?.(skipCss)
              ) {
                const span = document.createElement("span");
                setHTML.call(span, globalThis.color(args[0].textContent || ""));
                args[0] = span;
              }
              if (
                isInScope(this) &&
                /*["SPAN", "TD","DIV"].includes(args[0]?.tagName) &&*/
                !args[0]?.children?.length
              ) {
                const text = (args[0].textContent || "").trim();
                if (text) {
                  (args?.[0]?.dataset ?? {}).text = text.replaceAll(
                    String.fromCharCode(34),
                    "quote",
                  );
                }
              }
              if (isInScope(this) && isString(args[0]))
                console.log("NodeMethod", method, this, ...args);
              return _NodeMethod.apply(this, args);
            } catch (e) {
              console.warn(e, this, ...args);
              try {
                return _NodeMethod.apply(this, args);
              } catch {
                return this;
              }
            } finally {
              locked = false;
            }
          }, _NodeMethod);
        })();
      }
    }
  })();

  (() => {
    const protoMap = {
      textContent: Node.prototype,
      innerText: HTMLElement.prototype
    };
    for (const txt of ["textContent", "innerText"]) {
      const proto = protoMap[txt];
      const _textContent = Object.getOwnPropertyDescriptor(proto, txt);
      if (!String(_textContent.set).includes('[native code]')) {
        continue;
      }
      Object.defineProperty(proto, txt, {
        ..._textContent,
        set(value) {
          try {
            if (locked) {
              return _textContent.set.call(this, value);
            }
            locked = true;
            if (!isString(value)) {
              if (!isNull(value)) {
                value = String(value);
              } else {
                console.warn("value is null or undefined", this, value);
              }
            }
            if (isInScope(this) && value?.replace) {
              const val = color(value);
              if (val !== value) {
                return setHTML.call(this, val);
              }
            }
            if (_textContent.get.call(this) == value) {
              return _textContent.get.call(this)
            }
            return _textContent.set.call(this, value);
          } catch (e) {
            console.warn(e, this, value);
          } finally {
            locked = false;
          }
        },
      });
    }
  })();

  (() => {
    const _parseFromString = DOMParser.prototype.parseFromString;
    if (!String(_parseFromString).includes('[native code]')) {
      return;
    }
    DOMParser.prototype.parseFromString = function parseFromString(...args) {
      try {
        if (locked) {
          return _parseFromString.apply(this, args);
        }
        locked = true;
        const doc = _parseFromString.apply(this, args);
        let elems = doc.body.querySelectorAll(scopedLeafSelector);
        for (const elem of elems) {
          if (!elem?.children?.length) {
            elem.textContent = (elem.textContent || "");
          }
        }
        return doc;
      } catch (e) {
        console.warn(e, this, ...args);
        return _parseFromString.apply(this, args);
      } finally {
        locked = false;
      }
    };
  })();
  (() => {
    const _insertAdjacentHTML = Element.prototype.insertAdjacentHTML;
    if (!String(_insertAdjacentHTML).includes('[native code]')) {
      return;
    }
    Element.prototype.insertAdjacentHTML = function insertAdjacentHTML(position, text) {
      try {
        if (locked || !isInScope(this)) {
          return _insertAdjacentHTML.call(this, position, text);
        }
        locked = true;
        const parser = new DOMParser();
        const doc = parser.parseFromString(String(text), "text/html");
        text = String(doc.body.innerHTML);
        return _insertAdjacentHTML.call(this, position, text);
      } catch (e) {
        throw e;
      } finally {
        locked = false;
      }
    }
  })();
  (() => {
    const parser = new DOMParser();
    const parse = x => parser.parseFromString(x, "text/html");
    for (const txt of ["innerHTML"]) {
      const _textContent = Object.getOwnPropertyDescriptor(
        Element.prototype,
        txt,
      );
      if (!String(_textContent.set).includes('[native code]')) {
        continue;
      }
      Object.defineProperty(Element.prototype, txt, {
        ..._textContent,
        set(value) {
          try {
            if (locked || !isInScope(this)) {
              return _textContent.set.call(this, value);
            }
            locked = true;
            if (isString(value)) {
              const doc = parse(value);
              value = String(doc.body.innerHTML);
            }
            return _textContent.set.call(this, value);
          } catch (e) {
            console.warn(e, this, value);
          } finally {
            locked = false;
          }
        },
      });
    }
  })();
  document.firstElementChild.dataset.location = window.location;

  const colorDoc = (() => {
    let running = false;
    return () => {
      if (running) return;
      running = true
      try {
        wrapTextNodes(document.body ?? document.firstElementChild);
        let elems = document.querySelectorAll(scopedLeafSelector);
        for (const elem of elems) {
          if (!elem?.children?.length) {
            elem.textContent = (elem.textContent || "");
          }
        }
      } catch (e) {
        //console.warn(e);
      }
      running = false;
    };
  })();
  //if (['complete', 'interactive'].includes(document.readyState)) {
  colorDoc();
  // } else {
  document.addEventListener('DOMContentLoaded', colorDoc);
  //}
  window.addEventListener('load', colorDoc);

  let lastTime = Date.now();
  const loop = 200;
  setInterval(() => {

    if (Date.now() - lastTime < loop) return;
    lastTime = Date.now();
    colorDoc();

  }, loop);

})();
