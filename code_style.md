# JavaScript Code Style Standards

These conventions apply across JavaScript projects, including browser, Node.js,
userscript, and framework code. Follow them when writing or refactoring
JavaScript. Apply project tooling and framework conventions when they are more
specific.

Preserve behavior during style refactors. Do not trade correctness, readability,
or established project conventions for mechanical consistency.

## Loops

- Prefer `for...of` over `Array.prototype.forEach`.

  ```js
  // Avoid
  items.forEach((item) => processItem(item));

  // Prefer
  for (const item of items) {
    processItem(item);
  }
  ```

- Prefer `for...of` over repeated single-purpose statements against a list of
  values (DOM appends, listener registration, id lookups, etc.), driving the
  loop from an array/tuple literal.

  ```js
  // Avoid
  container.appendChild(header);
  container.appendChild(content);
  container.appendChild(footer);

  // Prefer
  for (const element of [header, content, footer]) {
    container.appendChild(element);
  }
  ```

  This also applies to `addEventListener` calls with varying handlers/flags,
  using `[type, handler, capture]` tuples.

- Consolidate adjacent calls to the same receiver and method when only
  arguments vary. Use value arrays for one varying argument or argument tuples
  for several, preserving original call order and argument shapes. For event
  operations, only consolidate when the events share meaningful logic beyond
  the repeated method call; otherwise, keep each event explicit.

  ```js
  // Prefer when there is no additional shared event logic
  target.dispatchEvent(new Event('change', { bubbles: true }));
  target.dispatchEvent(new Event('input', { bubbles: true }));

  // Prefer when the events share additional logic
  for (const type of ['change', 'input']) {
    const event = new Event(type, { bubbles: true });
    prepareEvent(event);
    target.dispatchEvent(event);
  }
  ```

  Apply this to DOM operations, storage operations, and similar method calls
  throughout the codebase. Apply it to event dispatch and listener registration
  only when the events share additional logic.

- Do not consolidate across `await`, conditionals, mutation dependencies, or
  short-circuit expressions. Avoid loops when calls have different return,
  error, or async semantics.

## Array conversion

- Prefer spread syntax over `Array.from(iterable)` when converting an
  iterable (NodeList, `Map#entries()`, etc.) to an array.

  ```js
  // Avoid
  Array.from(document.querySelectorAll('button'))

  // Prefer
  [...document.querySelectorAll('button')]
  ```

- `Array.from({ length }, mapFn)` (the array-like + mapper form) has no
  spread equivalent — leave it as `Array.from(...)`.

## Value selection

- Prefer an inline object literal that is indexed immediately over a `switch`
  when selecting a value from a fixed set of keys.

  ```js
  // Avoid
  let label;
  switch (status) {
    case 'open':
      label = 'Open';
      break;
    case 'closed':
      label = 'Closed';
      break;
    default:
      label = 'Unknown';
  }

  // Prefer
  const label = ({
    open: 'Open',
    closed: 'Closed'
  })[status] ?? 'Unknown';
  ```

  Use this only for direct value mappings. Keep a `switch` when cases contain
  statements, depend on fallthrough, or require lazy evaluation or distinct
  side effects; object literal values are evaluated before the key is selected.

## Batching property assignments

- When multiple properties are assigned to the *same* object in immediate
  succession, batch them into a single `Object.assign` call instead of one
  assignment statement per line. This applies to plain objects, DOM element
  properties, `element.style`, and IndexedDB request/transaction handlers
  (`onsuccess`, `onerror`, `oncomplete`, `onabort`, `onupgradeneeded`, etc.).

  ```js
  // Avoid
  element.id = 'save-button';
  element.style.position = 'fixed';
  element.style.right = '24px';

  // Prefer
  element.id = 'save-button';
  Object.assign(element.style, {
    position: 'fixed',
    right: '24px'
  });
  ```

  Only batch assignments that have no intervening logic between them and
  target the same object. Don't batch an assignment together with a function
  call that depends on the object being non-null/non-empty (e.g. don't fold
  `saveRecord(record)` into a `record ?? {}` fallback — that would silently
  create or save a bogus empty record).

## Optional chaining / nullish coalescing

- Convert `if (x) x.prop = value;` (single-line null guard before a property
  write) to `(x?.prop ?? {}).prop = value;`-style optional chaining, so the
  assignment becomes a no-op instead of throwing when `x` is null/undefined:

  ```js
  // Avoid
  if (panel) panel.style.display = isActive ? 'block' : 'none';

  // Prefer
  (panel?.style ?? {}).display = isActive ? 'block' : 'none';
  ```

  This also applies to multi-line guard blocks that only set properties (no
  other side effects):

  ```js
  // Avoid
  if (button) {
    button.textContent = label;
    button.style.background = color;
  }

  // Prefer
  Object.assign(button ?? {}, { textContent: label });
  (button?.style ?? {}).background = color;
  ```

  Do **not** apply this when the guarded block also calls a function that
  takes the guarded variable as an argument with side effects (e.g.
  `saveRecord(record)`) — passing `{}` instead of `null`/`undefined` would
  change behavior.

