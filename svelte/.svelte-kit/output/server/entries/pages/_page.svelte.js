import { T as escape_html, S as pop, P as push } from "../../chunks/index.js";
import { p as page } from "../../chunks/index6.js";
import { U as UserProfile } from "../../chunks/UserProfile.js";
function _page($$payload, $$props) {
  push();
  let user = page.data.user ? JSON.parse(page.data.user) : null;
  $$payload.out += `<div class="flex min-h-screen flex-col items-center justify-center gap-6">`;
  if (user) {
    $$payload.out += "<!--[-->";
    $$payload.out += `Hello ${escape_html(user.primaryEmail)}`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  UserProfile($$payload);
  $$payload.out += `<!----></div>`;
  pop();
}
export {
  _page as default
};
