import { p as is_array, aa as get_prototype_of, ab as object_prototype, ac as current_component, Q as setContext, ad as getContext, $ as spread_attributes, _ as stringify, a0 as bind_props, S as pop, P as push, a4 as element, X as attr, T as escape_html, ae as add_styles } from "./index.js";
import { g as getTranslationFunctions } from "./index5.js";
const empty = [];
function snapshot$1(value, skip_warning = false) {
  return clone$1(value, /* @__PURE__ */ new Map(), "", empty);
}
function clone$1(value, cloned, path, paths, original = null) {
  if (typeof value === "object" && value !== null) {
    var unwrapped = cloned.get(value);
    if (unwrapped !== void 0) return unwrapped;
    if (value instanceof Map) return (
      /** @type {Snapshot<T>} */
      new Map(value)
    );
    if (value instanceof Set) return (
      /** @type {Snapshot<T>} */
      new Set(value)
    );
    if (is_array(value)) {
      var copy = (
        /** @type {Snapshot<any>} */
        Array(value.length)
      );
      cloned.set(value, copy);
      if (original !== null) {
        cloned.set(original, copy);
      }
      for (var i = 0; i < value.length; i += 1) {
        var element2 = value[i];
        if (i in value) {
          copy[i] = clone$1(element2, cloned, path, paths);
        }
      }
      return copy;
    }
    if (get_prototype_of(value) === object_prototype) {
      copy = {};
      cloned.set(value, copy);
      if (original !== null) {
        cloned.set(original, copy);
      }
      for (var key2 in value) {
        copy[key2] = clone$1(value[key2], cloned, path, paths);
      }
      return copy;
    }
    if (value instanceof Date) {
      return (
        /** @type {Snapshot<T>} */
        structuredClone(value)
      );
    }
    if (typeof /** @type {T & { toJSON?: any } } */
    value.toJSON === "function") {
      return clone$1(
        /** @type {T & { toJSON(): any } } */
        value.toJSON(),
        cloned,
        path,
        paths,
        // Associate the instance with the toJSON clone
        value
      );
    }
  }
  if (value instanceof EventTarget) {
    return (
      /** @type {Snapshot<T>} */
      value
    );
  }
  try {
    return (
      /** @type {Snapshot<T>} */
      structuredClone(value)
    );
  } catch (e) {
    return (
      /** @type {Snapshot<T>} */
      value
    );
  }
}
function onDestroy(fn) {
  var context = (
    /** @type {Component} */
    current_component
  );
  (context.d ??= []).push(fn);
}
var createAnatomy = (name, parts2 = []) => ({
  parts: (...values) => {
    if (isEmpty(parts2)) {
      return createAnatomy(name, values);
    }
    throw new Error("createAnatomy().parts(...) should only be called once. Did you mean to use .extendWith(...) ?");
  },
  extendWith: (...values) => createAnatomy(name, [...parts2, ...values]),
  rename: (newName) => createAnatomy(newName, parts2),
  keys: () => parts2,
  build: () => [...new Set(parts2)].reduce(
    (prev, part) => Object.assign(prev, {
      [part]: {
        selector: [
          `&[data-scope="${toKebabCase(name)}"][data-part="${toKebabCase(part)}"]`,
          `& [data-scope="${toKebabCase(name)}"][data-part="${toKebabCase(part)}"]`
        ].join(", "),
        attrs: { "data-scope": toKebabCase(name), "data-part": toKebabCase(part) }
      }
    }),
    {}
  )
});
var toKebabCase = (value) => value.replace(/([A-Z])([A-Z])/g, "$1-$2").replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[\s_]+/g, "-").toLowerCase();
var isEmpty = (v) => v.length === 0;
var dataAttr = (guard) => guard ? "" : void 0;
var ELEMENT_NODE = 1;
var DOCUMENT_NODE = 9;
var DOCUMENT_FRAGMENT_NODE = 11;
var isObject$2 = (v) => typeof v === "object" && v !== null;
var isHTMLElement = (el) => isObject$2(el) && el.nodeType === ELEMENT_NODE && typeof el.nodeName === "string";
var isDocument = (el) => isObject$2(el) && el.nodeType === DOCUMENT_NODE;
var isWindow = (el) => isObject$2(el) && el === el.window;
var getNodeName = (node) => {
  if (isHTMLElement(node)) return node.localName || "";
  return "#document";
};
function isRootElement(node) {
  return ["html", "body", "#document"].includes(getNodeName(node));
}
var isNode = (el) => isObject$2(el) && el.nodeType !== void 0;
var isShadowRoot = (el) => isNode(el) && el.nodeType === DOCUMENT_FRAGMENT_NODE && "host" in el;
function contains(parent, child) {
  if (!parent || !child) return false;
  if (!isHTMLElement(parent) || !isHTMLElement(child)) return false;
  return parent === child || parent.contains(child);
}
function getDocument(el) {
  if (isDocument(el)) return el;
  if (isWindow(el)) return el.document;
  return el?.ownerDocument ?? document;
}
function getDocumentElement(el) {
  return getDocument(el).documentElement;
}
function getWindow$1(el) {
  if (isShadowRoot(el)) return getWindow$1(el.host);
  if (isDocument(el)) return el.defaultView ?? window;
  if (isHTMLElement(el)) return el.ownerDocument?.defaultView ?? window;
  return window;
}
function getActiveElement(rootNode) {
  let activeElement = rootNode.activeElement;
  while (activeElement?.shadowRoot) {
    const el = activeElement.shadowRoot.activeElement;
    if (el === activeElement) break;
    else activeElement = el;
  }
  return activeElement;
}
var isDom = () => typeof document !== "undefined";
function getPlatform() {
  const agent = navigator.userAgentData;
  return agent?.platform ?? navigator.platform;
}
var pt = (v) => isDom() && v.test(getPlatform());
var ua = (v) => isDom() && v.test(navigator.userAgent);
var vn = (v) => isDom() && v.test(navigator.vendor);
var isMac = () => pt(/^Mac/);
var isSafari = () => isApple() && vn(/apple/i);
var isFirefox = () => ua(/firefox\//i);
var isApple = () => pt(/mac|iphone|ipad|ipod/i);
var isIos = () => pt(/iP(hone|ad|od)|iOS/);
function getComposedPath(event) {
  return event.composedPath?.() ?? event.nativeEvent?.composedPath?.();
}
function getEventTarget(event) {
  const composedPath = getComposedPath(event);
  return composedPath?.[0] ?? event.target;
}
var isSelfTarget = (event) => {
  return contains(event.currentTarget, getEventTarget(event));
};
function isComposingEvent(event) {
  return event.nativeEvent?.isComposing ?? event.isComposing;
}
var defaultItemToId = (v) => v.id;
function itemById(v, id, itemToId = defaultItemToId) {
  return v.find((item) => itemToId(item) === id);
}
function indexOfId(v, id, itemToId = defaultItemToId) {
  const item = itemById(v, id, itemToId);
  return item ? v.indexOf(item) : -1;
}
function nextById(v, id, loop = true) {
  let idx = indexOfId(v, id);
  idx = loop ? (idx + 1) % v.length : Math.min(idx + 1, v.length - 1);
  return v[idx];
}
function prevById(v, id, loop = true) {
  let idx = indexOfId(v, id);
  if (idx === -1) return loop ? v[v.length - 1] : null;
  idx = loop ? (idx - 1 + v.length) % v.length : Math.max(0, idx - 1);
  return v[idx];
}
function getParentNode(node) {
  if (getNodeName(node) === "html") {
    return node;
  }
  const result = (
    // Step into the shadow DOM of the parent of a slotted node.
    node.assignedSlot || // DOM Element detected.
    node.parentNode || // ShadowRoot detected.
    isShadowRoot(node) && node.host || // Fallback.
    getDocumentElement(node)
  );
  return isShadowRoot(result) ? result.host : result;
}
var isHTMLElement2 = (element2) => typeof element2 === "object" && element2 !== null && element2.nodeType === 1;
var isFrame = (element2) => isHTMLElement2(element2) && element2.tagName === "IFRAME";
function isVisible(el) {
  if (!isHTMLElement2(el)) return false;
  return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
}
function hasNegativeTabIndex(element2) {
  const tabIndex = parseInt(element2.getAttribute("tabindex") || "0", 10);
  return tabIndex < 0;
}
var focusableSelector = "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], button:not([disabled]), [tabindex], iframe, object, embed, area[href], audio[controls], video[controls], [contenteditable]:not([contenteditable='false']), details > summary:first-of-type";
var getFocusables = (container, includeContainer = false) => {
  if (!container) return [];
  const elements = Array.from(container.querySelectorAll(focusableSelector));
  const include = includeContainer == true || includeContainer == "if-empty" && elements.length === 0;
  if (include && isHTMLElement2(container) && isFocusable(container)) {
    elements.unshift(container);
  }
  const focusableElements = elements.filter(isFocusable);
  focusableElements.forEach((element2, i) => {
    if (isFrame(element2) && element2.contentDocument) {
      const frameBody = element2.contentDocument.body;
      focusableElements.splice(i, 1, ...getFocusables(frameBody));
    }
  });
  return focusableElements;
};
function isFocusable(element2) {
  if (!element2 || element2.closest("[inert]")) return false;
  return element2.matches(focusableSelector) && isVisible(element2);
}
function getTabbables(container, includeContainer) {
  if (!container) return [];
  const elements = Array.from(container.querySelectorAll(focusableSelector));
  const tabbableElements = elements.filter(isTabbable);
  if (includeContainer && isTabbable(container)) {
    tabbableElements.unshift(container);
  }
  tabbableElements.forEach((element2, i) => {
    if (isFrame(element2) && element2.contentDocument) {
      const frameBody = element2.contentDocument.body;
      const allFrameTabbable = getTabbables(frameBody);
      tabbableElements.splice(i, 1, ...allFrameTabbable);
    }
  });
  if (!tabbableElements.length && includeContainer) {
    return elements;
  }
  return tabbableElements;
}
function isTabbable(el) {
  if (el != null && el.tabIndex > 0) return true;
  return isFocusable(el) && !hasNegativeTabIndex(el);
}
function getTabbableEdges(container, includeContainer) {
  const elements = getTabbables(container, includeContainer);
  const first2 = elements[0] || null;
  const last2 = elements[elements.length - 1] || null;
  return [first2, last2];
}
function getNextTabbable(container, current) {
  const tabbables = getTabbables(container);
  const doc = container?.ownerDocument || document;
  const currentElement = current ?? doc.activeElement;
  if (!currentElement) return null;
  const index = tabbables.indexOf(currentElement);
  return tabbables[index + 1] || null;
}
function getInitialFocus(options) {
  const { root, getInitialEl, filter, enabled = true } = options;
  if (!enabled) return;
  let node = null;
  node || (node = typeof getInitialEl === "function" ? getInitialEl() : getInitialEl);
  node || (node = root?.querySelector("[data-autofocus],[autofocus]"));
  if (!node) {
    const tabbables = getTabbables(root);
    node = filter ? tabbables.filter(filter)[0] : tabbables[0];
  }
  return node || root || void 0;
}
var OVERFLOW_RE = /auto|scroll|overlay|hidden|clip/;
function isOverflowElement(el) {
  const win = getWindow$1(el);
  const { overflow, overflowX, overflowY, display } = win.getComputedStyle(el);
  return OVERFLOW_RE.test(overflow + overflowY + overflowX) && !["inline", "contents"].includes(display);
}
function nextTick(fn) {
  const set2 = /* @__PURE__ */ new Set();
  function raf2(fn2) {
    const id = globalThis.requestAnimationFrame(fn2);
    set2.add(() => globalThis.cancelAnimationFrame(id));
  }
  raf2(() => raf2(fn));
  return function cleanup() {
    set2.forEach((fn2) => fn2());
  };
}
function raf(fn) {
  const id = globalThis.requestAnimationFrame(fn);
  return () => {
    globalThis.cancelAnimationFrame(id);
  };
}
function observeAttributesImpl(node, options) {
  if (!node) return;
  const { attributes, callback: fn } = options;
  const win = node.ownerDocument.defaultView || window;
  const obs = new win.MutationObserver((changes) => {
    for (const change of changes) {
      if (change.type === "attributes" && change.attributeName && attributes.includes(change.attributeName)) {
        fn(change);
      }
    }
  });
  obs.observe(node, { attributes: true, attributeFilter: attributes });
  return () => obs.disconnect();
}
function observeAttributes(nodeOrFn, options) {
  const { defer } = options;
  const func = defer ? raf : (v) => v();
  const cleanups2 = [];
  cleanups2.push(
    func(() => {
      const node = typeof nodeOrFn === "function" ? nodeOrFn() : nodeOrFn;
      cleanups2.push(observeAttributesImpl(node, options));
    })
  );
  return () => {
    cleanups2.forEach((fn) => fn?.());
  };
}
function observeChildrenImpl(node, options) {
  const { callback: fn } = options;
  if (!node) return;
  const win = node.ownerDocument.defaultView || window;
  const obs = new win.MutationObserver(fn);
  obs.observe(node, { childList: true, subtree: true });
  return () => obs.disconnect();
}
function observeChildren(nodeOrFn, options) {
  const { defer } = options;
  const func = defer ? raf : (v) => v();
  const cleanups2 = [];
  cleanups2.push(
    func(() => {
      const node = typeof nodeOrFn === "function" ? nodeOrFn() : nodeOrFn;
      cleanups2.push(observeChildrenImpl(node, options));
    })
  );
  return () => {
    cleanups2.forEach((fn) => fn?.());
  };
}
function getNearestOverflowAncestor(el) {
  const parentNode = getParentNode(el);
  if (isRootElement(parentNode)) {
    return getDocument(parentNode).body;
  }
  if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }
  return getNearestOverflowAncestor(parentNode);
}
function proxyTabFocusImpl(container, options = {}) {
  const { triggerElement, onFocus } = options;
  const doc = container?.ownerDocument || document;
  const body = doc.body;
  function onKeyDown(event) {
    if (event.key !== "Tab") return;
    let elementToFocus = null;
    const [firstTabbable, lastTabbable] = getTabbableEdges(container, true);
    const noTabbableElements = !firstTabbable && !lastTabbable;
    if (event.shiftKey && (doc.activeElement === firstTabbable || noTabbableElements)) {
      elementToFocus = triggerElement;
    } else if (!event.shiftKey && doc.activeElement === triggerElement) {
      elementToFocus = firstTabbable;
    } else if (!event.shiftKey && (doc.activeElement === lastTabbable || noTabbableElements)) {
      elementToFocus = getNextTabbable(body, triggerElement);
    }
    if (!elementToFocus) return;
    event.preventDefault();
    if (typeof onFocus === "function") {
      onFocus(elementToFocus);
    } else {
      elementToFocus.focus();
    }
  }
  doc?.addEventListener("keydown", onKeyDown, true);
  return () => {
    doc?.removeEventListener("keydown", onKeyDown, true);
  };
}
function proxyTabFocus(container, options) {
  const { defer, triggerElement, ...restOptions } = options;
  const func = defer ? raf : (v) => v();
  const cleanups2 = [];
  cleanups2.push(
    func(() => {
      const node = typeof container === "function" ? container() : container;
      const trigger = typeof triggerElement === "function" ? triggerElement() : triggerElement;
      cleanups2.push(proxyTabFocusImpl(node, { triggerElement: trigger, ...restOptions }));
    })
  );
  return () => {
    cleanups2.forEach((fn) => fn?.());
  };
}
function queryAll(root, selector) {
  return Array.from(root?.querySelectorAll(selector) ?? []);
}
function createScope(methods) {
  const dom2 = {
    getRootNode: (ctx) => ctx.getRootNode?.() ?? document,
    getDoc: (ctx) => getDocument(dom2.getRootNode(ctx)),
    getWin: (ctx) => dom2.getDoc(ctx).defaultView ?? window,
    getActiveElement: (ctx) => getActiveElement(dom2.getRootNode(ctx)),
    isActiveElement: (ctx, elem) => elem === dom2.getActiveElement(ctx),
    getById: (ctx, id) => dom2.getRootNode(ctx).getElementById(id),
    setValue: (elem, value) => {
      if (elem == null || value == null) return;
      const valueAsString = value.toString();
      if (elem.value === valueAsString) return;
      elem.value = value.toString();
    }
  };
  return { ...dom2, ...methods };
}
var cleanups = /* @__PURE__ */ new WeakMap();
function set$4(element2, key2, setup) {
  if (!cleanups.has(element2)) {
    cleanups.set(element2, /* @__PURE__ */ new Map());
  }
  const elementCleanups = cleanups.get(element2);
  const prevCleanup = elementCleanups.get(key2);
  if (!prevCleanup) {
    elementCleanups.set(key2, setup());
    return () => {
      elementCleanups.get(key2)?.();
      elementCleanups.delete(key2);
    };
  }
  const cleanup = setup();
  const nextCleanup = () => {
    cleanup();
    prevCleanup();
    elementCleanups.delete(key2);
  };
  elementCleanups.set(key2, nextCleanup);
  return () => {
    const isCurrent = elementCleanups.get(key2) === nextCleanup;
    if (!isCurrent) return;
    cleanup();
    elementCleanups.set(key2, prevCleanup);
  };
}
function setStyle(element2, style) {
  if (!element2) return () => {
  };
  const setup = () => {
    const prevStyle = element2.style.cssText;
    Object.assign(element2.style, style);
    return () => {
      element2.style.cssText = prevStyle;
    };
  };
  return set$4(element2, "style", setup);
}
var visuallyHiddenStyle = {
  border: "0",
  clip: "rect(0 0 0 0)",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  padding: "0",
  position: "absolute",
  width: "1px",
  whiteSpace: "nowrap",
  wordWrap: "normal"
};
var fps = 1e3 / 60;
function waitForElement(query2, cb) {
  const el = query2();
  if (isHTMLElement(el) && el.isConnected) {
    cb(el);
    return () => void 0;
  } else {
    const timerId = setInterval(() => {
      const el2 = query2();
      if (isHTMLElement(el2) && el2.isConnected) {
        cb(el2);
        clearInterval(timerId);
      }
    }, fps);
    return () => clearInterval(timerId);
  }
}
function waitForElements(queries, cb) {
  const cleanups2 = [];
  queries?.forEach((query2) => {
    const clean = waitForElement(query2, cb);
    cleanups2.push(clean);
  });
  return () => {
    cleanups2.forEach((fn) => fn());
  };
}
var addDomEvent = (target, eventName, handler, options) => {
  const node = typeof target === "function" ? target() : target;
  node?.addEventListener(eventName, handler, options);
  return () => {
    node?.removeEventListener(eventName, handler, options);
  };
};
var isContextMenuEvent = (e) => {
  return e.button === 2 || isMac() && e.ctrlKey && e.button === 0;
};
function queueBeforeEvent(element2, type, cb) {
  const createTimer = (callback) => {
    const timerId = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(timerId);
  };
  const cancelTimer = createTimer(() => {
    element2.removeEventListener(type, callSync, true);
    cb();
  });
  const callSync = () => {
    cancelTimer();
    cb();
  };
  element2.addEventListener(type, callSync, { once: true, capture: true });
  return cancelTimer;
}
function isLinkElement(element2) {
  return element2?.matches("a[href]") ?? false;
}
function clickIfLink(element2) {
  if (!isLinkElement(element2)) return;
  const click = () => element2.click();
  if (isFirefox()) {
    queueBeforeEvent(element2, "keyup", click);
  } else {
    queueMicrotask(click);
  }
}
function fireCustomEvent(el, type, init) {
  if (!el) return;
  const win = el.ownerDocument.defaultView || window;
  const event = new win.CustomEvent(type, init);
  return el.dispatchEvent(event);
}
var keyMap = {
  Up: "ArrowUp",
  Down: "ArrowDown",
  Esc: "Escape",
  " ": "Space",
  ",": "Comma",
  Left: "ArrowLeft",
  Right: "ArrowRight"
};
var rtlKeyMap = {
  ArrowLeft: "ArrowRight",
  ArrowRight: "ArrowLeft"
};
function getEventKey(event, options = {}) {
  const { dir = "ltr", orientation = "horizontal" } = options;
  let { key: key2 } = event;
  key2 = keyMap[key2] ?? key2;
  const isRtl = dir === "rtl" && orientation === "horizontal";
  if (isRtl && key2 in rtlKeyMap) {
    key2 = rtlKeyMap[key2];
  }
  return key2;
}
var first = (v) => v[0];
var last = (v) => v[v.length - 1];
var add = (v, ...items) => v.concat(items);
var remove = (v, ...items) => v.filter((t) => !items.includes(t));
function clear(v) {
  while (v.length > 0) v.pop();
  return v;
}
var isArrayLike = (value) => value?.constructor.name === "Array";
var isArrayEqual = (a, b) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!isEqual(a[i], b[i])) return false;
  }
  return true;
};
var isEqual = (a, b) => {
  if (Object.is(a, b)) return true;
  if (a == null && b != null || a != null && b == null) return false;
  if (typeof a?.isEqual === "function" && typeof b?.isEqual === "function") {
    return a.isEqual(b);
  }
  if (typeof a === "function" && typeof b === "function") {
    return a.toString() === b.toString();
  }
  if (isArrayLike(a) && isArrayLike(b)) {
    return isArrayEqual(Array.from(a), Array.from(b));
  }
  if (!(typeof a === "object") || !(typeof b === "object")) return false;
  const keys = Object.keys(b ?? /* @__PURE__ */ Object.create(null));
  const length = keys.length;
  for (let i = 0; i < length; i++) {
    const hasKey = Reflect.has(a, keys[i]);
    if (!hasKey) return false;
  }
  for (let i = 0; i < length; i++) {
    const key2 = keys[i];
    if (!isEqual(a[key2], b[key2])) return false;
  }
  return true;
};
var runIfFn = (v, ...a) => {
  const res = typeof v === "function" ? v(...a) : v;
  return res ?? void 0;
};
var cast = (v) => v;
var noop = () => {
};
var callAll = (...fns) => (...a) => {
  fns.forEach(function(fn) {
    fn?.(...a);
  });
};
var uuid = /* @__PURE__ */ (() => {
  let id = 0;
  return () => {
    id++;
    return id.toString(36);
  };
})();
var isDev$1 = () => process.env.NODE_ENV !== "production";
var isArray = (v) => Array.isArray(v);
var isObjectLike = (v) => v != null && typeof v === "object";
var isObject$1 = (v) => isObjectLike(v) && !isArray(v);
var isNumber = (v) => typeof v === "number" && !Number.isNaN(v);
var isString = (v) => typeof v === "string";
var isFunction$1 = (v) => typeof v === "function";
var isNull = (v) => v == null;
var hasProp = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
var baseGetTag = (v) => Object.prototype.toString.call(v);
var fnToString = Function.prototype.toString;
var objectCtorString = fnToString.call(Object);
var isPlainObject = (v) => {
  if (!isObjectLike(v) || baseGetTag(v) != "[object Object]") return false;
  const proto = Object.getPrototypeOf(v);
  if (proto === null) return true;
  const Ctor = hasProp(proto, "constructor") && proto.constructor;
  return typeof Ctor == "function" && Ctor instanceof Ctor && fnToString.call(Ctor) == objectCtorString;
};
function compact(obj) {
  if (!isPlainObject2(obj) || obj === void 0) {
    return obj;
  }
  const keys = Reflect.ownKeys(obj).filter((key2) => typeof key2 === "string");
  const filtered = {};
  for (const key2 of keys) {
    const value = obj[key2];
    if (value !== void 0) {
      filtered[key2] = compact(value);
    }
  }
  return filtered;
}
var isPlainObject2 = (value) => {
  return value && typeof value === "object" && value.constructor === Object;
};
function warn(...a) {
  const m = a.length === 1 ? a[0] : a[1];
  const c = a.length === 2 ? a[0] : true;
  if (c && process.env.NODE_ENV !== "production") {
    console.warn(m);
  }
}
function invariant(...a) {
  const m = a.length === 1 ? a[0] : a[1];
  const c = a.length === 2 ? a[0] : true;
  if (c && process.env.NODE_ENV !== "production") {
    throw new Error(m);
  }
}
const GET_ORIGINAL_SYMBOL = Symbol();
const getProto = Object.getPrototypeOf;
const objectsToTrack = /* @__PURE__ */ new WeakMap();
const isObjectToTrack = (obj) => obj && (objectsToTrack.has(obj) ? objectsToTrack.get(obj) : getProto(obj) === Object.prototype || getProto(obj) === Array.prototype);
const getUntracked = (obj) => {
  if (isObjectToTrack(obj)) {
    return obj[GET_ORIGINAL_SYMBOL] || null;
  }
  return null;
};
const markToTrack = (obj, mark = true) => {
  objectsToTrack.set(obj, mark);
};
function glob() {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof self !== "undefined") return self;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
}
function globalRef(key2, value) {
  const g = glob();
  if (!g) return value();
  g[key2] || (g[key2] = value());
  return g[key2];
}
var refSet = globalRef("__zag__refSet", () => /* @__PURE__ */ new WeakSet());
var isReactElement = (x) => typeof x === "object" && x !== null && "$$typeof" in x && "props" in x;
var isVueElement = (x) => typeof x === "object" && x !== null && "__v_isVNode" in x;
var isDOMElement = (x) => typeof x === "object" && x !== null && "nodeType" in x && typeof x.nodeName === "string";
var isElement = (x) => isReactElement(x) || isVueElement(x) || isDOMElement(x);
var isObject = (x) => x !== null && typeof x === "object";
var canProxy = (x) => isObject(x) && !refSet.has(x) && (Array.isArray(x) || !(Symbol.iterator in x)) && !isElement(x) && !(x instanceof WeakMap) && !(x instanceof WeakSet) && !(x instanceof Error) && !(x instanceof Number) && !(x instanceof Date) && !(x instanceof String) && !(x instanceof RegExp) && !(x instanceof ArrayBuffer) && !(x instanceof Promise);
var isDev = () => process.env.NODE_ENV !== "production";
function set$3(obj, key2, val) {
  if (typeof val.value === "object" && !canProxy(val.value)) val.value = clone(val.value);
  if (!val.enumerable || val.get || val.set || !val.configurable || !val.writable || key2 === "__proto__") {
    Object.defineProperty(obj, key2, val);
  } else obj[key2] = val.value;
}
function clone(x) {
  if (typeof x !== "object") return x;
  var i = 0, k, list, tmp, str = Object.prototype.toString.call(x);
  if (str === "[object Object]") {
    tmp = Object.create(Object.getPrototypeOf(x) || null);
  } else if (str === "[object Array]") {
    tmp = Array(x.length);
  } else if (str === "[object Set]") {
    tmp = /* @__PURE__ */ new Set();
    x.forEach(function(val) {
      tmp.add(clone(val));
    });
  } else if (str === "[object Map]") {
    tmp = /* @__PURE__ */ new Map();
    x.forEach(function(val, key2) {
      tmp.set(clone(key2), clone(val));
    });
  } else if (str === "[object Date]") {
    tmp = /* @__PURE__ */ new Date(+x);
  } else if (str === "[object RegExp]") {
    tmp = new RegExp(x.source, x.flags);
  } else if (str === "[object DataView]") {
    tmp = new x.constructor(clone(x.buffer));
  } else if (str === "[object ArrayBuffer]") {
    tmp = x.slice(0);
  } else if (str === "[object Blob]") {
    tmp = x.slice();
  } else if (str.slice(-6) === "Array]") {
    tmp = new x.constructor(x);
  }
  if (tmp) {
    for (list = Object.getOwnPropertySymbols(x); i < list.length; i++) {
      set$3(tmp, list[i], Object.getOwnPropertyDescriptor(x, list[i]));
    }
    for (i = 0, list = Object.getOwnPropertyNames(x); i < list.length; i++) {
      if (Object.hasOwnProperty.call(tmp, k = list[i]) && tmp[k] === x[k]) continue;
      set$3(tmp, k, Object.getOwnPropertyDescriptor(x, k));
    }
  }
  return tmp || x;
}
var proxyStateMap = globalRef("__zag__proxyStateMap", () => /* @__PURE__ */ new WeakMap());
var buildProxyFunction = (objectIs = Object.is, newProxy = (target, handler) => new Proxy(target, handler), snapCache = /* @__PURE__ */ new WeakMap(), createSnapshot = (target, version) => {
  const cache = snapCache.get(target);
  if (cache?.[0] === version) {
    return cache[1];
  }
  const snap = Array.isArray(target) ? [] : Object.create(Object.getPrototypeOf(target));
  markToTrack(snap, true);
  snapCache.set(target, [version, snap]);
  Reflect.ownKeys(target).forEach((key2) => {
    const value = Reflect.get(target, key2);
    if (refSet.has(value)) {
      markToTrack(value, false);
      snap[key2] = value;
    } else if (proxyStateMap.has(value)) {
      snap[key2] = snapshot(value);
    } else {
      snap[key2] = value;
    }
  });
  return Object.freeze(snap);
}, proxyCache = /* @__PURE__ */ new WeakMap(), versionHolder = [1, 1], proxyFunction2 = (initialObject) => {
  if (!isObject(initialObject)) {
    throw new Error("object required");
  }
  const found = proxyCache.get(initialObject);
  if (found) {
    return found;
  }
  let version = versionHolder[0];
  const listeners = /* @__PURE__ */ new Set();
  const notifyUpdate = (op, nextVersion = ++versionHolder[0]) => {
    if (version !== nextVersion) {
      version = nextVersion;
      listeners.forEach((listener) => listener(op, nextVersion));
    }
  };
  let checkVersion = versionHolder[1];
  const ensureVersion = (nextCheckVersion = ++versionHolder[1]) => {
    if (checkVersion !== nextCheckVersion && !listeners.size) {
      checkVersion = nextCheckVersion;
      propProxyStates.forEach(([propProxyState]) => {
        const propVersion = propProxyState[1](nextCheckVersion);
        if (propVersion > version) {
          version = propVersion;
        }
      });
    }
    return version;
  };
  const createPropListener = (prop) => (op, nextVersion) => {
    const newOp = [...op];
    newOp[1] = [prop, ...newOp[1]];
    notifyUpdate(newOp, nextVersion);
  };
  const propProxyStates = /* @__PURE__ */ new Map();
  const addPropListener = (prop, propProxyState) => {
    if (isDev() && propProxyStates.has(prop)) {
      throw new Error("prop listener already exists");
    }
    if (listeners.size) {
      const remove2 = propProxyState[3](createPropListener(prop));
      propProxyStates.set(prop, [propProxyState, remove2]);
    } else {
      propProxyStates.set(prop, [propProxyState]);
    }
  };
  const removePropListener = (prop) => {
    const entry = propProxyStates.get(prop);
    if (entry) {
      propProxyStates.delete(prop);
      entry[1]?.();
    }
  };
  const addListener = (listener) => {
    listeners.add(listener);
    if (listeners.size === 1) {
      propProxyStates.forEach(([propProxyState, prevRemove], prop) => {
        if (isDev() && prevRemove) {
          throw new Error("remove already exists");
        }
        const remove2 = propProxyState[3](createPropListener(prop));
        propProxyStates.set(prop, [propProxyState, remove2]);
      });
    }
    const removeListener = () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        propProxyStates.forEach(([propProxyState, remove2], prop) => {
          if (remove2) {
            remove2();
            propProxyStates.set(prop, [propProxyState]);
          }
        });
      }
    };
    return removeListener;
  };
  const baseObject = Array.isArray(initialObject) ? [] : Object.create(Object.getPrototypeOf(initialObject));
  const handler = {
    deleteProperty(target, prop) {
      const prevValue = Reflect.get(target, prop);
      removePropListener(prop);
      const deleted = Reflect.deleteProperty(target, prop);
      if (deleted) {
        notifyUpdate(["delete", [prop], prevValue]);
      }
      return deleted;
    },
    set(target, prop, value, receiver) {
      const hasPrevValue = Reflect.has(target, prop);
      const prevValue = Reflect.get(target, prop, receiver);
      if (hasPrevValue && (objectIs(prevValue, value) || proxyCache.has(value) && objectIs(prevValue, proxyCache.get(value)))) {
        return true;
      }
      removePropListener(prop);
      if (isObject(value)) {
        value = getUntracked(value) || value;
      }
      let nextValue = value;
      if (Object.getOwnPropertyDescriptor(target, prop)?.set) ;
      else {
        if (!proxyStateMap.has(value) && canProxy(value)) {
          nextValue = proxy(value);
        }
        const childProxyState = !refSet.has(nextValue) && proxyStateMap.get(nextValue);
        if (childProxyState) {
          addPropListener(prop, childProxyState);
        }
      }
      Reflect.set(target, prop, nextValue, receiver);
      notifyUpdate(["set", [prop], value, prevValue]);
      return true;
    }
  };
  const proxyObject = newProxy(baseObject, handler);
  proxyCache.set(initialObject, proxyObject);
  const proxyState = [baseObject, ensureVersion, createSnapshot, addListener];
  proxyStateMap.set(proxyObject, proxyState);
  Reflect.ownKeys(initialObject).forEach((key2) => {
    const desc = Object.getOwnPropertyDescriptor(initialObject, key2);
    if (desc.get || desc.set) {
      Object.defineProperty(baseObject, key2, desc);
    } else {
      proxyObject[key2] = initialObject[key2];
    }
  });
  return proxyObject;
}) => [
  // public functions
  proxyFunction2,
  // shared state
  proxyStateMap,
  refSet,
  // internal things
  objectIs,
  newProxy,
  canProxy,
  snapCache,
  createSnapshot,
  proxyCache,
  versionHolder
];
var [proxyFunction] = buildProxyFunction();
function proxy(initialObject = {}) {
  return proxyFunction(initialObject);
}
function subscribe(proxyObject, callback, notifyInSync) {
  const proxyState = proxyStateMap.get(proxyObject);
  if (isDev() && !proxyState) {
    console.warn("Please use proxy object");
  }
  let promise;
  const ops = [];
  const addListener = proxyState[3];
  let isListenerActive = false;
  const listener = (op) => {
    ops.push(op);
    if (notifyInSync) {
      callback(ops.splice(0));
      return;
    }
    if (!promise) {
      promise = Promise.resolve().then(() => {
        promise = void 0;
        if (isListenerActive) {
          callback(ops.splice(0));
        }
      });
    }
  };
  const removeListener = addListener(listener);
  isListenerActive = true;
  return () => {
    isListenerActive = false;
    removeListener();
  };
}
function snapshot(proxyObject) {
  const proxyState = proxyStateMap.get(proxyObject);
  if (isDev() && !proxyState) {
    console.warn("Please use proxy object");
  }
  const [target, ensureVersion, createSnapshot] = proxyState;
  return createSnapshot(target, ensureVersion());
}
function ref(obj) {
  refSet.add(obj);
  return obj;
}
function proxyWithComputed(initialObject, computedFns) {
  const keys = Object.keys(computedFns);
  keys.forEach((key2) => {
    if (Object.getOwnPropertyDescriptor(initialObject, key2)) {
      throw new Error("object property already defined");
    }
    const computedFn = computedFns[key2];
    const { get, set: set2 } = typeof computedFn === "function" ? { get: computedFn } : computedFn;
    const desc = {};
    desc.get = () => get(snapshot(proxyObject));
    if (set2) {
      desc.set = (newValue) => set2(proxyObject, newValue);
    }
    Object.defineProperty(initialObject, key2, desc);
  });
  const proxyObject = proxy(initialObject);
  return proxyObject;
}
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key2, value) => key2 in obj ? __defProp(obj, key2, { enumerable: true, configurable: true, writable: true, value }) : obj[key2] = value;
var __publicField = (obj, key2, value) => __defNormalProp(obj, typeof key2 !== "symbol" ? key2 + "" : key2, value);
function deepMerge(source, ...objects) {
  for (const obj of objects) {
    const target = compact(obj);
    for (const key2 in target) {
      if (isPlainObject(obj[key2])) {
        if (!source[key2]) {
          source[key2] = {};
        }
        deepMerge(source[key2], obj[key2]);
      } else {
        source[key2] = obj[key2];
      }
    }
  }
  return source;
}
function toEvent(event) {
  const obj = isString(event) ? { type: event } : event;
  return obj;
}
function toArray(value) {
  if (!value) return [];
  return isArray(value) ? value.slice() : [value];
}
function isGuardHelper(value) {
  return isObject$1(value) && value.predicate != null;
}
var Truthy = () => true;
function exec(guardMap, ctx, event, meta) {
  return (guard) => {
    if (isString(guard)) {
      return !!guardMap[guard]?.(ctx, event, meta);
    }
    if (isFunction$1(guard)) {
      return guard(ctx, event, meta);
    }
    return guard.predicate(guardMap)(ctx, event, meta);
  };
}
function or(...conditions) {
  return {
    predicate: (guardMap) => (ctx, event, meta) => conditions.map(exec(guardMap, ctx, event, meta)).some(Boolean)
  };
}
function and$1(...conditions) {
  return {
    predicate: (guardMap) => (ctx, event, meta) => conditions.map(exec(guardMap, ctx, event, meta)).every(Boolean)
  };
}
function not$3(condition) {
  return {
    predicate: (guardMap) => (ctx, event, meta) => {
      return !exec(guardMap, ctx, event, meta)(condition);
    }
  };
}
function stateIn(...values) {
  return (_ctx, _evt, meta) => meta.state.matches(...values);
}
var guards = { or, and: and$1, not: not$3, stateIn };
function determineGuardFn(guard, guardMap) {
  guard = guard ?? Truthy;
  return (context, event, meta) => {
    if (isString(guard)) {
      const value = guardMap[guard];
      return isFunction$1(value) ? value(context, event, meta) : value;
    }
    if (isGuardHelper(guard)) {
      return guard.predicate(guardMap)(context, event, meta);
    }
    return guard?.(context, event, meta);
  };
}
function determineActionsFn(values, guardMap) {
  return (context, event, meta) => {
    if (isGuardHelper(values)) {
      return values.predicate(guardMap)(context, event, meta);
    }
    return values;
  };
}
function createProxy(config) {
  const computedContext = config.computed ?? cast({});
  const initialContext = config.context ?? cast({});
  const initialTags = config.initial ? config.states?.[config.initial]?.tags : [];
  const state = proxy({
    value: config.initial ?? "",
    previousValue: "",
    event: cast({}),
    previousEvent: cast({}),
    context: proxyWithComputed(initialContext, computedContext),
    done: false,
    tags: initialTags ?? [],
    hasTag(tag) {
      return this.tags.includes(tag);
    },
    matches(...value) {
      return value.includes(this.value);
    },
    can(event) {
      return cast(this).nextEvents.includes(event);
    },
    get nextEvents() {
      const stateEvents = config.states?.[this.value]?.["on"] ?? {};
      const globalEvents = config?.on ?? {};
      return Object.keys({ ...stateEvents, ...globalEvents });
    },
    get changed() {
      if (this.event.value === "machine.init" || !this.previousValue) return false;
      return this.value !== this.previousValue;
    }
  });
  return cast(state);
}
function determineDelayFn(delay, delaysMap) {
  return (context, event) => {
    if (isNumber(delay)) return delay;
    if (isFunction$1(delay)) {
      return delay(context, event);
    }
    if (isString(delay)) {
      const value = Number.parseFloat(delay);
      if (!Number.isNaN(value)) {
        return value;
      }
      if (delaysMap) {
        const valueOrFn = delaysMap?.[delay];
        invariant(
          valueOrFn == null,
          `[@zag-js/core > determine-delay] Cannot determine delay for \`${delay}\`. It doesn't exist in \`options.delays\``
        );
        return isFunction$1(valueOrFn) ? valueOrFn(context, event) : valueOrFn;
      }
    }
  };
}
function toTarget(target) {
  return isString(target) ? { target } : target;
}
function determineTransitionFn(transitions, guardMap) {
  return (context, event, meta) => {
    return toArray(transitions).map(toTarget).find((transition) => {
      const determineGuard = determineGuardFn(transition.guard, guardMap);
      const guard = determineGuard(context, event, meta);
      return guard ?? transition.target ?? transition.actions;
    });
  };
}
var Machine = class {
  // Let's get started!
  constructor(config, options) {
    __publicField(
      this,
      "status",
      "Not Started"
      /* NotStarted */
    );
    __publicField(this, "state");
    __publicField(this, "initialState");
    __publicField(this, "initialContext");
    __publicField(this, "id");
    __publicField(
      this,
      "type",
      "machine"
      /* Machine */
    );
    __publicField(this, "activityEvents", /* @__PURE__ */ new Map());
    __publicField(this, "delayedEvents", /* @__PURE__ */ new Map());
    __publicField(this, "stateListeners", /* @__PURE__ */ new Set());
    __publicField(this, "doneListeners", /* @__PURE__ */ new Set());
    __publicField(this, "contextWatchers", /* @__PURE__ */ new Set());
    __publicField(this, "removeStateListener", noop);
    __publicField(this, "parent");
    __publicField(this, "children", /* @__PURE__ */ new Map());
    __publicField(this, "guardMap");
    __publicField(this, "actionMap");
    __publicField(this, "delayMap");
    __publicField(this, "activityMap");
    __publicField(this, "sync");
    __publicField(this, "options");
    __publicField(this, "config");
    __publicField(this, "_created", () => {
      if (!this.config.created) return;
      const event = toEvent(
        "machine.created"
        /* Created */
      );
      this.executeActions(this.config.created, event);
    });
    __publicField(this, "start", (init) => {
      this.state.value = "";
      this.state.tags = [];
      if (this.status === "Running") {
        return this;
      }
      this.status = "Running";
      this.removeStateListener = subscribe(
        this.state,
        () => {
          this.stateListeners.forEach((listener) => {
            listener(this.stateSnapshot);
          });
        },
        this.sync
      );
      this.setupContextWatchers();
      this.executeActivities(
        toEvent(
          "machine.start"
          /* Start */
        ),
        toArray(this.config.activities),
        "machine.start"
        /* Start */
      );
      this.executeActions(this.config.entry, toEvent(
        "machine.start"
        /* Start */
      ));
      const event = toEvent(
        "machine.init"
        /* Init */
      );
      const target = isObject$1(init) ? init.value : init;
      const context = isObject$1(init) ? init.context : void 0;
      if (context) {
        this.setContext(context);
      }
      const transition = {
        target: target ?? this.config.initial
      };
      const next = this.getNextStateInfo(transition, event);
      this.initialState = next;
      this.performStateChangeEffects(this.state.value, next, event);
      return this;
    });
    __publicField(this, "setupContextWatchers", () => {
      const { watch } = this.config;
      if (!watch) return;
      let prev = snapshot(this.state.context);
      const cleanup = subscribe(this.state.context, () => {
        const next = snapshot(this.state.context);
        for (const [key2, fn] of Object.entries(watch)) {
          const isEqual2 = this.options.compareFns?.[key2] ?? Object.is;
          if (isEqual2(prev[key2], next[key2])) continue;
          this.executeActions(fn, this.state.event);
        }
        prev = next;
      });
      this.contextWatchers.add(cleanup);
    });
    __publicField(this, "stop", () => {
      if (this.status === "Stopped") return;
      this.performExitEffects(this.state.value, toEvent(
        "machine.stop"
        /* Stop */
      ));
      this.executeActions(this.config.exit, toEvent(
        "machine.stop"
        /* Stop */
      ));
      this.setState("");
      this.setEvent(
        "machine.stop"
        /* Stop */
      );
      this.stopStateListeners();
      this.stopChildren();
      this.stopActivities();
      this.stopDelayedEvents();
      this.stopContextWatchers();
      this.status = "Stopped";
      return this;
    });
    __publicField(this, "stopStateListeners", () => {
      this.removeStateListener();
      this.stateListeners.clear();
    });
    __publicField(this, "stopContextWatchers", () => {
      this.contextWatchers.forEach((fn) => fn());
      this.contextWatchers.clear();
    });
    __publicField(this, "stopDelayedEvents", () => {
      this.delayedEvents.forEach((state) => {
        state.forEach((stop) => stop());
      });
      this.delayedEvents.clear();
    });
    __publicField(this, "stopActivities", (state) => {
      if (state) {
        this.activityEvents.get(state)?.forEach((stop) => stop());
        this.activityEvents.get(state)?.clear();
        this.activityEvents.delete(state);
      } else {
        this.activityEvents.forEach((state2) => {
          state2.forEach((stop) => stop());
          state2.clear();
        });
        this.activityEvents.clear();
      }
    });
    __publicField(this, "sendChild", (evt, to) => {
      const event = toEvent(evt);
      const id = runIfFn(to, this.contextSnapshot);
      const child = this.children.get(id);
      if (!child) {
        invariant(`[@zag-js/core] Cannot send '${event.type}' event to unknown child`);
      }
      child.send(event);
    });
    __publicField(this, "stopChild", (id) => {
      if (!this.children.has(id)) {
        invariant(`[@zag-js/core > stop-child] Cannot stop unknown child ${id}`);
      }
      this.children.get(id).stop();
      this.children.delete(id);
    });
    __publicField(this, "removeChild", (id) => {
      this.children.delete(id);
    });
    __publicField(this, "stopChildren", () => {
      this.children.forEach((child) => child.stop());
      this.children.clear();
    });
    __publicField(this, "setParent", (parent) => {
      this.parent = parent;
    });
    __publicField(this, "spawn", (src, id) => {
      const actor = runIfFn(src);
      if (id) actor.id = id;
      actor.type = "machine.actor";
      actor.setParent(this);
      this.children.set(actor.id, cast(actor));
      actor.onDone(() => {
        this.removeChild(actor.id);
      }).start();
      return cast(ref(actor));
    });
    __publicField(this, "stopActivity", (key2) => {
      if (!this.state.value) return;
      const cleanups2 = this.activityEvents.get(this.state.value);
      cleanups2?.get(key2)?.();
      cleanups2?.delete(key2);
    });
    __publicField(this, "addActivityCleanup", (state, key2, cleanup) => {
      if (!state) return;
      if (!this.activityEvents.has(state)) {
        this.activityEvents.set(state, /* @__PURE__ */ new Map([[key2, cleanup]]));
      } else {
        this.activityEvents.get(state)?.set(key2, cleanup);
      }
    });
    __publicField(this, "setState", (target) => {
      this.state.previousValue = this.state.value;
      this.state.value = target;
      const stateNode = this.getStateNode(target);
      if (target == null) {
        clear(this.state.tags);
      } else {
        this.state.tags = toArray(stateNode?.tags);
      }
    });
    __publicField(this, "setContext", (context) => {
      if (!context) return;
      deepMerge(this.state.context, compact(context));
    });
    __publicField(this, "setOptions", (options2) => {
      const opts = compact(options2);
      this.actionMap = { ...this.actionMap, ...opts.actions };
      this.delayMap = { ...this.delayMap, ...opts.delays };
      this.activityMap = { ...this.activityMap, ...opts.activities };
      this.guardMap = { ...this.guardMap, ...opts.guards };
    });
    __publicField(this, "getStateNode", (state) => {
      if (!state) return;
      return this.config.states?.[state];
    });
    __publicField(this, "getNextStateInfo", (transitions, event) => {
      const transition = this.determineTransition(transitions, event);
      const isTargetless = !transition?.target;
      const target = transition?.target ?? this.state.value;
      const changed = this.state.value !== target;
      const stateNode = this.getStateNode(target);
      const reenter = !isTargetless && !changed && !transition?.internal;
      const info = {
        reenter,
        transition,
        stateNode,
        target,
        changed
      };
      this.log("NextState:", `[${event.type}]`, this.state.value, "---->", info.target);
      return info;
    });
    __publicField(this, "getAfterActions", (transition, delay) => {
      let id;
      const current = this.state.value;
      return {
        entry: () => {
          id = globalThis.setTimeout(() => {
            const next = this.getNextStateInfo(transition, this.state.event);
            this.performStateChangeEffects(current, next, this.state.event);
          }, delay);
        },
        exit: () => {
          globalThis.clearTimeout(id);
        }
      };
    });
    __publicField(this, "getDelayedEventActions", (state) => {
      const stateNode = this.getStateNode(state);
      const event = this.state.event;
      if (!stateNode || !stateNode.after) return;
      const entries = [];
      const exits = [];
      if (isArray(stateNode.after)) {
        const transition = this.determineTransition(stateNode.after, event);
        if (!transition) return;
        if (!hasProp(transition, "delay")) {
          throw new Error(`[@zag-js/core > after] Delay is required for after transition: ${JSON.stringify(transition)}`);
        }
        const determineDelay = determineDelayFn(transition.delay, this.delayMap);
        const __delay = determineDelay(this.contextSnapshot, event);
        const actions = this.getAfterActions(transition, __delay);
        entries.push(actions.entry);
        exits.push(actions.exit);
        return { entries, exits };
      }
      if (isObject$1(stateNode.after)) {
        for (const delay in stateNode.after) {
          const transition = stateNode.after[delay];
          const determineDelay = determineDelayFn(delay, this.delayMap);
          const __delay = determineDelay(this.contextSnapshot, event);
          const actions = this.getAfterActions(transition, __delay);
          entries.push(actions.entry);
          exits.push(actions.exit);
        }
      }
      return { entries, exits };
    });
    __publicField(this, "executeActions", (actions, event) => {
      const pickedActions = determineActionsFn(actions, this.guardMap)(this.contextSnapshot, event, this.guardMeta);
      for (const action of toArray(pickedActions)) {
        const fn = isString(action) ? this.actionMap?.[action] : action;
        warn(
          isString(action) && !fn,
          `[@zag-js/core > execute-actions] No implementation found for action: \`${action}\``
        );
        fn?.(this.state.context, event, this.meta);
      }
    });
    __publicField(this, "executeActivities", (event, activities, state) => {
      for (const activity of activities) {
        const fn = isString(activity) ? this.activityMap?.[activity] : activity;
        if (!fn) {
          warn(`[@zag-js/core > execute-activity] No implementation found for activity: \`${activity}\``);
          continue;
        }
        const cleanup = fn(this.state.context, event, this.meta);
        if (cleanup) {
          const key2 = isString(activity) ? activity : activity.name || uuid();
          this.addActivityCleanup(state ?? this.state.value, key2, cleanup);
        }
      }
    });
    __publicField(this, "createEveryActivities", (every, callbackfn) => {
      if (!every) return;
      if (isArray(every)) {
        const picked = toArray(every).find((transition) => {
          const delayOrFn = transition.delay;
          const determineDelay2 = determineDelayFn(delayOrFn, this.delayMap);
          const delay2 = determineDelay2(this.contextSnapshot, this.state.event);
          const determineGuard = determineGuardFn(transition.guard, this.guardMap);
          const guard = determineGuard(this.contextSnapshot, this.state.event, this.guardMeta);
          return guard ?? delay2 != null;
        });
        if (!picked) return;
        const determineDelay = determineDelayFn(picked.delay, this.delayMap);
        const delay = determineDelay(this.contextSnapshot, this.state.event);
        const activity = () => {
          const id = globalThis.setInterval(() => {
            this.executeActions(picked.actions, this.state.event);
          }, delay);
          return () => {
            globalThis.clearInterval(id);
          };
        };
        callbackfn(activity);
      } else {
        for (const interval in every) {
          const actions = every?.[interval];
          const determineDelay = determineDelayFn(interval, this.delayMap);
          const delay = determineDelay(this.contextSnapshot, this.state.event);
          const activity = () => {
            const id = globalThis.setInterval(() => {
              this.executeActions(actions, this.state.event);
            }, delay);
            return () => {
              globalThis.clearInterval(id);
            };
          };
          callbackfn(activity);
        }
      }
    });
    __publicField(this, "setEvent", (event) => {
      this.state.previousEvent = this.state.event;
      this.state.event = ref(toEvent(event));
    });
    __publicField(this, "performExitEffects", (current, event) => {
      const currentState = this.state.value;
      if (currentState === "") return;
      const stateNode = current ? this.getStateNode(current) : void 0;
      this.stopActivities(currentState);
      const _exit = determineActionsFn(stateNode?.exit, this.guardMap)(this.contextSnapshot, event, this.guardMeta);
      const exitActions = toArray(_exit);
      const afterExitActions = this.delayedEvents.get(currentState);
      if (afterExitActions) {
        exitActions.push(...afterExitActions);
      }
      this.executeActions(exitActions, event);
      this.delayedEvents.delete(currentState);
    });
    __publicField(this, "performEntryEffects", (next, event) => {
      const stateNode = this.getStateNode(next);
      const activities = toArray(stateNode?.activities);
      this.createEveryActivities(stateNode?.every, (activity) => {
        activities.unshift(activity);
      });
      if (activities.length > 0) {
        this.executeActivities(event, activities);
      }
      const pickedActions = determineActionsFn(stateNode?.entry, this.guardMap)(
        this.contextSnapshot,
        event,
        this.guardMeta
      );
      const entryActions = toArray(pickedActions);
      const afterActions = this.getDelayedEventActions(next);
      if (stateNode?.after && afterActions) {
        this.delayedEvents.set(next, afterActions?.exits);
        entryActions.push(...afterActions.entries);
      }
      this.executeActions(entryActions, event);
      if (stateNode?.type === "final") {
        this.state.done = true;
        this.doneListeners.forEach((listener) => {
          listener(this.stateSnapshot);
        });
        this.stop();
      }
    });
    __publicField(this, "performTransitionEffects", (transitions, event) => {
      const transition = this.determineTransition(transitions, event);
      this.executeActions(transition?.actions, event);
    });
    __publicField(this, "performStateChangeEffects", (current, next, event) => {
      this.setEvent(event);
      const changed = next.changed || next.reenter;
      if (changed) {
        this.performExitEffects(current, event);
      }
      this.performTransitionEffects(next.transition, event);
      this.setState(next.target);
      if (changed) {
        this.performEntryEffects(next.target, event);
      }
    });
    __publicField(this, "determineTransition", (transition, event) => {
      const fn = determineTransitionFn(transition, this.guardMap);
      return fn?.(this.contextSnapshot, event, this.guardMeta);
    });
    __publicField(this, "sendParent", (evt) => {
      if (!this.parent) {
        invariant("[@zag-js/core > send-parent] Cannot send event to an unknown parent");
      }
      const event = toEvent(evt);
      this.parent?.send(event);
    });
    __publicField(this, "log", (...args) => {
      if (isDev$1() && this.options.debug) {
        console.log(...args);
      }
    });
    __publicField(this, "send", (evt) => {
      const event = toEvent(evt);
      this.transition(this.state.value, event);
    });
    __publicField(this, "transition", (state, evt) => {
      const stateNode = isString(state) ? this.getStateNode(state) : state?.stateNode;
      const event = toEvent(evt);
      if (!stateNode && !this.config.on) {
        const msg = this.status === "Stopped" ? "[@zag-js/core > transition] Cannot transition a stopped machine" : `[@zag-js/core > transition] State does not have a definition for \`state\`: ${state}, \`event\`: ${event.type}`;
        warn(msg);
        return;
      }
      const transitions = (
        // @ts-expect-error - Fix this
        stateNode?.on?.[event.type] ?? this.config.on?.[event.type]
      );
      const next = this.getNextStateInfo(transitions, event);
      this.performStateChangeEffects(this.state.value, next, event);
      return next.stateNode;
    });
    __publicField(this, "subscribe", (listener) => {
      this.stateListeners.add(listener);
      if (this.status === "Running") {
        listener(this.stateSnapshot);
      }
      return () => {
        this.stateListeners.delete(listener);
      };
    });
    __publicField(this, "onDone", (listener) => {
      this.doneListeners.add(listener);
      return this;
    });
    __publicField(this, "onTransition", (listener) => {
      this.stateListeners.add(listener);
      if (this.status === "Running") {
        listener(this.stateSnapshot);
      }
      return this;
    });
    this.config = clone(config);
    this.options = clone(options ?? {});
    this.id = this.config.id ?? `machine-${uuid()}`;
    this.guardMap = this.options?.guards ?? {};
    this.actionMap = this.options?.actions ?? {};
    this.delayMap = this.options?.delays ?? {};
    this.activityMap = this.options?.activities ?? {};
    this.sync = this.options?.sync ?? false;
    this.state = createProxy(this.config);
    this.initialContext = snapshot(this.state.context);
  }
  // immutable state value
  get stateSnapshot() {
    return cast(snapshot(this.state));
  }
  getState() {
    return this.stateSnapshot;
  }
  // immutable context value
  get contextSnapshot() {
    return this.stateSnapshot.context;
  }
  /**
   * A reference to the instance methods of the machine.
   * Useful when spawning child machines and managing the communication between them.
   */
  get self() {
    const self2 = this;
    return {
      id: this.id,
      send: this.send.bind(this),
      sendParent: this.sendParent.bind(this),
      sendChild: this.sendChild.bind(this),
      stop: this.stop.bind(this),
      stopChild: this.stopChild.bind(this),
      spawn: this.spawn.bind(this),
      stopActivity: this.stopActivity.bind(this),
      get state() {
        return self2.stateSnapshot;
      },
      get initialContext() {
        return self2.initialContext;
      },
      get initialState() {
        return self2.initialState?.target ?? "";
      }
    };
  }
  get meta() {
    return {
      state: this.stateSnapshot,
      guards: this.guardMap,
      send: this.send.bind(this),
      self: this.self,
      initialContext: this.initialContext,
      initialState: this.initialState?.target ?? "",
      getState: () => this.stateSnapshot,
      getAction: (key2) => this.actionMap[key2],
      getGuard: (key2) => this.guardMap[key2]
    };
  }
  get guardMeta() {
    return {
      state: this.stateSnapshot
    };
  }
  get [Symbol.toStringTag]() {
    return "Machine";
  }
  getHydrationState() {
    const state = this.getState();
    return {
      value: state.value,
      tags: state.tags
    };
  }
};
var createMachine = (config, options) => new Machine(config, options);
var clsx = (...args) => args.map((str) => str?.trim?.()).filter(Boolean).join(" ");
var CSS_REGEX = /((?:--)?(?:\w+-?)+)\s*:\s*([^;]*)/g;
var serialize = (style) => {
  const res = {};
  let match;
  while (match = CSS_REGEX.exec(style)) {
    res[match[1]] = match[2];
  }
  return res;
};
var css = (a, b) => {
  if (isString(a)) {
    if (isString(b)) return `${a};${b}`;
    a = serialize(a);
  } else if (isString(b)) {
    b = serialize(b);
  }
  return Object.assign({}, a ?? {}, b ?? {});
};
function mergeProps(...args) {
  let result = {};
  for (let props of args) {
    for (let key2 in result) {
      if (key2.startsWith("on") && typeof result[key2] === "function" && typeof props[key2] === "function") {
        result[key2] = callAll(props[key2], result[key2]);
        continue;
      }
      if (key2 === "className" || key2 === "class") {
        result[key2] = clsx(result[key2], props[key2]);
        continue;
      }
      if (key2 === "style") {
        result[key2] = css(result[key2], props[key2]);
        continue;
      }
      result[key2] = props[key2] !== void 0 ? props[key2] : result[key2];
    }
    for (let key2 in props) {
      if (result[key2] === void 0) {
        result[key2] = props[key2];
      }
    }
  }
  return result;
}
function createNormalizer(fn) {
  return new Proxy({}, {
    get() {
      return fn;
    }
  });
}
var createProps = () => (props) => Array.from(new Set(props));
var anatomy$3 = createAnatomy("accordion").parts("root", "item", "itemTrigger", "itemContent", "itemIndicator");
var parts$3 = anatomy$3.build();
var dom$3 = createScope({
  getRootId: (ctx) => ctx.ids?.root ?? `accordion:${ctx.id}`,
  getItemId: (ctx, value) => ctx.ids?.item?.(value) ?? `accordion:${ctx.id}:item:${value}`,
  getItemContentId: (ctx, value) => ctx.ids?.itemContent?.(value) ?? `accordion:${ctx.id}:content:${value}`,
  getItemTriggerId: (ctx, value) => ctx.ids?.itemTrigger?.(value) ?? `accordion:${ctx.id}:trigger:${value}`,
  getRootEl: (ctx) => dom$3.getById(ctx, dom$3.getRootId(ctx)),
  getTriggerEls: (ctx) => {
    const ownerId = CSS.escape(dom$3.getRootId(ctx));
    const selector = `[aria-controls][data-ownedby='${ownerId}']:not([disabled])`;
    return queryAll(dom$3.getRootEl(ctx), selector);
  },
  getFirstTriggerEl: (ctx) => first(dom$3.getTriggerEls(ctx)),
  getLastTriggerEl: (ctx) => last(dom$3.getTriggerEls(ctx)),
  getNextTriggerEl: (ctx, id) => nextById(dom$3.getTriggerEls(ctx), dom$3.getItemTriggerId(ctx, id)),
  getPrevTriggerEl: (ctx, id) => prevById(dom$3.getTriggerEls(ctx), dom$3.getItemTriggerId(ctx, id))
});
function connect$3(state, send, normalize) {
  const focusedValue = state.context.focusedValue;
  const value = state.context.value;
  const multiple = state.context.multiple;
  function setValue(value2) {
    let nextValue = value2;
    if (multiple && nextValue.length > 1) {
      nextValue = [nextValue[0]];
    }
    send({ type: "VALUE.SET", value: nextValue });
  }
  function getItemState(props2) {
    return {
      expanded: value.includes(props2.value),
      focused: focusedValue === props2.value,
      disabled: Boolean(props2.disabled ?? state.context.disabled)
    };
  }
  return {
    focusedValue,
    value,
    setValue,
    getItemState,
    getRootProps() {
      return normalize.element({
        ...parts$3.root.attrs,
        dir: state.context.dir,
        id: dom$3.getRootId(state.context),
        "data-orientation": state.context.orientation
      });
    },
    getItemProps(props2) {
      const itemState = getItemState(props2);
      return normalize.element({
        ...parts$3.item.attrs,
        dir: state.context.dir,
        id: dom$3.getItemId(state.context, props2.value),
        "data-state": itemState.expanded ? "open" : "closed",
        "data-focus": dataAttr(itemState.focused),
        "data-disabled": dataAttr(itemState.disabled),
        "data-orientation": state.context.orientation
      });
    },
    getItemContentProps(props2) {
      const itemState = getItemState(props2);
      return normalize.element({
        ...parts$3.itemContent.attrs,
        dir: state.context.dir,
        role: "region",
        id: dom$3.getItemContentId(state.context, props2.value),
        "aria-labelledby": dom$3.getItemTriggerId(state.context, props2.value),
        hidden: !itemState.expanded,
        "data-state": itemState.expanded ? "open" : "closed",
        "data-disabled": dataAttr(itemState.disabled),
        "data-focus": dataAttr(itemState.focused),
        "data-orientation": state.context.orientation
      });
    },
    getItemIndicatorProps(props2) {
      const itemState = getItemState(props2);
      return normalize.element({
        ...parts$3.itemIndicator.attrs,
        dir: state.context.dir,
        "aria-hidden": true,
        "data-state": itemState.expanded ? "open" : "closed",
        "data-disabled": dataAttr(itemState.disabled),
        "data-focus": dataAttr(itemState.focused),
        "data-orientation": state.context.orientation
      });
    },
    getItemTriggerProps(props2) {
      const { value: value2 } = props2;
      const itemState = getItemState(props2);
      return normalize.button({
        ...parts$3.itemTrigger.attrs,
        type: "button",
        dir: state.context.dir,
        id: dom$3.getItemTriggerId(state.context, value2),
        "aria-controls": dom$3.getItemContentId(state.context, value2),
        "aria-expanded": itemState.expanded,
        disabled: itemState.disabled,
        "data-orientation": state.context.orientation,
        "aria-disabled": itemState.disabled,
        "data-state": itemState.expanded ? "open" : "closed",
        "data-ownedby": dom$3.getRootId(state.context),
        onFocus() {
          if (itemState.disabled) return;
          send({ type: "TRIGGER.FOCUS", value: value2 });
        },
        onBlur() {
          if (itemState.disabled) return;
          send("TRIGGER.BLUR");
        },
        onClick(event) {
          if (itemState.disabled) return;
          if (isSafari()) {
            event.currentTarget.focus();
          }
          send({ type: "TRIGGER.CLICK", value: value2 });
        },
        onKeyDown(event) {
          if (event.defaultPrevented) return;
          if (itemState.disabled) return;
          const keyMap2 = {
            ArrowDown() {
              if (state.context.isHorizontal) return;
              send({ type: "GOTO.NEXT", value: value2 });
            },
            ArrowUp() {
              if (state.context.isHorizontal) return;
              send({ type: "GOTO.PREV", value: value2 });
            },
            ArrowRight() {
              if (!state.context.isHorizontal) return;
              send({ type: "GOTO.NEXT", value: value2 });
            },
            ArrowLeft() {
              if (!state.context.isHorizontal) return;
              send({ type: "GOTO.PREV", value: value2 });
            },
            Home() {
              send({ type: "GOTO.FIRST", value: value2 });
            },
            End() {
              send({ type: "GOTO.LAST", value: value2 });
            }
          };
          const key2 = getEventKey(event, {
            dir: state.context.dir,
            orientation: state.context.orientation
          });
          const exec2 = keyMap2[key2];
          if (exec2) {
            exec2(event);
            event.preventDefault();
          }
        }
      });
    }
  };
}
var { and, not: not$2 } = guards;
function machine$3(userContext) {
  const ctx = compact(userContext);
  return createMachine(
    {
      id: "accordion",
      initial: "idle",
      context: {
        focusedValue: null,
        value: [],
        collapsible: false,
        multiple: false,
        orientation: "vertical",
        ...ctx
      },
      watch: {
        value: "coarseValue",
        multiple: "coarseValue"
      },
      created: "coarseValue",
      computed: {
        isHorizontal: (ctx2) => ctx2.orientation === "horizontal"
      },
      on: {
        "VALUE.SET": {
          actions: ["setValue"]
        }
      },
      states: {
        idle: {
          on: {
            "TRIGGER.FOCUS": {
              target: "focused",
              actions: "setFocusedValue"
            }
          }
        },
        focused: {
          on: {
            "GOTO.NEXT": {
              actions: "focusNextTrigger"
            },
            "GOTO.PREV": {
              actions: "focusPrevTrigger"
            },
            "TRIGGER.CLICK": [
              {
                guard: and("isExpanded", "canToggle"),
                actions: ["collapse"]
              },
              {
                guard: not$2("isExpanded"),
                actions: ["expand"]
              }
            ],
            "GOTO.FIRST": {
              actions: "focusFirstTrigger"
            },
            "GOTO.LAST": {
              actions: "focusLastTrigger"
            },
            "TRIGGER.BLUR": {
              target: "idle",
              actions: "clearFocusedValue"
            }
          }
        }
      }
    },
    {
      guards: {
        canToggle: (ctx2) => !!ctx2.collapsible || !!ctx2.multiple,
        isExpanded: (ctx2, evt) => ctx2.value.includes(evt.value)
      },
      actions: {
        collapse(ctx2, evt) {
          const next = ctx2.multiple ? remove(ctx2.value, evt.value) : [];
          set$2.value(ctx2, ctx2.multiple ? next : []);
        },
        expand(ctx2, evt) {
          const next = ctx2.multiple ? add(ctx2.value, evt.value) : [evt.value];
          set$2.value(ctx2, next);
        },
        focusFirstTrigger(ctx2) {
          dom$3.getFirstTriggerEl(ctx2)?.focus();
        },
        focusLastTrigger(ctx2) {
          dom$3.getLastTriggerEl(ctx2)?.focus();
        },
        focusNextTrigger(ctx2) {
          if (!ctx2.focusedValue) return;
          const triggerEl = dom$3.getNextTriggerEl(ctx2, ctx2.focusedValue);
          triggerEl?.focus();
        },
        focusPrevTrigger(ctx2) {
          if (!ctx2.focusedValue) return;
          const triggerEl = dom$3.getPrevTriggerEl(ctx2, ctx2.focusedValue);
          triggerEl?.focus();
        },
        setFocusedValue(ctx2, evt) {
          set$2.focusedValue(ctx2, evt.value);
        },
        clearFocusedValue(ctx2) {
          set$2.focusedValue(ctx2, null);
        },
        setValue(ctx2, evt) {
          set$2.value(ctx2, evt.value);
        },
        coarseValue(ctx2) {
          if (!ctx2.multiple && ctx2.value.length > 1) {
            warn(`The value of accordion should be a single value when multiple is false.`);
            ctx2.value = [ctx2.value[0]];
          }
        }
      }
    }
  );
}
var invoke$2 = {
  change(ctx) {
    ctx.onValueChange?.({ value: Array.from(ctx.value) });
  },
  focusChange(ctx) {
    ctx.onFocusChange?.({ value: ctx.focusedValue });
  }
};
var set$2 = {
  value(ctx, value) {
    if (isEqual(ctx.value, value)) return;
    ctx.value = value;
    invoke$2.change(ctx);
  },
  focusedValue(ctx, value) {
    if (isEqual(ctx.focusedValue, value)) return;
    ctx.focusedValue = value;
    invoke$2.focusChange(ctx);
  }
};
createProps()([
  "collapsible",
  "dir",
  "disabled",
  "getRootNode",
  "id",
  "ids",
  "multiple",
  "onFocusChange",
  "onValueChange",
  "orientation",
  "value"
]);
createProps()(["value", "disabled"]);
const propMap = {
  className: "class",
  defaultChecked: "checked",
  defaultValue: "value",
  htmlFor: "for",
  onBlur: "onfocusout",
  onChange: "oninput",
  onFocus: "onfocusin",
  onDoubleClick: "ondblclick"
};
function toStyleString(style) {
  let string = "";
  for (let key2 in style) {
    const value = style[key2];
    if (value === null || value === void 0)
      continue;
    if (!key2.startsWith("--"))
      key2 = key2.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
    string += `${key2}:${value};`;
  }
  return string;
}
const preserveKeys = "viewBox,className,preserveAspectRatio,fillRule,clipPath,clipRule,strokeWidth,strokeLinecap,strokeLinejoin,strokeDasharray,strokeDashoffset,strokeMiterlimit".split(",");
function toSvelteProp(key2) {
  if (key2 in propMap)
    return propMap[key2];
  if (preserveKeys.includes(key2))
    return key2;
  return key2.toLowerCase();
}
function toSveltePropValue(key2, value) {
  if (key2 === "style" && typeof value === "object")
    return toStyleString(value);
  if (value === false)
    return;
  return value;
}
const normalizeProps = createNormalizer((props) => {
  const normalized = {};
  for (const key2 in props) {
    normalized[toSvelteProp(key2)] = toSveltePropValue(key2, props[key2]);
  }
  return normalized;
});
const isFunction = (value) => typeof value === "function";
function reflect(obj) {
  return new Proxy(obj(), {
    get(_, prop) {
      const target = obj();
      let value = Reflect.get(target, prop);
      return isFunction(value) ? value.bind(target) : value;
    }
  });
}
function useSnapshot(service) {
  let state = service.state;
  const unsubscribe = service.subscribe((nextState) => {
    state = nextState;
  });
  onDestroy(unsubscribe);
  return reflect(() => state);
}
function useService(machine2, options) {
  const service = typeof machine2 === "function" ? machine2() : machine2;
  const contextSnapshot = options?.context;
  service.setContext(contextSnapshot);
  service._created();
  return service;
}
function useMachine(machine2, options) {
  const service = useService(machine2, options);
  const state = useSnapshot(service);
  return [state, service.send, service];
}
const useId = /* @__PURE__ */ (() => {
  let id = 0;
  return () => Math.random().toString(36).substring(2) + id++;
})();
function createContext(defaultValue) {
  const key2 = Symbol();
  const set2 = (value) => setContext(key2, value);
  const get = () => getContext(key2) ?? defaultValue;
  return [set2, get, key2];
}
const [setAccordionContext, getAccordionContext, key$3] = createContext();
function Accordion($$payload, $$props) {
  push();
  let {
    value = [],
    animDuration = 200,
    // Root
    base = "",
    padding = "",
    spaceY = "space-y-2",
    rounded = "rounded",
    width = "w-full",
    classes = "",
    // Snippets
    children,
    iconOpen,
    iconClosed,
    $$slots,
    $$events,
    ...zagProps
  } = $$props;
  const [snapshot2, send] = useMachine(
    machine$3({
      id: useId(),
      onValueChange(details) {
        value = details.value;
      }
    }),
    {
      context: {
        ...zagProps,
        get value() {
          return snapshot$1(value);
        }
      }
    }
  );
  const api = connect$3(snapshot2, send, normalizeProps);
  setAccordionContext({
    get api() {
      return api;
    },
    get animDuration() {
      return animDuration;
    },
    get iconClosed() {
      return iconClosed;
    },
    get iconOpen() {
      return iconOpen;
    }
  });
  $$payload.out += `<div${spread_attributes({
    class: `${stringify(base)} ${stringify(padding)} ${stringify(spaceY)} ${stringify(rounded)} ${stringify(width)} ${stringify(classes)}`,
    ...api.getRootProps(),
    "data-testid": "accordion"
  })}>`;
  children?.($$payload);
  $$payload.out += `<!----></div>`;
  bind_props($$props, { value });
  pop();
}
function AccordionItem($$payload, $$props) {
  push();
  const {
    headingElement = "h3",
    // Root
    base,
    spaceY,
    classes,
    // Control
    controlBase = "flex text-start items-center space-x-4 w-full",
    controlHover = "hover:preset-tonal-primary",
    controlPadding = "py-2 px-4",
    controlRounded = "rounded",
    controlClasses,
    // Lead
    leadBase = "",
    leadClasses = "",
    // Content
    contentBase = "flex-1",
    contentClasses = "",
    // Indicator
    indicatorBase = "",
    indicatorClasses = "",
    // Panel
    panelBase,
    panelPadding = "py-2 px-4",
    panelRounded,
    panelClasses,
    // Snippets
    control,
    lead,
    panel,
    $$slots,
    $$events,
    ...zagProps
  } = $$props;
  const ctx = getAccordionContext();
  const paraglide_sveltekit_translate_attribute_pass_translationFunctions = getTranslationFunctions();
  const [
    paraglide_sveltekit_translate_attribute_pass_translateAttribute,
    paraglide_sveltekit_translate_attribute_pass_handle_attributes
  ] = paraglide_sveltekit_translate_attribute_pass_translationFunctions;
  $$payload.out += `<div${spread_attributes({
    class: `${stringify(base)} ${stringify(spaceY)} ${stringify(classes)}`,
    ...ctx.api.getItemProps(zagProps),
    "data-testid": "accordion-item"
  })}>`;
  element($$payload, headingElement, void 0, () => {
    $$payload.out += `<button${spread_attributes({
      ...paraglide_sveltekit_translate_attribute_pass_handle_attributes(
        {
          "class": `${controlBase} ${controlHover} ${controlPadding} ${controlRounded} ${controlClasses}`,
          ...ctx.api.getItemTriggerProps(zagProps),
          "data-testid": `accordion-control`
        },
        [{ attribute_name: "formaction" }]
      )
    })}>`;
    if (lead) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div${attr("class", `${stringify(leadBase)} ${stringify(leadClasses)}`)} data-testid="accordion-lead">`;
      lead($$payload);
      $$payload.out += `<!----></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div${attr("class", `${stringify(contentBase)} ${stringify(contentClasses)}`)} data-testid="accordion-control">`;
    control($$payload);
    $$payload.out += `<!----></div> <div${attr("class", `${stringify(indicatorBase)} ${stringify(indicatorClasses)}`)} data-testid="accordion-indicator">`;
    if (ctx.api.value.includes(zagProps.value)) {
      $$payload.out += "<!--[-->";
      if (ctx.iconOpen) {
        $$payload.out += "<!--[-->";
        ctx.iconOpen($$payload);
        $$payload.out += `<!---->`;
      } else {
        $$payload.out += "<!--[!-->";
        $$payload.out += `−`;
      }
      $$payload.out += `<!--]-->`;
    } else {
      $$payload.out += "<!--[!-->";
      if (ctx.iconClosed) {
        $$payload.out += "<!--[-->";
        ctx.iconClosed($$payload);
        $$payload.out += `<!---->`;
      } else {
        $$payload.out += "<!--[!-->";
        $$payload.out += `+`;
      }
      $$payload.out += `<!--]-->`;
    }
    $$payload.out += `<!--]--></div></button>`;
  });
  $$payload.out += ` `;
  if (ctx.api.value.includes(zagProps.value)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div${spread_attributes({
      class: `${stringify(panelBase)} ${stringify(panelPadding)} ${stringify(panelRounded)} ${stringify(panelClasses)}`,
      ...ctx.api.getItemContentProps(zagProps),
      "data-testid": "accordion-panel"
    })}>`;
    panel?.($$payload);
    $$payload.out += `<!----></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
Object.assign(Accordion, { Item: AccordionItem });
var anatomy$2 = createAnatomy("avatar").parts("root", "image", "fallback");
var parts$2 = anatomy$2.build();
var dom$2 = createScope({
  getRootId: (ctx) => ctx.ids?.root ?? `avatar:${ctx.id}`,
  getImageId: (ctx) => ctx.ids?.image ?? `avatar:${ctx.id}:image`,
  getFallbackId: (ctx) => ctx.ids?.fallback ?? `avatar:${ctx.id}:fallback`,
  getRootEl: (ctx) => dom$2.getById(ctx, dom$2.getRootId(ctx)),
  getImageEl: (ctx) => dom$2.getById(ctx, dom$2.getImageId(ctx))
});
function connect$2(state, send, normalize) {
  const loaded = state.matches("loaded");
  return {
    loaded,
    setSrc(src) {
      send({ type: "SRC.SET", src });
    },
    setLoaded() {
      send({ type: "IMG.LOADED", src: "api" });
    },
    setError() {
      send({ type: "IMG.ERROR", src: "api" });
    },
    getRootProps() {
      return normalize.element({
        ...parts$2.root.attrs,
        dir: state.context.dir,
        id: dom$2.getRootId(state.context)
      });
    },
    getImageProps() {
      return normalize.img({
        ...parts$2.image.attrs,
        hidden: !loaded,
        dir: state.context.dir,
        id: dom$2.getImageId(state.context),
        "data-state": loaded ? "visible" : "hidden",
        onLoad() {
          send({ type: "IMG.LOADED", src: "element" });
        },
        onError() {
          send({ type: "IMG.ERROR", src: "element" });
        }
      });
    },
    getFallbackProps() {
      return normalize.element({
        ...parts$2.fallback.attrs,
        dir: state.context.dir,
        id: dom$2.getFallbackId(state.context),
        hidden: loaded,
        "data-state": loaded ? "hidden" : "visible"
      });
    }
  };
}
function machine$2(userContext) {
  const ctx = compact(userContext);
  return createMachine(
    {
      id: "avatar",
      initial: "loading",
      activities: ["trackImageRemoval"],
      context: ctx,
      on: {
        "SRC.CHANGE": {
          target: "loading"
        },
        "IMG.UNMOUNT": {
          target: "error"
        }
      },
      states: {
        loading: {
          activities: ["trackSrcChange"],
          entry: ["checkImageStatus"],
          on: {
            "IMG.LOADED": {
              target: "loaded",
              actions: ["invokeOnLoad"]
            },
            "IMG.ERROR": {
              target: "error",
              actions: ["invokeOnError"]
            }
          }
        },
        error: {
          activities: ["trackSrcChange"],
          on: {
            "IMG.LOADED": {
              target: "loaded",
              actions: ["invokeOnLoad"]
            }
          }
        },
        loaded: {
          activities: ["trackSrcChange"],
          on: {
            "IMG.ERROR": {
              target: "error",
              actions: ["invokeOnError"]
            }
          }
        }
      }
    },
    {
      activities: {
        trackSrcChange(ctx2, _evt, { send }) {
          const imageEl = dom$2.getImageEl(ctx2);
          return observeAttributes(imageEl, {
            attributes: ["src", "srcset"],
            callback() {
              send({ type: "SRC.CHANGE" });
            }
          });
        },
        trackImageRemoval(ctx2, _evt, { send }) {
          const rootEl = dom$2.getRootEl(ctx2);
          return observeChildren(rootEl, {
            callback(records) {
              const removedNodes = Array.from(records[0].removedNodes);
              const removed = removedNodes.find(
                (node) => node.nodeType === Node.ELEMENT_NODE && node.matches("[data-scope=avatar][data-part=image]")
              );
              if (removed) {
                send({ type: "IMG.UNMOUNT" });
              }
            }
          });
        }
      },
      actions: {
        invokeOnLoad(ctx2) {
          ctx2.onStatusChange?.({ status: "loaded" });
        },
        invokeOnError(ctx2) {
          ctx2.onStatusChange?.({ status: "error" });
        },
        checkImageStatus(ctx2, _evt, { send }) {
          const imageEl = dom$2.getImageEl(ctx2);
          if (imageEl?.complete) {
            const type = hasLoaded(imageEl) ? "IMG.LOADED" : "IMG.ERROR";
            send({ type, src: "ssr" });
          }
        }
      }
    }
  );
}
function hasLoaded(image) {
  return image.complete && image.naturalWidth !== 0 && image.naturalHeight !== 0;
}
createProps()(["dir", "id", "ids", "onStatusChange", "getRootNode"]);
function Avatar($$payload, $$props) {
  push();
  let {
    src,
    srcset,
    name,
    filter,
    // Root
    base = "overflow-hidden isolate",
    background = "bg-surface-400-600",
    size = "size-16",
    font = "",
    border = "",
    rounded = "rounded-full",
    shadow = "",
    classes = "",
    // Image
    imageBase = "w-full object-cover",
    imageClasses = "",
    // Fallback
    fallbackBase = "w-full h-full flex justify-center items-center",
    fallbackClasses = "",
    // Snippets
    children
  } = $$props;
  const [snapshot2, send] = useMachine(machine$2({ id: useId() }));
  const api = connect$2(snapshot2, send, normalizeProps);
  function getInitials(name2) {
    return name2.split(" ").map((word) => word[0]).join("");
  }
  $$payload.out += `<figure${spread_attributes({
    ...api.getRootProps(),
    class: `${stringify(base)} ${stringify(background)} ${stringify(size)} ${stringify(font)} ${stringify(border)} ${stringify(rounded)} ${stringify(shadow)} ${stringify(classes)}`,
    "data-testid": "avatar"
  })}>`;
  if (src || srcset) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<img${spread_attributes(
      {
        ...api.getImageProps(),
        src,
        srcset,
        alt: name,
        class: `${stringify(imageBase)} ${stringify(imageClasses)}`,
        "data-testid": "avatar-image"
      },
      void 0,
      { filter: filter && `url(${filter})` }
    )} onload="this.__e=event" onerror="this.__e=event">`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <span${spread_attributes({
    ...api.getFallbackProps(),
    class: `${stringify(fallbackBase)} ${stringify(fallbackClasses)}`,
    "data-testid": "avatar-fallback"
  })}>`;
  if (children) {
    $$payload.out += "<!--[-->";
    children($$payload);
    $$payload.out += `<!---->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `${escape_html(getInitials(name))}`;
  }
  $$payload.out += `<!--]--></span></figure>`;
  pop();
}
const [setNavigationContext, getNavigationContext, key$2] = createContext({
  parent: "none",
  value: "",
  expanded: false,
  onSelectionHandler: () => {
  }
});
function NavBar($$payload, $$props) {
  push();
  let {
    value = "",
    // Root
    base = "flex flex-col",
    background = "preset-filled-surface-100-900",
    width = "min-w-[320px] w-full",
    height = "h-20",
    padding = "p-1",
    classes = "",
    // Tiles
    tilesBase = "flex-1 flex",
    tilesFlexDirection = "",
    tilesJustify = "justify-center",
    tilesItems = "items-center",
    tilesGap = "gap-1",
    tilesClasses = "",
    // Events
    onchange,
    // Snippets
    children
  } = $$props;
  function onSelectionHandler(id) {
    value = id;
    if (onchange) onchange(id);
  }
  setNavigationContext({
    parent: "bar",
    get value() {
      return value;
    },
    expanded: false,
    onSelectionHandler
  });
  $$payload.out += `<aside${attr("class", `${stringify(base)} ${stringify(background)} ${stringify(width)} ${stringify(height)} ${stringify(padding)} ${stringify(classes)}`)} data-testid="nav-bar">`;
  if (children) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<nav${attr("class", `${stringify(tilesBase)} ${stringify(tilesFlexDirection)} ${stringify(tilesJustify)} ${stringify(tilesItems)} ${stringify(tilesGap)} ${stringify(tilesClasses)}`)} data-testid="nav-bar-tileset">`;
    children($$payload);
    $$payload.out += `<!----></nav>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></aside>`;
  bind_props($$props, { value });
  pop();
}
function NavRail($$payload, $$props) {
  push();
  let {
    value = "",
    expanded = false,
    // Root
    base = "h-full flex flex-col",
    background = "preset-filled-surface-100-900",
    padding = "p-1",
    width = "w-24",
    widthExpanded = "w-64",
    height = "h-full",
    classes = "",
    // Header
    headerBase = "flex",
    headerFlexDirection = "flex-col",
    headerJustify = "justify-center",
    headerItems = "items-center",
    headerGap = "gap-1",
    headerClasses = "",
    // Tiles
    tilesBase = "flex-1 flex",
    tilesFlexDirection = "flex-col",
    tilesJustify = "justify-center",
    tilesItems = "items-center",
    tilesGap = "gap-1",
    tilesClasses = "",
    // Footer
    footerBase = "flex",
    footerFlexDirection = "flex-col",
    footerJustify = "justify-center",
    footerItems = "items-center",
    footerGap = "gap-1",
    footerClasses = "",
    // Events
    onchange,
    // Snippets
    header,
    tiles,
    footer
  } = $$props;
  function onSelectionHandler(id) {
    value = id;
    if (onchange) onchange(id);
  }
  setNavigationContext({
    parent: "rail",
    get value() {
      return value;
    },
    get expanded() {
      return expanded;
    },
    onSelectionHandler
  });
  let rxWidth = expanded ? widthExpanded : width;
  $$payload.out += `<aside${attr("class", `${stringify(base)} ${stringify(background)} ${stringify(height)} ${stringify(padding)} ${stringify(rxWidth)} ${stringify(classes)}`)} data-testid="nav-rail">`;
  if (header) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<header${attr("class", `${stringify(headerBase)} ${stringify(headerFlexDirection)} ${stringify(headerJustify)} ${stringify(headerItems)} ${stringify(headerGap)} ${stringify(headerClasses)}`)} data-testid="nav-rail-header">`;
    header($$payload);
    $$payload.out += `<!----></header>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (tiles) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<nav${attr("class", `${stringify(tilesBase)} ${stringify(tilesFlexDirection)} ${stringify(tilesJustify)} ${stringify(tilesItems)} ${stringify(tilesGap)} ${stringify(tilesClasses)}`)} data-testid="nav-rail-tiles">`;
    tiles($$payload);
    $$payload.out += `<!----></nav>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (footer) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<footer${attr("class", `${stringify(footerBase)} ${stringify(footerFlexDirection)} ${stringify(footerJustify)} ${stringify(footerItems)} ${stringify(footerGap)} ${stringify(footerClasses)}`)} data-testid="nav-rail-footer">`;
    footer($$payload);
    $$payload.out += `<!----></footer>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></aside>`;
  bind_props($$props, { value });
  pop();
}
function NavTile($$payload, $$props) {
  push();
  let {
    id,
    href,
    target,
    label,
    labelExpanded,
    title,
    selected = false,
    type = "button",
    // Root
    base = "flex items-center",
    width = "w-full",
    aspect = "aspect-square",
    background = "",
    hover = "hover:preset-filled-surface-50-950",
    active = "preset-filled-primary-500",
    padding = "p-2",
    gap = "gap-1",
    rounded = "rounded-container",
    classes = "flex-col justify-center",
    // Expanded
    expandedPadding = "py-3 px-4",
    expandedGap = "gap-4",
    expandedClasses = "",
    // Label (base)
    labelBase = "type-scale-1",
    labelClasses = "",
    // Label (expanded)
    labelExpandedBase = "",
    labelExpandedClasses = "",
    // Events
    onclick,
    // Snippets
    children
  } = $$props;
  const ctx = getNavigationContext();
  const element$1 = href ? "a" : "button";
  const role = href ? void 0 : "button";
  const rxSize = ctx.parent === "bar" ? `h-full` : `${aspect}`;
  const classesCollapsed = `${rxSize} ${padding} ${gap} ${classes}`;
  const classesExtended = `${expandedPadding} ${expandedGap} ${expandedClasses}`;
  const rxMode = ctx.expanded ? classesExtended : classesCollapsed;
  const rxBackground = selected || ctx.value === id ? active : `${background} ${hover}`;
  const paraglide_sveltekit_translate_attribute_pass_translationFunctions = getTranslationFunctions();
  const [
    paraglide_sveltekit_translate_attribute_pass_translateAttribute,
    paraglide_sveltekit_translate_attribute_pass_handle_attributes
  ] = paraglide_sveltekit_translate_attribute_pass_translationFunctions;
  element(
    $$payload,
    element$1,
    () => {
      $$payload.out += `${attr("class", `${stringify(base)} ${stringify(width)} ${stringify(rounded)} ${stringify(rxBackground)} ${stringify(rxMode)}`)}${attr("href", `${element$1}` === "a" ? paraglide_sveltekit_translate_attribute_pass_translateAttribute(href, void 0) : href)}${attr("target", target)}${attr("type", element$1 === "button" ? type : void 0)}${attr("title", title)}${attr("role", role)} tabindex="0" data-testid="nav-tile"`;
    },
    () => {
      if (children) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div>`;
        children($$payload);
        $$payload.out += `<!----></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (label && !ctx.expanded) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div${attr("class", `${stringify(labelBase)} ${stringify(labelClasses)}`)} data-testid="nav-tile-label">${escape_html(label)}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (labelExpanded && ctx.expanded) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div${attr("class", `${stringify(labelExpandedBase)} ${stringify(labelExpandedClasses)}`)} data-testid="nav-tile-label-expanded">${escape_html(labelExpanded)}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]-->`;
    }
  );
  pop();
}
Object.assign(NavRail, { Rail: NavRail, Bar: NavBar, Tile: NavTile });
function isVirtualClick(event) {
  if (event.mozInputSource === 0 && event.isTrusted) return true;
  return event.detail === 0 && !event.pointerType;
}
function isValidKey(e) {
  return !(e.metaKey || !isMac() && e.altKey || e.ctrlKey || e.key === "Control" || e.key === "Shift" || e.key === "Meta");
}
var nonTextInputTypes = /* @__PURE__ */ new Set(["checkbox", "radio", "range", "color", "file", "image", "button", "submit", "reset"]);
function isKeyboardFocusEvent(isTextInput, modality, e) {
  const target = e ? getEventTarget(e) : null;
  const win = getWindow$1(target);
  isTextInput = isTextInput || target instanceof win.HTMLInputElement && !nonTextInputTypes.has(target?.type) || target instanceof win.HTMLTextAreaElement || target instanceof win.HTMLElement && target.isContentEditable;
  return !(isTextInput && modality === "keyboard" && e instanceof win.KeyboardEvent && !Reflect.has(FOCUS_VISIBLE_INPUT_KEYS, e.key));
}
var currentModality = null;
var changeHandlers = /* @__PURE__ */ new Set();
var listenerMap = /* @__PURE__ */ new Map();
var hasEventBeforeFocus = false;
var hasBlurredWindowRecently = false;
var FOCUS_VISIBLE_INPUT_KEYS = {
  Tab: true,
  Escape: true
};
function triggerChangeHandlers(modality, e) {
  for (let handler of changeHandlers) {
    handler(modality, e);
  }
}
function handleKeyboardEvent(e) {
  hasEventBeforeFocus = true;
  if (isValidKey(e)) {
    currentModality = "keyboard";
    triggerChangeHandlers("keyboard", e);
  }
}
function handlePointerEvent(e) {
  currentModality = "pointer";
  if (e.type === "mousedown" || e.type === "pointerdown") {
    hasEventBeforeFocus = true;
    triggerChangeHandlers("pointer", e);
  }
}
function handleClickEvent(e) {
  if (isVirtualClick(e)) {
    hasEventBeforeFocus = true;
    currentModality = "virtual";
  }
}
function handleFocusEvent(e) {
  const target = getEventTarget(e);
  if (target === getWindow$1(target) || target === getDocument(target)) {
    return;
  }
  if (!hasEventBeforeFocus && !hasBlurredWindowRecently) {
    currentModality = "virtual";
    triggerChangeHandlers("virtual", e);
  }
  hasEventBeforeFocus = false;
  hasBlurredWindowRecently = false;
}
function handleWindowBlur() {
  hasEventBeforeFocus = false;
  hasBlurredWindowRecently = true;
}
function setupGlobalFocusEvents(root) {
  if (typeof window === "undefined" || listenerMap.get(getWindow$1(root))) {
    return;
  }
  const win = getWindow$1(root);
  const doc = getDocument(root);
  let focus = win.HTMLElement.prototype.focus;
  win.HTMLElement.prototype.focus = function() {
    currentModality = "virtual";
    triggerChangeHandlers("virtual", null);
    hasEventBeforeFocus = true;
    focus.apply(this, arguments);
  };
  doc.addEventListener("keydown", handleKeyboardEvent, true);
  doc.addEventListener("keyup", handleKeyboardEvent, true);
  doc.addEventListener("click", handleClickEvent, true);
  win.addEventListener("focus", handleFocusEvent, true);
  win.addEventListener("blur", handleWindowBlur, false);
  if (typeof win.PointerEvent !== "undefined") {
    doc.addEventListener("pointerdown", handlePointerEvent, true);
    doc.addEventListener("pointermove", handlePointerEvent, true);
    doc.addEventListener("pointerup", handlePointerEvent, true);
  } else {
    doc.addEventListener("mousedown", handlePointerEvent, true);
    doc.addEventListener("mousemove", handlePointerEvent, true);
    doc.addEventListener("mouseup", handlePointerEvent, true);
  }
  win.addEventListener(
    "beforeunload",
    () => {
      tearDownWindowFocusTracking(root);
    },
    { once: true }
  );
  listenerMap.set(win, { focus });
}
var tearDownWindowFocusTracking = (root, loadListener) => {
  const win = getWindow$1(root);
  const doc = getDocument(root);
  if (!listenerMap.has(win)) {
    return;
  }
  win.HTMLElement.prototype.focus = listenerMap.get(win).focus;
  doc.removeEventListener("keydown", handleKeyboardEvent, true);
  doc.removeEventListener("keyup", handleKeyboardEvent, true);
  doc.removeEventListener("click", handleClickEvent, true);
  win.removeEventListener("focus", handleFocusEvent, true);
  win.removeEventListener("blur", handleWindowBlur, false);
  if (typeof win.PointerEvent !== "undefined") {
    doc.removeEventListener("pointerdown", handlePointerEvent, true);
    doc.removeEventListener("pointermove", handlePointerEvent, true);
    doc.removeEventListener("pointerup", handlePointerEvent, true);
  } else {
    doc.removeEventListener("mousedown", handlePointerEvent, true);
    doc.removeEventListener("mousemove", handlePointerEvent, true);
    doc.removeEventListener("mouseup", handlePointerEvent, true);
  }
  listenerMap.delete(win);
};
function isFocusVisible() {
  return currentModality === "keyboard";
}
function trackFocusVisible(props = {}) {
  const { isTextInput, autoFocus, onChange, root } = props;
  setupGlobalFocusEvents(root);
  onChange?.({ isFocusVisible: autoFocus || isFocusVisible(), modality: currentModality });
  const handler = (modality, e) => {
    if (!isKeyboardFocusEvent(!!isTextInput, modality, e)) return;
    onChange?.({ isFocusVisible: isFocusVisible(), modality });
  };
  changeHandlers.add(handler);
  return () => {
    changeHandlers.delete(handler);
  };
}
var rafId;
var observedElements = /* @__PURE__ */ new Map();
var getRectFn = (el) => el.getBoundingClientRect();
function trackElementRect(el, options) {
  const { scope = "rect", getRect = getRectFn, onChange } = options;
  const loop = getLoopFn({ scope, getRect });
  const data = observedElements.get(el);
  if (!data) {
    observedElements.set(el, {
      rect: {},
      callbacks: [onChange]
    });
    if (observedElements.size === 1) {
      rafId = requestAnimationFrame(loop);
    }
  } else {
    data.callbacks.push(onChange);
    onChange(getRect(el));
  }
  return function unobserve() {
    const data2 = observedElements.get(el);
    if (!data2) return;
    const index = data2.callbacks.indexOf(onChange);
    if (index > -1) {
      data2.callbacks.splice(index, 1);
    }
    if (data2.callbacks.length === 0) {
      observedElements.delete(el);
      if (observedElements.size === 0) {
        cancelAnimationFrame(rafId);
      }
    }
  };
}
function getLoopFn(options) {
  const { scope, getRect } = options;
  const isEqual2 = getEqualityFn(scope);
  return function loop() {
    const changedRectsData = [];
    observedElements.forEach((data, element2) => {
      const newRect = getRect(element2);
      if (!isEqual2(data.rect, newRect)) {
        data.rect = newRect;
        changedRectsData.push(data);
      }
    });
    changedRectsData.forEach((data) => {
      data.callbacks.forEach((callback) => callback(data.rect));
    });
    rafId = requestAnimationFrame(loop);
  };
}
var isEqualSize = (a, b) => a.width === b.width && a.height === b.height;
var isEqualPosition = (a, b) => a.top === b.top && a.left === b.left;
var isEqualRect = (a, b) => isEqualSize(a, b) && isEqualPosition(a, b);
function getEqualityFn(scope) {
  if (scope === "size") return isEqualSize;
  if (scope === "position") return isEqualPosition;
  return isEqualRect;
}
var getWindow = (el) => el.ownerDocument.defaultView || window;
function getDescriptor(el, options) {
  const { type = "HTMLInputElement", property = "value" } = options;
  const proto = getWindow(el)[type].prototype;
  return Object.getOwnPropertyDescriptor(proto, property) ?? {};
}
function setElementChecked(el, checked) {
  const descriptor = getDescriptor(el, { type: "HTMLInputElement", property: "checked" });
  descriptor.set?.call(el, checked);
  if (checked) el.setAttribute("checked", "");
  else el.removeAttribute("checked");
}
function dispatchInputCheckedEvent(el, options) {
  const { checked, bubbles = true } = options;
  if (!el) return;
  const win = getWindow(el);
  if (!(el instanceof win.HTMLInputElement)) return;
  setElementChecked(el, checked);
  el.dispatchEvent(new win.Event("click", { bubbles }));
}
function getClosestForm(el) {
  if (isFormElement(el)) return el.form;
  else return el.closest("form");
}
function isFormElement(el) {
  return el.matches("textarea, input, select, button");
}
function trackFormReset(el, callback) {
  if (!el) return;
  const form = getClosestForm(el);
  form?.addEventListener("reset", callback, { passive: true });
  return () => {
    form?.removeEventListener("reset", callback);
  };
}
function trackFieldsetDisabled(el, callback) {
  const fieldset = el?.closest("fieldset");
  if (!fieldset) return;
  callback(fieldset.disabled);
  const win = fieldset.ownerDocument.defaultView || window;
  const obs = new win.MutationObserver(() => callback(fieldset.disabled));
  obs.observe(fieldset, {
    attributes: true,
    attributeFilter: ["disabled"]
  });
  return () => obs.disconnect();
}
function trackFormControl(el, options) {
  if (!el) return;
  const { onFieldsetDisabledChange, onFormReset } = options;
  const cleanups2 = [trackFormReset(el, onFormReset), trackFieldsetDisabled(el, onFieldsetDisabledChange)];
  return () => {
    cleanups2.forEach((cleanup) => cleanup?.());
  };
}
var anatomy$1 = createAnatomy("radio-group").parts(
  "root",
  "label",
  "item",
  "itemText",
  "itemControl",
  "indicator"
);
var parts$1 = anatomy$1.build();
var dom$1 = createScope({
  getRootId: (ctx) => ctx.ids?.root ?? `radio-group:${ctx.id}`,
  getLabelId: (ctx) => ctx.ids?.label ?? `radio-group:${ctx.id}:label`,
  getItemId: (ctx, value) => ctx.ids?.item?.(value) ?? `radio-group:${ctx.id}:radio:${value}`,
  getItemHiddenInputId: (ctx, value) => ctx.ids?.itemHiddenInput?.(value) ?? `radio-group:${ctx.id}:radio:input:${value}`,
  getItemControlId: (ctx, value) => ctx.ids?.itemControl?.(value) ?? `radio-group:${ctx.id}:radio:control:${value}`,
  getItemLabelId: (ctx, value) => ctx.ids?.itemLabel?.(value) ?? `radio-group:${ctx.id}:radio:label:${value}`,
  getIndicatorId: (ctx) => ctx.ids?.indicator ?? `radio-group:${ctx.id}:indicator`,
  getRootEl: (ctx) => dom$1.getById(ctx, dom$1.getRootId(ctx)),
  getItemHiddenInputEl: (ctx, value) => dom$1.getById(ctx, dom$1.getItemHiddenInputId(ctx, value)),
  getIndicatorEl: (ctx) => dom$1.getById(ctx, dom$1.getIndicatorId(ctx)),
  getFirstEnabledInputEl: (ctx) => dom$1.getRootEl(ctx)?.querySelector("input:not(:disabled)"),
  getFirstEnabledAndCheckedInputEl: (ctx) => dom$1.getRootEl(ctx)?.querySelector("input:not(:disabled):checked"),
  getInputEls: (ctx) => {
    const ownerId = CSS.escape(dom$1.getRootId(ctx));
    const selector = `input[type=radio][data-ownedby='${ownerId}']:not([disabled])`;
    return queryAll(dom$1.getRootEl(ctx), selector);
  },
  getActiveRadioEl: (ctx) => {
    if (!ctx.value) return;
    return dom$1.getById(ctx, dom$1.getItemId(ctx, ctx.value));
  },
  getOffsetRect: (el) => ({
    left: el?.offsetLeft ?? 0,
    top: el?.offsetTop ?? 0,
    width: el?.offsetWidth ?? 0,
    height: el?.offsetHeight ?? 0
  }),
  getRectById: (ctx, id) => {
    const radioEl = dom$1.getById(ctx, dom$1.getItemId(ctx, id));
    if (!radioEl) return;
    return dom$1.resolveRect(dom$1.getOffsetRect(radioEl));
  },
  resolveRect: (rect) => ({
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    left: `${rect.left}px`,
    top: `${rect.top}px`
  })
});
function connect$1(state, send, normalize) {
  const groupDisabled = state.context.isDisabled;
  const readOnly = state.context.readOnly;
  function getItemState(props2) {
    return {
      invalid: !!props2.invalid,
      disabled: !!props2.disabled || groupDisabled,
      checked: state.context.value === props2.value,
      focused: state.context.focusedValue === props2.value,
      hovered: state.context.hoveredValue === props2.value,
      active: state.context.activeValue === props2.value
    };
  }
  function getItemDataAttrs(props2) {
    const radioState = getItemState(props2);
    return {
      "data-focus": dataAttr(radioState.focused),
      "data-focus-visible": dataAttr(radioState.focused && state.context.focusVisible),
      "data-disabled": dataAttr(radioState.disabled),
      "data-readonly": dataAttr(readOnly),
      "data-state": radioState.checked ? "checked" : "unchecked",
      "data-hover": dataAttr(radioState.hovered),
      "data-invalid": dataAttr(radioState.invalid),
      "data-orientation": state.context.orientation,
      "data-ssr": dataAttr(state.context.ssr)
    };
  }
  const focus = () => {
    const firstEnabledAndCheckedInput = dom$1.getFirstEnabledAndCheckedInputEl(state.context);
    if (firstEnabledAndCheckedInput) {
      firstEnabledAndCheckedInput.focus();
      return;
    }
    const firstEnabledInput = dom$1.getFirstEnabledInputEl(state.context);
    firstEnabledInput?.focus();
  };
  return {
    focus,
    value: state.context.value,
    setValue(value) {
      send({ type: "SET_VALUE", value, isTrusted: false });
    },
    clearValue() {
      send({ type: "SET_VALUE", value: null, isTrusted: false });
    },
    getRootProps() {
      return normalize.element({
        ...parts$1.root.attrs,
        role: "radiogroup",
        id: dom$1.getRootId(state.context),
        "aria-labelledby": dom$1.getLabelId(state.context),
        "data-orientation": state.context.orientation,
        "data-disabled": dataAttr(groupDisabled),
        "aria-orientation": state.context.orientation,
        dir: state.context.dir,
        style: {
          position: "relative"
        }
      });
    },
    getLabelProps() {
      return normalize.element({
        ...parts$1.label.attrs,
        dir: state.context.dir,
        "data-orientation": state.context.orientation,
        "data-disabled": dataAttr(groupDisabled),
        id: dom$1.getLabelId(state.context),
        onClick: focus
      });
    },
    getItemState,
    getItemProps(props2) {
      const itemState = getItemState(props2);
      return normalize.label({
        ...parts$1.item.attrs,
        dir: state.context.dir,
        id: dom$1.getItemId(state.context, props2.value),
        htmlFor: dom$1.getItemHiddenInputId(state.context, props2.value),
        ...getItemDataAttrs(props2),
        onPointerMove() {
          if (itemState.disabled) return;
          if (itemState.hovered) return;
          send({ type: "SET_HOVERED", value: props2.value, hovered: true });
        },
        onPointerLeave() {
          if (itemState.disabled) return;
          send({ type: "SET_HOVERED", value: null });
        },
        onPointerDown(event) {
          if (itemState.disabled) return;
          if (itemState.focused && event.pointerType === "mouse") {
            event.preventDefault();
          }
          send({ type: "SET_ACTIVE", value: props2.value, active: true });
        },
        onPointerUp() {
          if (itemState.disabled) return;
          send({ type: "SET_ACTIVE", value: null });
        }
      });
    },
    getItemTextProps(props2) {
      return normalize.element({
        ...parts$1.itemText.attrs,
        dir: state.context.dir,
        id: dom$1.getItemLabelId(state.context, props2.value),
        ...getItemDataAttrs(props2)
      });
    },
    getItemControlProps(props2) {
      const controlState = getItemState(props2);
      return normalize.element({
        ...parts$1.itemControl.attrs,
        dir: state.context.dir,
        id: dom$1.getItemControlId(state.context, props2.value),
        "data-active": dataAttr(controlState.active),
        "aria-hidden": true,
        ...getItemDataAttrs(props2)
      });
    },
    getItemHiddenInputProps(props2) {
      const inputState = getItemState(props2);
      return normalize.input({
        "data-ownedby": dom$1.getRootId(state.context),
        id: dom$1.getItemHiddenInputId(state.context, props2.value),
        type: "radio",
        name: state.context.name || state.context.id,
        form: state.context.form,
        value: props2.value,
        onClick(event) {
          if (readOnly) {
            event.preventDefault();
            return;
          }
          if (event.currentTarget.checked) {
            send({ type: "SET_VALUE", value: props2.value, isTrusted: true });
          }
        },
        onBlur() {
          send({ type: "SET_FOCUSED", value: null, focused: false, focusVisible: false });
        },
        onFocus() {
          const focusVisible = isFocusVisible();
          send({ type: "SET_FOCUSED", value: props2.value, focused: true, focusVisible });
        },
        onKeyDown(event) {
          if (event.defaultPrevented) return;
          if (event.key === " ") {
            send({ type: "SET_ACTIVE", value: props2.value, active: true });
          }
        },
        onKeyUp(event) {
          if (event.defaultPrevented) return;
          if (event.key === " ") {
            send({ type: "SET_ACTIVE", value: null });
          }
        },
        disabled: inputState.disabled,
        defaultChecked: inputState.checked,
        style: visuallyHiddenStyle
      });
    },
    getIndicatorProps() {
      return normalize.element({
        id: dom$1.getIndicatorId(state.context),
        ...parts$1.indicator.attrs,
        dir: state.context.dir,
        hidden: state.context.value == null,
        "data-disabled": dataAttr(groupDisabled),
        "data-orientation": state.context.orientation,
        style: {
          "--transition-property": "left, top, width, height",
          "--left": state.context.indicatorRect?.left,
          "--top": state.context.indicatorRect?.top,
          "--width": state.context.indicatorRect?.width,
          "--height": state.context.indicatorRect?.height,
          position: "absolute",
          willChange: "var(--transition-property)",
          transitionProperty: "var(--transition-property)",
          transitionDuration: state.context.canIndicatorTransition ? "var(--transition-duration, 150ms)" : "0ms",
          transitionTimingFunction: "var(--transition-timing-function)",
          [state.context.orientation === "horizontal" ? "left" : "top"]: state.context.orientation === "horizontal" ? "var(--left)" : "var(--top)"
        }
      });
    }
  };
}
var { not: not$1 } = guards;
function machine$1(userContext) {
  const ctx = compact(userContext);
  return createMachine(
    {
      id: "radio",
      initial: "idle",
      context: {
        value: null,
        activeValue: null,
        focusedValue: null,
        hoveredValue: null,
        disabled: false,
        orientation: "vertical",
        ...ctx,
        indicatorRect: {},
        canIndicatorTransition: false,
        fieldsetDisabled: false,
        focusVisible: false,
        ssr: true
      },
      computed: {
        isDisabled: (ctx2) => !!ctx2.disabled || ctx2.fieldsetDisabled
      },
      entry: ["syncIndicatorRect", "syncSsr"],
      exit: ["cleanupObserver"],
      activities: ["trackFormControlState", "trackFocusVisible"],
      watch: {
        value: ["setIndicatorTransition", "syncIndicatorRect", "syncInputElements"]
      },
      on: {
        SET_VALUE: [
          {
            guard: not$1("isTrusted"),
            actions: ["setValue", "dispatchChangeEvent"]
          },
          {
            actions: ["setValue"]
          }
        ],
        SET_HOVERED: {
          actions: "setHovered"
        },
        SET_ACTIVE: {
          actions: "setActive"
        },
        SET_FOCUSED: {
          actions: "setFocused"
        }
      },
      states: {
        idle: {}
      }
    },
    {
      guards: {
        isTrusted: (_ctx, evt) => !!evt.isTrusted
      },
      activities: {
        trackFormControlState(ctx2, _evt, { send, initialContext }) {
          return trackFormControl(dom$1.getRootEl(ctx2), {
            onFieldsetDisabledChange(disabled) {
              ctx2.fieldsetDisabled = disabled;
            },
            onFormReset() {
              send({ type: "SET_VALUE", value: initialContext.value });
            }
          });
        },
        trackFocusVisible(ctx2) {
          return trackFocusVisible({ root: dom$1.getRootNode(ctx2) });
        }
      },
      actions: {
        setValue(ctx2, evt) {
          set$1.value(ctx2, evt.value);
        },
        setHovered(ctx2, evt) {
          ctx2.hoveredValue = evt.value;
        },
        setActive(ctx2, evt) {
          ctx2.activeValue = evt.value;
        },
        setFocused(ctx2, evt) {
          ctx2.focusedValue = evt.value;
          ctx2.focusVisible = evt.focusVisible;
        },
        syncInputElements(ctx2) {
          const inputs = dom$1.getInputEls(ctx2);
          inputs.forEach((input) => {
            input.checked = input.value === ctx2.value;
          });
        },
        setIndicatorTransition(ctx2) {
          ctx2.canIndicatorTransition = isString(ctx2.value);
        },
        cleanupObserver(ctx2) {
          ctx2.indicatorCleanup?.();
        },
        syncSsr(ctx2) {
          ctx2.ssr = false;
        },
        syncIndicatorRect(ctx2) {
          ctx2.indicatorCleanup?.();
          if (!dom$1.getIndicatorEl(ctx2)) return;
          const value = ctx2.value;
          const radioEl = dom$1.getActiveRadioEl(ctx2);
          if (value == null || !radioEl) {
            ctx2.indicatorRect = {};
            return;
          }
          ctx2.indicatorCleanup = trackElementRect(radioEl, {
            getRect(el) {
              return dom$1.getOffsetRect(el);
            },
            onChange(rect) {
              ctx2.indicatorRect = dom$1.resolveRect(rect);
              nextTick(() => {
                ctx2.canIndicatorTransition = false;
              });
            }
          });
        },
        dispatchChangeEvent(ctx2) {
          const inputEls = dom$1.getInputEls(ctx2);
          inputEls.forEach((inputEl) => {
            const checked = inputEl.value === ctx2.value;
            if (checked === inputEl.checked) return;
            dispatchInputCheckedEvent(inputEl, { checked });
          });
        }
      }
    }
  );
}
var invoke$1 = {
  change: (ctx) => {
    if (ctx.value == null) return;
    ctx.onValueChange?.({ value: ctx.value });
  }
};
var set$1 = {
  value: (ctx, value) => {
    if (isEqual(ctx.value, value)) return;
    ctx.value = value;
    invoke$1.change(ctx);
  }
};
createProps()([
  "dir",
  "disabled",
  "form",
  "getRootNode",
  "id",
  "ids",
  "name",
  "onValueChange",
  "orientation",
  "readOnly",
  "value"
]);
createProps()(["value", "disabled", "invalid"]);
const [setSegmentContext, getSegmentContext, key$1] = createContext({
  api: {},
  indicatorText: ""
});
function Segment($$payload, $$props) {
  push();
  let {
    value = "",
    orientation = "horizontal",
    // Root
    base = "inline-flex items-stretch overflow-hidden",
    background = "preset-outlined-surface-200-800",
    border = "p-2",
    gap = "gap-2",
    padding = "",
    rounded = "rounded-container",
    width = "",
    classes = "",
    // States
    orientVertical = "flex-col",
    orientHorizontal = "flex-row",
    stateDisabled = "disabled",
    stateReadOnly = "pointer-events-none",
    // Indicator
    indicatorBase = "top-[var(--top)] left-[var(--left)] w-[var(--width)] h-[var(--height)]",
    indicatorBg = "preset-filled",
    indicatorText = "text-surface-contrast-950 dark:text-surface-contrast-50",
    indicatorRounded = "rounded",
    indicatorClasses = "",
    // Label
    labelledby = "",
    // Snippets
    children,
    $$slots,
    $$events,
    // Zag
    ...zagProps
  } = $$props;
  const [snapshot2, send] = useMachine(
    machine$1({
      id: useId(),
      onValueChange(details) {
        value = details.value;
      },
      orientation
    }),
    {
      context: {
        ...zagProps,
        get value() {
          return value;
        }
      }
    }
  );
  const api = connect$1(snapshot2, send, normalizeProps);
  setSegmentContext({
    get api() {
      return api;
    },
    get indicatorText() {
      return indicatorText;
    }
  });
  const rxOrientation = snapshot2.context.orientation === "vertical" ? orientVertical : orientHorizontal;
  const rxDisabled = snapshot2.context.disabled ? stateDisabled : "";
  const rxReadOnly = snapshot2.context.readOnly ? stateReadOnly : "";
  $$payload.out += `<div${spread_attributes({
    ...api.getRootProps(),
    class: `${stringify(base)} ${stringify(rxOrientation)} ${stringify(background)} ${stringify(border)} ${stringify(padding)} ${stringify(gap)} ${stringify(rounded)} ${stringify(width)} ${stringify(rxDisabled)} ${stringify(rxReadOnly)} ${stringify(classes)}`,
    "aria-labelledby": labelledby,
    "data-testid": "segment"
  })}><div${spread_attributes({
    ...api.getIndicatorProps(),
    class: `${stringify(indicatorBase)} ${stringify(indicatorBg)} ${stringify(indicatorRounded)} ${stringify(indicatorClasses)}`,
    "data-testid": "segment-indicator"
  })}></div> `;
  children?.($$payload);
  $$payload.out += `<!----></div>`;
  bind_props($$props, { value });
  pop();
}
function SegmentItem($$payload, $$props) {
  push();
  let {
    // Root
    base = "btn cursor-pointer z-[1]",
    classes = "",
    // State
    stateDisabled = "disabled",
    stateFocused = "focused",
    // Label
    labelBase = "pointer-events-none transition-colors duration-100",
    labelClasses = "",
    // Snippets
    children,
    $$slots,
    $$events,
    // Zag
    ...zagProps
  } = $$props;
  const ctx = getSegmentContext();
  const state = ctx.api.getItemState(zagProps);
  const rxDisabled = state.disabled ? stateDisabled : "";
  const rxActiveText = state.checked ? ctx.indicatorText : "";
  const rxFocused = state.focused ? stateFocused : "";
  $$payload.out += `<label${spread_attributes({
    ...ctx.api.getItemProps(zagProps),
    class: `${stringify(base)} ${stringify(rxDisabled)} ${stringify(rxFocused)} ${stringify(classes)}`,
    "data-testid": "segment-item"
  })}><span${spread_attributes({
    ...ctx.api.getItemTextProps(zagProps),
    class: `${stringify(labelBase)} ${stringify(rxActiveText)} ${stringify(labelClasses)}`,
    "data-testid": "segment-item-label"
  })}>`;
  children?.($$payload);
  $$payload.out += `<!----></span> <input${spread_attributes({
    ...ctx.api.getItemHiddenInputProps(zagProps),
    "data-testid": "segment-item-input"
  })}></label>`;
  pop();
}
Object.assign(Segment, { Item: SegmentItem });
var anatomy = createAnatomy("tabs").parts("root", "list", "trigger", "content", "indicator");
var parts = anatomy.build();
var dom = createScope({
  getRootId: (ctx) => ctx.ids?.root ?? `tabs:${ctx.id}`,
  getListId: (ctx) => ctx.ids?.list ?? `tabs:${ctx.id}:list`,
  getContentId: (ctx, id) => ctx.ids?.content ?? `tabs:${ctx.id}:content-${id}`,
  getTriggerId: (ctx, id) => ctx.ids?.trigger ?? `tabs:${ctx.id}:trigger-${id}`,
  getIndicatorId: (ctx) => ctx.ids?.indicator ?? `tabs:${ctx.id}:indicator`,
  getListEl: (ctx) => dom.getById(ctx, dom.getListId(ctx)),
  getContentEl: (ctx, id) => dom.getById(ctx, dom.getContentId(ctx, id)),
  getTriggerEl: (ctx, id) => dom.getById(ctx, dom.getTriggerId(ctx, id)),
  getIndicatorEl: (ctx) => dom.getById(ctx, dom.getIndicatorId(ctx)),
  getElements: (ctx) => {
    const ownerId = CSS.escape(dom.getListId(ctx));
    const selector = `[role=tab][data-ownedby='${ownerId}']:not([disabled])`;
    return queryAll(dom.getListEl(ctx), selector);
  },
  getFirstTriggerEl: (ctx) => first(dom.getElements(ctx)),
  getLastTriggerEl: (ctx) => last(dom.getElements(ctx)),
  getNextTriggerEl: (ctx, id) => nextById(dom.getElements(ctx), dom.getTriggerId(ctx, id), ctx.loopFocus),
  getPrevTriggerEl: (ctx, id) => prevById(dom.getElements(ctx), dom.getTriggerId(ctx, id), ctx.loopFocus),
  getSelectedContentEl: (ctx) => {
    if (!ctx.value) return;
    return dom.getContentEl(ctx, ctx.value);
  },
  getSelectedTriggerEl: (ctx) => {
    if (!ctx.value) return;
    return dom.getTriggerEl(ctx, ctx.value);
  },
  getOffsetRect: (el) => {
    return {
      left: el?.offsetLeft ?? 0,
      top: el?.offsetTop ?? 0,
      width: el?.offsetWidth ?? 0,
      height: el?.offsetHeight ?? 0
    };
  },
  getRectById: (ctx, id) => {
    const tab = itemById(dom.getElements(ctx), dom.getTriggerId(ctx, id));
    return dom.resolveRect(dom.getOffsetRect(tab));
  },
  resolveRect: (rect) => ({
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    left: `${rect.left}px`,
    top: `${rect.top}px`
  })
});
function connect(state, send, normalize) {
  const translations = state.context.translations;
  const focused = state.matches("focused");
  const isVertical = state.context.orientation === "vertical";
  const isHorizontal = state.context.orientation === "horizontal";
  const composite = state.context.composite;
  const indicator = state.context.indicatorState;
  function getTriggerState(props2) {
    return {
      selected: state.context.value === props2.value,
      focused: state.context.focusedValue === props2.value,
      disabled: !!props2.disabled
    };
  }
  return {
    value: state.context.value,
    focusedValue: state.context.focusedValue,
    setValue(value) {
      send({ type: "SET_VALUE", value });
    },
    clearValue() {
      send({ type: "CLEAR_VALUE" });
    },
    setIndicatorRect(value) {
      const id = dom.getTriggerId(state.context, value);
      send({ type: "SET_INDICATOR_RECT", id });
    },
    syncTabIndex() {
      send("SYNC_TAB_INDEX");
    },
    selectNext(fromValue) {
      send({ type: "TAB_FOCUS", value: fromValue, src: "selectNext" });
      send({ type: "ARROW_NEXT", src: "selectNext" });
    },
    selectPrev(fromValue) {
      send({ type: "TAB_FOCUS", value: fromValue, src: "selectPrev" });
      send({ type: "ARROW_PREV", src: "selectPrev" });
    },
    focus() {
      dom.getSelectedTriggerEl(state.context)?.focus();
    },
    getRootProps() {
      return normalize.element({
        ...parts.root.attrs,
        id: dom.getRootId(state.context),
        "data-orientation": state.context.orientation,
        "data-focus": dataAttr(focused),
        dir: state.context.dir
      });
    },
    getListProps() {
      return normalize.element({
        ...parts.list.attrs,
        id: dom.getListId(state.context),
        role: "tablist",
        dir: state.context.dir,
        "data-focus": dataAttr(focused),
        "aria-orientation": state.context.orientation,
        "data-orientation": state.context.orientation,
        "aria-label": translations?.listLabel,
        onKeyDown(event) {
          if (event.defaultPrevented) return;
          if (!isSelfTarget(event)) return;
          if (isComposingEvent(event)) return;
          const keyMap2 = {
            ArrowDown() {
              if (isHorizontal) return;
              send({ type: "ARROW_NEXT", key: "ArrowDown" });
            },
            ArrowUp() {
              if (isHorizontal) return;
              send({ type: "ARROW_PREV", key: "ArrowUp" });
            },
            ArrowLeft() {
              if (isVertical) return;
              send({ type: "ARROW_PREV", key: "ArrowLeft" });
            },
            ArrowRight() {
              if (isVertical) return;
              send({ type: "ARROW_NEXT", key: "ArrowRight" });
            },
            Home() {
              send("HOME");
            },
            End() {
              send("END");
            },
            Enter() {
              send({ type: "ENTER" });
            }
          };
          let key2 = getEventKey(event, state.context);
          const exec2 = keyMap2[key2];
          if (exec2) {
            event.preventDefault();
            exec2(event);
          }
        }
      });
    },
    getTriggerState,
    getTriggerProps(props2) {
      const { value, disabled } = props2;
      const triggerState = getTriggerState(props2);
      return normalize.button({
        ...parts.trigger.attrs,
        role: "tab",
        type: "button",
        disabled,
        dir: state.context.dir,
        "data-orientation": state.context.orientation,
        "data-disabled": dataAttr(disabled),
        "aria-disabled": disabled,
        "data-value": value,
        "aria-selected": triggerState.selected,
        "data-selected": dataAttr(triggerState.selected),
        "data-focus": dataAttr(triggerState.focused),
        "aria-controls": triggerState.selected ? dom.getContentId(state.context, value) : void 0,
        "data-ownedby": dom.getListId(state.context),
        "data-ssr": dataAttr(state.context.ssr),
        id: dom.getTriggerId(state.context, value),
        tabIndex: triggerState.selected && composite ? 0 : -1,
        onFocus() {
          send({ type: "TAB_FOCUS", value });
        },
        onBlur(event) {
          const target = event.relatedTarget;
          if (target?.getAttribute("role") !== "tab") {
            send({ type: "TAB_BLUR" });
          }
        },
        onClick(event) {
          if (event.defaultPrevented) return;
          if (disabled) return;
          if (isSafari()) {
            event.currentTarget.focus();
          }
          send({ type: "TAB_CLICK", value });
        }
      });
    },
    getContentProps(props2) {
      const { value } = props2;
      const selected = state.context.value === value;
      return normalize.element({
        ...parts.content.attrs,
        dir: state.context.dir,
        id: dom.getContentId(state.context, value),
        tabIndex: composite ? 0 : -1,
        "aria-labelledby": dom.getTriggerId(state.context, value),
        role: "tabpanel",
        "data-ownedby": dom.getListId(state.context),
        "data-selected": dataAttr(selected),
        "data-orientation": state.context.orientation,
        hidden: !selected
      });
    },
    getIndicatorProps() {
      return normalize.element({
        id: dom.getIndicatorId(state.context),
        ...parts.indicator.attrs,
        dir: state.context.dir,
        "data-orientation": state.context.orientation,
        style: {
          "--transition-property": "left, right, top, bottom, width, height",
          "--left": indicator.rect?.left,
          "--top": indicator.rect?.top,
          "--width": indicator.rect?.width,
          "--height": indicator.rect?.height,
          position: "absolute",
          willChange: "var(--transition-property)",
          transitionProperty: "var(--transition-property)",
          transitionDuration: indicator.transition ? "var(--transition-duration, 150ms)" : "0ms",
          transitionTimingFunction: "var(--transition-timing-function)",
          [isHorizontal ? "left" : "top"]: isHorizontal ? "var(--left)" : "var(--top)"
        }
      });
    }
  };
}
var { not } = guards;
function machine(userContext) {
  const ctx = compact(userContext);
  return createMachine(
    {
      initial: "idle",
      context: {
        dir: "ltr",
        orientation: "horizontal",
        activationMode: "automatic",
        value: null,
        loopFocus: true,
        composite: true,
        ...ctx,
        focusedValue: ctx.value ?? null,
        ssr: true,
        indicatorState: {
          rendered: false,
          transition: false,
          rect: { left: "0px", top: "0px", width: "0px", height: "0px" }
        }
      },
      watch: {
        value: ["allowIndicatorTransition", "syncIndicatorRect", "syncTabIndex", "clickIfLink"],
        dir: ["syncIndicatorRect"],
        orientation: ["syncIndicatorRect"]
      },
      on: {
        SET_VALUE: {
          actions: "setValue"
        },
        CLEAR_VALUE: {
          actions: "clearValue"
        },
        SET_INDICATOR_RECT: {
          actions: "setIndicatorRect"
        },
        SYNC_TAB_INDEX: {
          actions: "syncTabIndex"
        }
      },
      created: ["syncFocusedValue"],
      entry: ["checkRenderedElements", "syncIndicatorRect", "syncTabIndex", "syncSsr"],
      exit: ["cleanupObserver"],
      states: {
        idle: {
          on: {
            TAB_FOCUS: {
              target: "focused",
              actions: "setFocusedValue"
            },
            TAB_CLICK: {
              target: "focused",
              actions: ["setFocusedValue", "setValue"]
            }
          }
        },
        focused: {
          on: {
            TAB_CLICK: {
              target: "focused",
              actions: ["setFocusedValue", "setValue"]
            },
            ARROW_PREV: [
              {
                guard: "selectOnFocus",
                actions: ["focusPrevTab", "selectFocusedTab"]
              },
              {
                actions: "focusPrevTab"
              }
            ],
            ARROW_NEXT: [
              {
                guard: "selectOnFocus",
                actions: ["focusNextTab", "selectFocusedTab"]
              },
              {
                actions: "focusNextTab"
              }
            ],
            HOME: [
              {
                guard: "selectOnFocus",
                actions: ["focusFirstTab", "selectFocusedTab"]
              },
              {
                actions: "focusFirstTab"
              }
            ],
            END: [
              {
                guard: "selectOnFocus",
                actions: ["focusLastTab", "selectFocusedTab"]
              },
              {
                actions: "focusLastTab"
              }
            ],
            ENTER: {
              guard: not("selectOnFocus"),
              actions: "selectFocusedTab"
            },
            TAB_FOCUS: {
              actions: ["setFocusedValue"]
            },
            TAB_BLUR: {
              target: "idle",
              actions: "clearFocusedValue"
            }
          }
        }
      }
    },
    {
      guards: {
        selectOnFocus: (ctx2) => ctx2.activationMode === "automatic"
      },
      actions: {
        syncFocusedValue(ctx2) {
          if (ctx2.value != null && ctx2.focusedValue == null) {
            ctx2.focusedValue = ctx2.value;
          }
        },
        selectFocusedTab(ctx2) {
          raf(() => {
            const nullable = ctx2.deselectable && ctx2.value === ctx2.focusedValue;
            const value = nullable ? null : ctx2.focusedValue;
            set.value(ctx2, value);
          });
        },
        setFocusedValue(ctx2, evt) {
          if (evt.value == null) return;
          set.focusedValue(ctx2, evt.value);
        },
        clearFocusedValue(ctx2) {
          set.focusedValue(ctx2, null);
        },
        setValue(ctx2, evt) {
          const nullable = ctx2.deselectable && ctx2.value === ctx2.focusedValue;
          const value = nullable ? null : evt.value;
          set.value(ctx2, value);
        },
        clearValue(ctx2) {
          set.value(ctx2, null);
        },
        focusFirstTab(ctx2) {
          raf(() => {
            dom.getFirstTriggerEl(ctx2)?.focus();
          });
        },
        focusLastTab(ctx2) {
          raf(() => {
            dom.getLastTriggerEl(ctx2)?.focus();
          });
        },
        focusNextTab(ctx2) {
          if (!ctx2.focusedValue) return;
          const triggerEl = dom.getNextTriggerEl(ctx2, ctx2.focusedValue);
          raf(() => {
            if (ctx2.composite) {
              triggerEl?.focus();
            } else if (triggerEl?.dataset.value != null) {
              set.focusedValue(ctx2, triggerEl.dataset.value);
            }
          });
        },
        focusPrevTab(ctx2) {
          if (!ctx2.focusedValue) return;
          const triggerEl = dom.getPrevTriggerEl(ctx2, ctx2.focusedValue);
          raf(() => {
            if (ctx2.composite) {
              triggerEl?.focus();
            } else if (triggerEl?.dataset.value != null) {
              set.focusedValue(ctx2, triggerEl.dataset.value);
            }
          });
        },
        checkRenderedElements(ctx2) {
          ctx2.indicatorState.rendered = !!dom.getIndicatorEl(ctx2);
        },
        syncTabIndex(ctx2) {
          raf(() => {
            const contentEl = dom.getSelectedContentEl(ctx2);
            if (!contentEl) return;
            const focusables = getFocusables(contentEl);
            if (focusables.length > 0) {
              contentEl.removeAttribute("tabindex");
            } else {
              contentEl.setAttribute("tabindex", "0");
            }
          });
        },
        cleanupObserver(ctx2) {
          ctx2.indicatorCleanup?.();
        },
        allowIndicatorTransition(ctx2) {
          ctx2.indicatorState.transition = true;
        },
        setIndicatorRect(ctx2, evt) {
          const value = evt.id ?? ctx2.value;
          if (!ctx2.indicatorState.rendered || !value) return;
          const triggerEl = dom.getTriggerEl(ctx2, value);
          if (!triggerEl) return;
          ctx2.indicatorState.rect = dom.getRectById(ctx2, value);
          nextTick(() => {
            ctx2.indicatorState.transition = false;
          });
        },
        syncSsr(ctx2) {
          ctx2.ssr = false;
        },
        syncIndicatorRect(ctx2) {
          ctx2.indicatorCleanup?.();
          const value = ctx2.value;
          if (!ctx2.indicatorState.rendered || !value) return;
          const triggerEl = dom.getSelectedTriggerEl(ctx2);
          if (!triggerEl) return;
          ctx2.indicatorCleanup = trackElementRect(triggerEl, {
            getRect(el) {
              return dom.getOffsetRect(el);
            },
            onChange(rect) {
              ctx2.indicatorState.rect = dom.resolveRect(rect);
              nextTick(() => {
                ctx2.indicatorState.transition = false;
              });
            }
          });
        },
        clickIfLink(ctx2) {
          clickIfLink(dom.getSelectedTriggerEl(ctx2));
        }
      }
    }
  );
}
var invoke = {
  change: (ctx) => {
    if (ctx.value == null) return;
    ctx.onValueChange?.({ value: ctx.value });
  },
  focusChange: (ctx) => {
    if (ctx.focusedValue == null) return;
    ctx.onFocusChange?.({ focusedValue: ctx.focusedValue });
  }
};
var set = {
  value: (ctx, value) => {
    if (isEqual(value, ctx.value)) return;
    ctx.value = value;
    invoke.change(ctx);
  },
  focusedValue: (ctx, value) => {
    if (isEqual(value, ctx.focusedValue)) return;
    ctx.focusedValue = value;
    invoke.focusChange(ctx);
  }
};
createProps()([
  "activationMode",
  "composite",
  "dir",
  "getRootNode",
  "id",
  "ids",
  "loopFocus",
  "onFocusChange",
  "onValueChange",
  "orientation",
  "translations",
  "deselectable",
  "value"
]);
createProps()(["disabled", "value"]);
createProps()(["value"]);
const [setTabContext, getTabContext, key] = createContext({
  fluid: false,
  api: {}
});
function Tabs($$payload, $$props) {
  push();
  let {
    value = "",
    fluid = false,
    // Root
    base = "w-full",
    classes = "",
    // List
    listBase = "flex",
    listJustify = "justify-start",
    listBorder = "border-b-[1px] border-surface-200-800",
    listMargin = "mb-4",
    listGap = "gap-2",
    listClasses = "",
    // Content
    contentBase = "",
    contentClasses = "",
    // Snippets
    list,
    content,
    $$slots,
    $$events,
    // Zag
    ...zagProps
  } = $$props;
  const [snapshot2, send] = useMachine(
    machine({
      id: useId(),
      onValueChange(details) {
        value = details.value;
      }
    }),
    {
      context: {
        ...zagProps,
        get value() {
          return value;
        }
      }
    }
  );
  const api = connect(snapshot2, send, normalizeProps);
  setTabContext({
    get api() {
      return api;
    },
    get fluid() {
      return fluid;
    }
  });
  $$payload.out += `<div${spread_attributes({
    ...api.getRootProps(),
    class: `${stringify(base)} ${stringify(classes)}`,
    "data-testid": "tabs"
  })}><div${spread_attributes({
    ...api.getListProps(),
    class: `${stringify(listBase)} ${stringify(listJustify)} ${stringify(listBorder)} ${stringify(listMargin)} ${stringify(listGap)} ${stringify(listClasses)}`,
    "data-testid": "tabs-list"
  })}>`;
  list?.($$payload);
  $$payload.out += `<!----></div> <div${attr("class", `${stringify(contentBase)} ${stringify(contentClasses)}`)} data-testid="tabs-content">`;
  content?.($$payload);
  $$payload.out += `<!----></div></div>`;
  bind_props($$props, { value });
  pop();
}
function TabsControl($$payload, $$props) {
  push();
  let {
    // Root
    base = "border-b-[1px] border-transparent",
    padding = "pb-2",
    translateX = "translate-y-[1px]",
    classes = "",
    // Label
    labelBase = "btn hover:preset-tonal-primary",
    labelClasses = "",
    // State
    stateInactive = "[&:not(:hover)]:opacity-50",
    stateActive = "border-surface-950-50 opacity-100",
    stateLabelInactive = "",
    stateLabelActive = "",
    // Snippets
    lead,
    children,
    $$slots,
    $$events,
    // Zag
    ...zagProps
  } = $$props;
  const ctx = getTabContext();
  const state = ctx.api.getTriggerState(zagProps);
  const rxActive = state.selected ? stateActive : stateInactive;
  const rxLabelActive = state.selected ? stateLabelActive : stateLabelInactive;
  const commonWidth = ctx.fluid ? "100%" : "";
  const paraglide_sveltekit_translate_attribute_pass_translationFunctions = getTranslationFunctions();
  const [
    paraglide_sveltekit_translate_attribute_pass_translateAttribute,
    paraglide_sveltekit_translate_attribute_pass_handle_attributes
  ] = paraglide_sveltekit_translate_attribute_pass_translationFunctions;
  $$payload.out += `<button${spread_attributes(
    {
      ...paraglide_sveltekit_translate_attribute_pass_handle_attributes(
        {
          ...ctx.api.getTriggerProps(zagProps),
          "class": `${base} ${padding} ${translateX} ${rxActive} ${classes}`,
          "data-testid": `tabs-control`
        },
        [{ attribute_name: "formaction" }]
      )
    },
    void 0,
    { width: commonWidth }
  )}><div${add_styles({ width: commonWidth })}${attr("class", `${stringify(labelBase)} ${stringify(rxLabelActive)} ${stringify(labelClasses)}`)} data-testid="tabs-control-label">`;
  if (lead) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span>`;
    lead($$payload);
    $$payload.out += `<!----></span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <span>`;
  children?.($$payload);
  $$payload.out += `<!----></span></div></button>`;
  pop();
}
function TabsPanel($$payload, $$props) {
  push();
  let {
    // Root
    base = "",
    classes = "",
    // Children
    children,
    $$slots,
    $$events,
    // Zag
    ...zagProps
  } = $$props;
  const ctx = getTabContext();
  $$payload.out += `<div${spread_attributes({
    ...ctx.api.getContentProps(zagProps),
    class: `${stringify(base)} ${stringify(classes)}`,
    "data-testid": "tabs-panel"
  })}>`;
  children?.($$payload);
  $$payload.out += `<!----></div>`;
  pop();
}
Object.assign(Tabs, { Control: TabsControl, Panel: TabsPanel });
export {
  isSafari as A,
  dataAttr as B,
  createMachine as C,
  proxyTabFocus as D,
  getInitialFocus as E,
  createProps as F,
  useMachine as G,
  snapshot$1 as H,
  useId as I,
  normalizeProps as J,
  Avatar as K,
  getWindow$1 as a,
  addDomEvent as b,
  getEventTarget as c,
  callAll as d,
  isHTMLElement as e,
  fireCustomEvent as f,
  getDocument as g,
  contains as h,
  isFocusable as i,
  getNearestOverflowAncestor as j,
  isContextMenuEvent as k,
  isNull as l,
  mergeProps as m,
  noop as n,
  runIfFn as o,
  compact as p,
  isFunction$1 as q,
  raf as r,
  waitForElements as s,
  toStyleString as t,
  setStyle as u,
  isIos as v,
  warn as w,
  createAnatomy as x,
  createScope as y,
  getFocusables as z
};
