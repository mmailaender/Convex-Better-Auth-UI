import { X as attr, S as pop, P as push } from "../../../chunks/index.js";
import { g as getTranslationFunctions } from "../../../chunks/index5.js";
import "../../../chunks/client.js";
import { G as Github } from "../../../chunks/github.js";
import "@oslojs/encoding";
import "@pilcrowjs/object-parser";
function Provider($$payload, $$props) {
  push();
  const paraglide_sveltekit_translate_attribute_pass_translationFunctions = getTranslationFunctions();
  const [
    paraglide_sveltekit_translate_attribute_pass_translateAttribute,
    paraglide_sveltekit_translate_attribute_pass_handle_attributes
  ] = paraglide_sveltekit_translate_attribute_pass_translationFunctions;
  $$payload.out += `<div id="auth_social-login" class="flex flex-col gap-3"><a class="btn flex items-center gap-2 preset-filled-surface-100-900"${attr("href", paraglide_sveltekit_translate_attribute_pass_translateAttribute(`/api/auth/oauth/github`, void 0))}>`;
  Github($$payload, { class: "size-5 dark:fill-white" });
  $$payload.out += `<!----> Continue with GitHub</a></div>`;
  pop();
}
function _page($$payload, $$props) {
  push();
  let email = "";
  const paraglide_sveltekit_translate_attribute_pass_translationFunctions = getTranslationFunctions();
  const [
    paraglide_sveltekit_translate_attribute_pass_translateAttribute,
    paraglide_sveltekit_translate_attribute_pass_handle_attributes
  ] = paraglide_sveltekit_translate_attribute_pass_translationFunctions;
  $$payload.out += `<div class="flex min-h-screen items-center justify-center"><div class="card flex w-full max-w-md flex-col gap-6 border p-6 text-center border-surface-200-800"><div id="auth_sign-in_title" class="flex flex-col gap-3"><h2 class="h3 text-center">Sign in or create account</h2> <p class="text-center text-surface-600-400">Get started for free</p></div> `;
  Provider($$payload);
  $$payload.out += `<!----> <div class="flex items-center"><hr class="hr"> <div class="mx-4 text-surface-500">OR</div> <hr class="hr"></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<form class="flex flex-col gap-3"><input class="input" type="email"${attr("value", email)} placeholder="Enter your email" required> <button class="btn w-full preset-filled" type="submit">Continue</button></form>`;
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <p class="text-center text-xs">By continuing, you agree to our <a${attr("href", paraglide_sveltekit_translate_attribute_pass_translateAttribute(`/terms`, void 0))} class="anchor">Terms of Service</a> and <a${attr("href", paraglide_sveltekit_translate_attribute_pass_translateAttribute(`/privacy-policy`, void 0))} class="anchor">Privacy Policy</a>.</p> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div>`;
  pop();
}
export {
  _page as default
};
