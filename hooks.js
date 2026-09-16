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
                (isString(args[0]) || args[0]?.nodeName === "#text") && args[0]?.textContent?.trim?.() &&
                !this?.matches?.(skipCss)
              ) {
                const span = document.createElement("span");
                setHTML.call(span, globalThis.color(args[0].textContent || ""));
                args[0] = span;
              }
              if (
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
              if (isString(args[0]))
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
            if (value?.replace) {
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
        let elems = doc.body.querySelectorAll('*:not(script):not(style):not(link):not(meta):not(title):not(:has(*)):not([class^="color"],[class^="color"] *)');
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
        if (locked) {
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
            if (locked) {
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
        let elems = document.querySelectorAll('*:not(script):not(style):not(link):not(meta):not(title):not(:has(*)):not([class^="color"],[class^="color"] *)');
        for (const elem of elems) {
          if (!elem?.children?.length) {
            elem.textContent = (elem.textContent || "");
          }
        }
      } catch (e) {
        consol.warn(e);
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

  // xterm uses disposable row nodes. Recolor each row whenever its DOM
  // renderer creates or updates content. Canvas and WebGL renderers do not
  // expose visible text nodes.
  (() => {
    let scheduled = false;

    const colorTerminalRows = () => {
      scheduled = false;
      for (const row of document.querySelectorAll('.xterm-rows > div')) {
        for (const node of row.querySelectorAll('span:not([class^="color-"])')) {
          if (node.children.length || !node.textContent) {
            continue;
          }
          const colored = globalThis.color?.(node.textContent);
          if (colored && colored !== node.textContent) {
            setHTML.call(node, colored);
          }
        }
      }
    };

    const scheduleTerminalColor = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(colorTerminalRows);
    };

    const observer = new MutationObserver((mutations) => {
      if (mutations.some(({ target }) =>
        target.nodeType === Node.ELEMENT_NODE
          ? target.closest?.('.xterm')
          : target.parentElement?.closest?.('.xterm'))) {
        scheduleTerminalColor();
      }
    });

    observer.observe(document.body ?? document.firstElementChild, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    scheduleTerminalColor();
  })();

})();