- Convert `x ? x.prop : fallback()` ternaries to `x?.prop ?? fallback()`.

  ```js
  // Avoid
  const theme = settings ? settings.theme : getDefaultTheme();

  // Prefer
  const theme = settings?.theme ?? getDefaultTheme();
  ```

- Convert `x && x.prop` null guards to `x?.prop` when `x` is only used to
  read that one property.

  ```js
  // Avoid
  if (element && element.textContent) { ... }
  if (config && config.outputDirectory) { ... }

  // Prefer
  if (element?.textContent) { ... }
  if (config?.outputDirectory) { ... }
  ```

- **Once an optional chain starts (`?.`), every subsequent link in that same
  chain should also be optional**, even if the earlier links make it
  logically redundant:

  ```js
  // Avoid
  document.getElementById(id)?.remove();

  // Prefer
  document.getElementById(id)?.remove?.();
  ```

- Combine multiple chained negated `.includes()` calls into a single regex
  `.test()` when they're ORed/ANDed together as one check:

  ```js
  // Avoid
  if (text && !text.includes(' ') && !text.includes('…')) { ... }

  // Prefer
  if (text && !/…| /.test(text)) { ... }
  ```

- Convert `!x || !x.method(...)` guards into a single optional-chained call:

  ```js
  // Avoid
  if (!normalized || !normalized.includes('/')) return normalized;

  // Prefer
  if (!normalized?.includes?.('/')) return normalized;
  ```

## Async/await

- Always `await` promises when possible instead of using `.then()`/`.catch()`
  fire-and-forget chains, and wrap the `await` in `try/catch` for error
  handling. The exception is when a promise is used purely to promisify a
  timing primitive (e.g. `new Promise((resolve) => setTimeout(resolve, ms))`),
  which is fine to await directly without extra ceremony.

  ```js
  // Avoid
  startScript().catch((err) => {
    console.error('failed to start:', err);
  });

  // Prefer
  try {
    await startScript();
  } catch (err) {
    console.error('failed to start:', err);
  }
  ```

  When a function needs to `await` a promise this way, mark it (and its
  call chain, up to the nearest place that can already tolerate
  fire-and-forget, such as a DOM event listener) as `async`.

- Prefer wrapping a one-shot event in a `Promise` and `await`-ing it over
  handling the continuation inside the event callback. Use the
  `addPromiseListener` helper (see Example helper functions) instead of
  writing the `new Promise((resolve) => ...)` wrapper inline each time.

  ```js
  // Avoid
  element.addEventListener('load', () => {
    processElement(element);
  }, { once: true });

  // Prefer
  await addPromiseListener(element, 'load');
  processElement(element);
  ```

  This applies to one-shot events (`load`, `transitionend`, `animationend`,
  etc.) where the callback only resumes subsequent logic. Keep a plain
  callback/listener when the event can fire multiple times, when it needs to
  stay registered for the life of the element, or when the handler's return
  value or `this` binding matters.

## Example helper functions

Use small defensive helpers where invalid input or host APIs may throw and the
caller can safely continue with a documented fallback.

```js
function updateAttribute(element, key, value) {
  try {
    if (element.getAttribute(key) != value) {
      element.setAttribute(key, value);
    }
  } catch (error) {
    console.warn(error, element, key, value);
  }
}

const isString = (value) =>
  typeof value === 'string' || value instanceof String;

const isArray = (value) =>
  Array.isArray(value) || value instanceof Array;

const stringify = (value) => {
  try {
    if (isString(value)) return String(value);
    return String(JSON.stringify(value));
  } catch {
    return String(value);
  }
};

const documentQuerySelector = (...args) => {
  try {
    return document.querySelector(...args);
  } catch (error) {
    console.warn(error, ...args);
  }
};

const documentQuerySelectorAll = (...args) => {
  try {
    return document.querySelectorAll(...args);
  } catch (error) {
    console.warn(error, ...args);
    return [];
  }
};

const newRegExp = (...args) => {
  try {
    return RegExp(...args);
  } catch (error) {
    console.warn(error, ...args);
    return /$a^/;
  }
};

const addPromiseListener = (target, type, callback, options) =>
  new Promise((resolve) => target.addEventListener(type, async (...args) => {
    resolve(await callback?.(...args));
  }, { ...options, once: true }));
```

These are examples, not mandatory wrappers. Do not hide errors when callers
cannot safely recover. Keep fallback return types compatible with successful
results where practical.

## Validation

- After each edit, run project-defined formatting, linting, type-checking, and
  tests relevant to changed code.
- For standalone JavaScript files without project tooling, run
  `node --check <file>` when Node.js can parse the file's syntax and module
  format.
- Check editor diagnostics before considering a change complete.
- Review the diff for accidental behavior changes, generated-file edits,
  formatting noise, and new warnings.
