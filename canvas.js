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
