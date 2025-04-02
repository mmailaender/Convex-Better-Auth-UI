import "./client.js";
import { b as base } from "./paths.js";
import { L as LANG_COOKIE_NAME } from "./constants.js";
import { ad as getContext } from "./index.js";
import { k as get } from "./exports.js";
let _onSetLanguageTag;
const sourceLanguageTag = "en";
const availableLanguageTags = (
  /** @type {const} */
  ["en", "de"]
);
let languageTag = () => sourceLanguageTag;
const setLanguageTag = (tag) => {
  if (typeof tag === "function") {
    languageTag = enforceLanguageTag(tag);
  } else {
    languageTag = enforceLanguageTag(() => tag);
  }
  if (_onSetLanguageTag !== void 0) {
    _onSetLanguageTag(languageTag());
  }
};
function enforceLanguageTag(unsafeLanguageTag) {
  return () => {
    const tag = unsafeLanguageTag();
    if (!isAvailableLanguageTag(tag)) {
      throw new Error(`languageTag() didn't return a valid language tag. Check your setLanguageTag call`);
    }
    return tag;
  };
}
const onSetLanguageTag = (fn) => {
  _onSetLanguageTag = fn;
};
function isAvailableLanguageTag(thing) {
  return availableLanguageTags.includes(thing);
}
const runtime = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  availableLanguageTags,
  isAvailableLanguageTag,
  get languageTag() {
    return languageTag;
  },
  onSetLanguageTag,
  setLanguageTag,
  sourceLanguageTag
}, Symbol.toStringTag, { value: "Module" }));
const getStores = () => {
  const stores$1 = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
function normaliseBase$1(baseValue, currentUrl) {
  if (baseValue === "")
    return "";
  const absoluteBase = new URL(baseValue, currentUrl).pathname;
  return absoluteBase.endsWith("/") ? absoluteBase.slice(0, -1) : absoluteBase;
}
function parseRoute(fullPath, normalizedBase) {
  const decodedPath = safeDecode(fullPath);
  const pathWithoutBase = removeBase(decodedPath, normalizedBase);
  const [path, dataSuffix] = removeDataSuffix(pathWithoutBase);
  return [path, dataSuffix];
}
const serializeRoute = (path, normalizedBase, dataSuffix) => [normalizedBase, path, dataSuffix ?? ""].filter((s) => s !== "/").join("") || "/";
function removeBase(absolutePath, normalizedBase) {
  const withoutBase = absolutePath.replace(normalizedBase, "");
  return withoutBase.startsWith("/") ? withoutBase : `/${withoutBase}`;
}
function removeDataSuffix(absolutePath) {
  const KNOWN_SUFFIXES = ["/.html__data.json", "/__data.json"];
  const dataSuffix = KNOWN_SUFFIXES.find((suffix) => absolutePath.endsWith(suffix));
  if (dataSuffix) {
    return [absolutePath.slice(0, -dataSuffix.length) || "/", dataSuffix];
  } else {
    return [absolutePath, void 0];
  }
}
function safeDecode(maybeEncoded) {
  try {
    return decodeURI(maybeEncoded);
  } catch {
    return maybeEncoded;
  }
}
function getHrefBetween(from, to) {
  if (from.protocol !== to.protocol) {
    return to.href;
  }
  if (to.password || to.username) {
    const credentials = [to.username, to.password].filter(Boolean).join(":");
    return "//" + credentials + "@" + to.host + to.pathname + to.search + to.hash;
  }
  if (from.host !== to.host) {
    return "//" + to.host + to.pathname + to.search + to.hash;
  }
  return to.pathname + to.search + to.hash;
}
function negotiateLanguagePreferences(accept, availableLanguageTags2) {
  accept ||= "*";
  const acceptLanguageSpecs = parseAcceptLanguageHeader(accept);
  const priorities = availableLanguageTags2.map(
    (languageTag2, index) => getHighestLanguagePriority(languageTag2, acceptLanguageSpecs, index)
  );
  return priorities.filter((prio) => prio.quality > 0).sort(bySpecificity).sort(byQuality).map((priority) => priority.languageTag);
}
function parseAcceptLanguageHeader(acceptLanguage) {
  return acceptLanguage.split(",").map((dfn) => dfn.trim()).map((dfn, index) => parseLanguage(dfn, index)).filter((maybeSpec) => Boolean(maybeSpec));
}
function parseLanguage(languageTag2, index) {
  const LANGUAGE_REGEXP = /^\s*([^\s\-;]+)(?:-([^\s;]+))?\s*(?:;(.*))?$/;
  const match = LANGUAGE_REGEXP.exec(languageTag2);
  if (!match)
    return void 0;
  const [, prefix, suffix, qualityMatch] = match;
  if (!prefix)
    throw new Error(`Invalid language tag: ${languageTag2}`);
  const full = suffix ? `${prefix}-${suffix}` : prefix;
  const quality = parseQuality(qualityMatch ?? "") ?? 1;
  return {
    prefix,
    suffix,
    quality,
    index,
    full
  };
}
function parseQuality(qualityMatch) {
  return qualityMatch.split(";").map((param) => param.split("=")).filter((p) => p[0] == "q" && !!p[1]).map(([, value]) => parseFloat(value))[0];
}
function getHighestLanguagePriority(languageTag2, acceptableLanguages, index) {
  const priorities = acceptableLanguages.map((spec) => calculatePriority(languageTag2, spec, index)).filter((prio) => Boolean(prio));
  const highestPriority = priorities.sort(bySpecificity)[0] || {
    languageTag: languageTag2,
    index: 0,
    order: -1,
    quality: 0,
    specificity: 0
  };
  return highestPriority;
}
function calculatePriority(languageTag2, spec, index) {
  const parsed = parseLanguage(languageTag2, 0);
  if (!parsed)
    return void 0;
  let specificity = 0;
  if (spec.full.toLowerCase() === parsed.full.toLowerCase()) {
    specificity = 4;
  } else if (spec.prefix.toLowerCase() === parsed.full.toLowerCase()) {
    specificity = 2;
  } else if (spec.full.toLowerCase() === parsed.prefix.toLowerCase()) {
    specificity = 1;
  }
  if (specificity === 0 && spec.full !== "*")
    return void 0;
  return {
    languageTag: languageTag2,
    index,
    order: spec.index,
    quality: spec.quality,
    specificity
  };
}
const byQuality = (a, b) => b.quality - a.quality;
const bySpecificity = (a, b) => b.specificity - a.specificity || a.order - b.order || a.index - b.index;
const STATIC = 0;
const OPTIONAL = 1;
const REST = 2;
const REQUIRED = 4;
const PART_TYPE = 0;
const PART_CONTENT = 1;
const PART_MATCHED = 2;
function sort_routes(routes) {
  const get_parts = cached(split);
  return routes.sort((route_a, route_b) => {
    var _a, _b, _c, _d, _e, _f;
    const segments_a = split_route_id(route_a).map(get_parts);
    const segments_b = split_route_id(route_b).map(get_parts);
    for (let i = 0; i < Math.max(segments_a.length, segments_b.length); i += 1) {
      const segment_a = segments_a[i];
      const segment_b = segments_b[i];
      if (!segment_a)
        return -1;
      if (!segment_b)
        return 1;
      for (let j = 0; j < Math.max(segment_a.length, segment_b.length); j += 1) {
        const a = segment_a[j];
        const b = segment_b[j];
        const dynamic = (a == null ? void 0 : a[PART_TYPE]) || (b == null ? void 0 : b[PART_TYPE]);
        if (dynamic) {
          if (!a)
            return -1;
          if (!b)
            return 1;
          const next_a = ((_a = segment_a[j + 1]) == null ? void 0 : _a[PART_CONTENT]) || ((_c = (_b = segments_a[i + 1]) == null ? void 0 : _b[0]) == null ? void 0 : _c[PART_CONTENT]);
          const next_b = ((_d = segment_b[j + 1]) == null ? void 0 : _d[PART_CONTENT]) || ((_f = (_e = segments_b[i + 1]) == null ? void 0 : _e[0]) == null ? void 0 : _f[PART_CONTENT]);
          const both_have_next = next_a && next_b;
          const only_a_has_next = next_a && !next_b;
          const only_b_has_next = !next_a && next_b;
          if ((a[PART_TYPE] && b[PART_TYPE]) === REST) {
            if (both_have_next)
              continue;
            if (only_a_has_next)
              return -1;
            if (only_b_has_next)
              return 1;
          }
          if (a[PART_TYPE] === REST)
            return only_a_has_next ? -1 : 1;
          if (b[PART_TYPE] === REST)
            return only_b_has_next ? 1 : -1;
          if (a[PART_MATCHED] !== b[PART_MATCHED])
            return (-1) ** +a[PART_MATCHED];
          if (a[PART_TYPE] !== b[PART_TYPE]) {
            return (-1) ** +(a[PART_TYPE] > b[PART_TYPE]);
          }
        } else if ((a == null ? void 0 : a[PART_CONTENT]) !== (b == null ? void 0 : b[PART_CONTENT])) {
          return sort_static(a[PART_CONTENT], b[PART_CONTENT]);
        }
      }
    }
    return route_a < route_b ? 1 : -1;
  });
}
function cached(fn) {
  const cache = /* @__PURE__ */ new Map();
  return (arg) => {
    if (!cache.has(arg))
      cache.set(arg, fn(arg));
    return cache.get(arg);
  };
}
function split(id) {
  const parts = [];
  let i = 0;
  while (i <= id.length) {
    const start = id.indexOf("[", i);
    const entirelyStatic = start === -1;
    parts.push([STATIC, id.slice(i, entirelyStatic ? void 0 : start), false]);
    if (entirelyStatic)
      break;
    const type = id[start + 1] === "[" ? OPTIONAL : id[start + 1] === "." ? REST : REQUIRED;
    const endBrackets = type === OPTIONAL ? "]]" : "]";
    const endBracketIdx = id.indexOf(endBrackets, start);
    if (endBracketIdx === -1)
      throw new Error(`Invalid route definition ${id}`);
    const content = id.slice(start, i = endBracketIdx + endBrackets.length);
    parts.push([type, content, content.includes("=")]);
  }
  return parts;
}
const split_route_id = (id) => id.replace(/\[\[[^\]]+\]\](?!$)/g, "").split("/").filter(Boolean);
function sort_static(a, b) {
  if (a === b)
    return 0;
  let idx = 0;
  while (a[idx] === b[idx])
    idx++;
  return !a[idx] ? 1 : !b[idx] ? -1 : a[idx] < b[idx] ? -1 : 1;
}
const param_pattern = /^(\[)?(\.\.\.)?(\w+)(?:=(\w+))?(\])?$/;
function parseRouteDefinition(id) {
  const params = [];
  const pattern = id === "/" ? /^\/$/ : new RegExp(
    `^${get_route_segments(id).map((segment) => {
      const rest_match = /^\[\.\.\.(\w+)(?:=(\w+))?\]$/.exec(segment);
      if (rest_match) {
        params.push({
          name: rest_match[1],
          matcher: rest_match[2],
          optional: false,
          rest: true,
          chained: true
        });
        return "(?:/(.*))?";
      }
      const optional_match = /^\[\[(\w+)(?:=(\w+))?\]\]$/.exec(segment);
      if (optional_match) {
        params.push({
          name: optional_match[1],
          matcher: optional_match[2],
          optional: true,
          rest: false,
          chained: true
        });
        return "(?:/([^/]+))?";
      }
      if (!segment) {
        return;
      }
      const parts = segment.split(/\[(.+?)\](?!\])/);
      const result = parts.map((content, i) => {
        if (i % 2) {
          if (content.startsWith("x+")) {
            return escape(String.fromCharCode(parseInt(content.slice(2), 16)));
          }
          if (content.startsWith("u+")) {
            return escape(
              String.fromCharCode(
                ...content.slice(2).split("-").map((code) => parseInt(code, 16))
              )
            );
          }
          const match = (
            /** @type {RegExpExecArray} */
            param_pattern.exec(content)
          );
          if (!match) {
            throw new Error(`Invalid param: ${content}`);
          }
          const [, is_optional, is_rest, name, matcher] = match;
          params.push({
            name,
            matcher,
            optional: !!is_optional,
            rest: !!is_rest,
            chained: is_rest ? i === 1 && parts[0] === "" : false
          });
          return is_rest ? "(.*?)" : is_optional ? "([^/]*)?" : "([^/]+?)";
        }
        return escape(content);
      }).join("");
      return "/" + result;
    }).join("")}/?$`
  );
  return { pattern, params };
}
function exec(match, params, matchers) {
  const result = {};
  const values = match.slice(1);
  const values_needing_match = values.filter((v) => v !== void 0);
  let buffered = 0;
  for (const [i, param] of params.entries()) {
    let value = values[i - buffered];
    if (param.chained && param.rest && buffered) {
      value = values.slice(i - buffered, i + 1).filter((s) => s).join("/");
      buffered = 0;
    }
    if (value === void 0) {
      if (param.rest)
        result[param.name] = "";
      continue;
    }
    if (param.matcher && !matchers[param.matcher])
      return void 0;
    const matcher = matchers[param.matcher] ?? (() => true);
    if (matcher(value)) {
      result[param.name] = value;
      const next_param = params[i + 1];
      const next_value = values[i + 1];
      if (next_param && !next_param.rest && next_param.optional && next_value && param.chained) {
        buffered = 0;
      }
      if (!next_param && !next_value && Object.keys(result).length === values_needing_match.length) {
        buffered = 0;
      }
      continue;
    }
    if (param.optional && param.chained) {
      buffered++;
      continue;
    }
    return;
  }
  if (buffered)
    return;
  return result;
}
function escape(str) {
  return str.normalize().replace(/[[\]]/g, "\\$&").replace(/%/g, "%25").replace(/\//g, "%2[Ff]").replace(/\?/g, "%3[Ff]").replace(/#/g, "%23").replace(/[.*+?^${}()|\\]/g, "\\$&");
}
const basic_param_pattern = /\[(\[)?(\.\.\.)?(\w+?)(?:=(\w+))?\]\]?/g;
function resolveRoute(id, params) {
  return "/" + get_route_segments(id).map(
    (segment) => segment.replace(basic_param_pattern, (_, optional, rest, name) => {
      const param_value = params[name];
      if (!param_value) {
        if (optional || rest && param_value !== void 0)
          return "";
        else
          throw new Error(`Missing parameter '${name}' in route ${id}`);
      }
      if (param_value[0] == "/" || param_value.endsWith("/"))
        throw new Error(`Parameter '${name}' in route ${id} cannot start or end with a slash`);
      return param_value;
    })
  ).filter(Boolean).join("/");
}
function bestMatch(canonicalPath, pathDefinitions, matchers) {
  const sorted = sort_routes(pathDefinitions);
  for (const pathDefinition of sorted) {
    const route = parseRouteDefinition(pathDefinition);
    const match = route.pattern.exec(removeTrailingSlash(canonicalPath));
    if (!match)
      continue;
    const params = exec(match, route.params, matchers);
    if (params)
      return { params, id: pathDefinition };
  }
  return void 0;
}
const removeTrailingSlash = (path) => path.endsWith("/") ? path.slice(0, -1) : path;
const get_route_segments = (route) => route.slice(1).split("/");
class ALSContext {
  ctx;
  constructor(ALS) {
    this.ctx = new ALS();
  }
  get() {
    return this.ctx.getStore();
  }
  async callAsync(val, cb) {
    return await this.ctx.run(val, cb);
  }
}
class GlobalContext {
  value = void 0;
  get() {
    return this.value;
  }
  async callAsync(val, cb) {
    this.value = val;
    return await cb();
  }
}
const VARY_HEADER = ["cookie", "accept-language"].join(", ");
const createHandle = (strategy, i18n2, options) => {
  let languageContext = void 0;
  function initializeLanguageContext(AsyncLocalStorage) {
    languageContext = AsyncLocalStorage ? new ALSContext(AsyncLocalStorage) : new GlobalContext();
    i18n2.runtime.setLanguageTag(() => {
      if (!languageContext)
        throw new Error("languageContext not initialized - This should never happen, please file an issue");
      const val = languageContext.get();
      return i18n2.runtime.isAvailableLanguageTag(val) ? val : i18n2.defaultLanguageTag;
    });
  }
  const langPlaceholder = options.langPlaceholder ?? "%paraglide.lang%";
  const dirPlaceholder = options.textDirectionPlaceholder ?? "%paraglide.textDirection%";
  return async ({ resolve, event }) => {
    if (!languageContext) {
      const als = options.disableAsyncLocalStorage ? void 0 : (await import("node:async_hooks")).AsyncLocalStorage;
      initializeLanguageContext(als);
    }
    const [localisedPath, suffix] = parseRoute(event.url.pathname, base);
    const langFromUrl = strategy.getLanguageFromLocalisedPath(localisedPath);
    const langCookie = event.cookies.get(LANG_COOKIE_NAME);
    const cookieLang = i18n2.runtime.isAvailableLanguageTag(langCookie) ? langCookie : void 0;
    const negotiatedLanguagePreferences = negotiateLanguagePreferences(event.request.headers.get("accept-language"), i18n2.runtime.availableLanguageTags);
    const negotiatedLanguage = negotiatedLanguagePreferences[0];
    const lang = langFromUrl ?? cookieLang ?? negotiatedLanguage ?? i18n2.defaultLanguageTag;
    if (lang !== langFromUrl && !i18n2.exclude(localisedPath)) {
      const localisedPathname = strategy.getLocalisedPath(localisedPath, lang);
      const fullPath = serializeRoute(localisedPathname, base, suffix);
      const to = new URL(event.url);
      to.pathname = fullPath;
      const href = getHrefBetween(event.url, to);
      return new Response(void 0, {
        status: 302,
        headers: {
          Location: href,
          Vary: VARY_HEADER
        }
      });
    }
    if (lang !== cookieLang && !i18n2.exclude(event.url.pathname)) {
      event.cookies.set(LANG_COOKIE_NAME, lang, {
        maxAge: 31557600,
        sameSite: "lax",
        path: base || "/",
        httpOnly: false
      });
    }
    const textDirection = i18n2.textDirection[lang] ?? "ltr";
    const paraglideLocals = {
      lang,
      textDirection
    };
    event.locals.paraglide = paraglideLocals;
    if (!languageContext)
      throw new Error("languageContext not initialized - This should never happen, please file an issue");
    return languageContext.callAsync(paraglideLocals.lang, async () => {
      return await resolve(event, {
        transformPageChunk({ html, done }) {
          if (!done)
            return html;
          return html.replace(langPlaceholder, lang).replace(dirPlaceholder, textDirection);
        }
      });
    });
  };
};
const createReroute = (strategy) => {
  return ({ url }) => {
    try {
      const [localisedPath, dataSuffix] = parseRoute(url.pathname, base);
      const lang = strategy.getLanguageFromLocalisedPath(localisedPath);
      if (!lang)
        return url.pathname;
      const canonicalPath = strategy.getCanonicalPath(localisedPath, lang);
      return serializeRoute(canonicalPath, base, dataSuffix);
    } catch (e) {
      return url.pathname;
    }
  };
};
function normalize(path) {
  return `/${path.split("/").filter(Boolean).join("/")}`;
}
function createExclude(excludeConfig) {
  const checks = excludeConfig.map((exclude) => typeof exclude === "string" ? (path) => path === exclude : (path) => exclude.test(path));
  return (path) => checks.some((check) => check(normalize(path)));
}
const RTL = "rtl";
const LTR = "ltr";
function guessTextDir(lang) {
  try {
    const locale = new Intl.Locale(lang);
    if ("textInfo" in locale) {
      return locale.textInfo.direction === RTL ? RTL : LTR;
    }
    return locale.getTextInfo().direction === RTL ? RTL : LTR;
  } catch (e) {
    return LTR;
  }
}
function guessTextDirMap(langs) {
  const entries = langs.map((lang) => [lang, guessTextDir(lang)]);
  return Object.fromEntries(entries);
}
function PrefixStrategy(availableLanguageTags2, defaultLanguageTag, translations, matchers, prefixDefaultLanguage) {
  function getLanguageFromLocalisedPath(localisedPath) {
    const segments = localisedPath.split("/");
    const maybeLang = segments[1];
    if (availableLanguageTags2.includes(maybeLang) && (prefixDefaultLanguage === "always" || maybeLang !== defaultLanguageTag)) {
      return maybeLang;
    }
    if (prefixDefaultLanguage === "never")
      return defaultLanguageTag;
    else
      return void 0;
  }
  function getLocalisedPath(canonicalPath, languageTag2) {
    const trailingSlash = canonicalPath.endsWith("/") && canonicalPath !== "/";
    canonicalPath = trailingSlash ? canonicalPath.slice(0, -1) : canonicalPath;
    let translatedPath = turnIntoTranslatedPath(canonicalPath, languageTag2, translations, matchers);
    if (trailingSlash) {
      translatedPath += "/";
    }
    if (prefixDefaultLanguage === "always" || languageTag2 !== defaultLanguageTag) {
      translatedPath = `/${languageTag2}${translatedPath}`;
    }
    return translatedPath;
  }
  function getCanonicalPath(localisedPath, languageTag2) {
    const trailingSlahsBefore = localisedPath.endsWith("/") && localisedPath !== "/";
    if (prefixDefaultLanguage === "always" || languageTag2 !== defaultLanguageTag) {
      localisedPath = localisedPath.replace(`/${languageTag2}`, "") || "/";
    }
    const trailingSlash = trailingSlahsBefore;
    localisedPath = trailingSlash ? localisedPath.slice(0, -1) : localisedPath;
    let canonicalPath = turnIntoCanonicalPath(localisedPath, languageTag2, translations, matchers);
    if (trailingSlash) {
      canonicalPath += "/";
    }
    return canonicalPath;
  }
  return {
    getLanguageFromLocalisedPath,
    getLocalisedPath,
    getCanonicalPath
  };
}
function turnIntoCanonicalPath(translatedPath, lang, translations, matchers) {
  for (const [canonicalPathDefinition, translationsForPath] of Object.entries(translations)) {
    if (!(lang in translationsForPath))
      continue;
    const translatedPathDefinition = translationsForPath[lang];
    if (!translatedPathDefinition)
      continue;
    const match = bestMatch(translatedPath, [translatedPathDefinition], matchers);
    if (!match)
      continue;
    return resolveRoute(canonicalPathDefinition, match.params);
  }
  return translatedPath;
}
function turnIntoTranslatedPath(canonicalPath, lang, translations, matchers) {
  const match = bestMatch(canonicalPath, Object.keys(translations), matchers);
  if (!match)
    return canonicalPath;
  const translationsForPath = translations[match.id];
  if (!translationsForPath)
    return canonicalPath;
  const translatedPath = translationsForPath[lang];
  if (!translatedPath)
    return canonicalPath;
  return resolveRoute(translatedPath, match.params);
}
function createI18n(runtime2, options) {
  const translations = {};
  const excludeConfig = [];
  const defaultLanguageTag = runtime2.sourceLanguageTag;
  const config = {
    defaultLanguageTag,
    runtime: runtime2,
    translations,
    matchers: {},
    exclude: createExclude(excludeConfig),
    prefixDefaultLanguage: "never",
    textDirection: guessTextDirMap(runtime2.availableLanguageTags),
    seo: {
      noAlternateLinks: false
    }
  };
  const strategy = PrefixStrategy(runtime2.availableLanguageTags, defaultLanguageTag, config.translations, config.matchers, config.prefixDefaultLanguage);
  Object.freeze(translations);
  Object.freeze(config);
  return {
    /**
     * The configuration that was used to create this i18n instance.
     */
    config,
    /**
     * The routing strategy that's being used.
     *
     * @private Not part of the public API, may change in non-major versions
     */
    strategy,
    /**
     * Returns a `reroute` hook that applies the path translations to the paths.
     * Register it in your `src/hooks.js` file to enable path translations.
     *
     * @example
     * ```ts
     * // src/hooks.js
     * import { i18n } from "../lib/i18n.js"
     * export const reroute = i18n.reroute()
     * ```
     */
    reroute: () => createReroute(strategy),
    /**
     * Returns a `handle` hook that set's the correct `lang` attribute
     * on the `html` element
     *
     * SERVER ONLY
     */
    handle: (options2 = {}) => {
      return createHandle(strategy, config, options2);
    },
    /**
     * Takes in a URL and returns the language that should be used for it.
     *
     * @param url
     * @returns
     */
    getLanguageFromUrl(url) {
      const normalizedBase = normaliseBase(base);
      const [localizedPath] = parseRoute(url.pathname, normalizedBase);
      if (config.exclude(localizedPath))
        return config.defaultLanguageTag;
      return strategy.getLanguageFromLocalisedPath(localizedPath) || config.defaultLanguageTag;
    },
    /**
     * Takes in a route and returns a translated version of it.
     * This is useful for use in `goto` statements and `redirect` calls.
     *
     * The oposite of `i18n.route()`.
     *
     * @param canonicalPath The path to translate (eg _/base/about_)
     * @param lang The language to translate to - Defaults to the current language
     * @returns The translated path (eg _/base/de/ueber-uns_)
     *
     * @example
     * ```ts
     * redirect(i18n.resolveRoute("/base/about", "de"))
     * ```
     */
    resolveRoute(path, lang = void 0) {
      if (config.exclude(path))
        return path;
      const normalizedBase = normaliseBase(base);
      const [canonicalPath, dataSuffix] = parseRoute(path, normalizedBase);
      lang = lang ?? runtime2.languageTag();
      if (!path.startsWith(normalizedBase))
        return path;
      const localisedPath = strategy.getLocalisedPath(canonicalPath, lang);
      return serializeRoute(localisedPath, normalizedBase, dataSuffix);
    },
    /**
     * Takes in a path in one language and returns it's canonical version.
     * The oposite of `i18n.resolveRoute()`.
     * This is useful for use in:
     * - Language Switchers
     * - Navigation
     *
     * @param targetedPathSource The path to translate (eg _/base/de/ueber-uns_)
     * @returns The canonical version path (eg _/base/about_)
     *
     * @example
     * ```ts
     * <a
     *   href={i18n.route($page.url.pathname)}
     *   hreflang="en"
     * >
     * ```
     */
    route(translatedPath) {
      const normalizedBase = normaliseBase(base);
      const [localisedPath, dataSuffix] = parseRoute(translatedPath, normalizedBase);
      const lang = strategy.getLanguageFromLocalisedPath(localisedPath);
      const languageTag2 = lang || config.defaultLanguageTag;
      const canonicalPath = strategy.getCanonicalPath(localisedPath, languageTag2);
      return serializeRoute(canonicalPath, normalizedBase, dataSuffix);
    }
  };
}
function normaliseBase(base2) {
  if (base2 === "")
    return "";
  if (base2.startsWith("/"))
    return base2;
  return normaliseBase$1(base2, new URL(get(page).url));
}
const i18n = createI18n(runtime);
export {
  parseRoute as a,
  getHrefBetween as g,
  i18n as i,
  normaliseBase$1 as n,
  page as p,
  serializeRoute as s
};
