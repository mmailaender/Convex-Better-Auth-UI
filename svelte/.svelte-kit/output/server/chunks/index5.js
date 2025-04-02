import { N as NO_TRANSLATE_ATTRIBUTE } from "./constants.js";
import { Q as setContext, ad as getContext } from "./index.js";
const PARAGLIDE_CONTEXT_KEY = {};
const getParaglideContext = () => {
  return (
    /** @type { ParaglideContext<T> | undefined}*/
    getContext(PARAGLIDE_CONTEXT_KEY)
  );
};
const setParaglideContext = (context) => {
  setContext(PARAGLIDE_CONTEXT_KEY, context);
};
function getTranslationFunctions() {
  const ctx = getParaglideContext();
  function translateAttribute(value, lang_value) {
    if (typeof value !== "string") return value;
    if (!ctx) return value;
    return ctx.translateHref(value, lang_value);
  }
  function handleAttributes(attrs, attribute_translations) {
    if (attrs[NO_TRANSLATE_ATTRIBUTE]) return attrs;
    for (const { attribute_name, lang_attribute_name } of attribute_translations) {
      if (attribute_name in attrs) {
        const attr = attrs[attribute_name];
        const lang_attr = lang_attribute_name ? attrs[lang_attribute_name] : void 0;
        attrs[attribute_name] = translateAttribute(
          attr,
          typeof lang_attr === "string" ? lang_attr : void 0
        );
      }
    }
    return attrs;
  }
  return [translateAttribute, handleAttributes];
}
export {
  getTranslationFunctions as g,
  setParaglideContext as s
};
