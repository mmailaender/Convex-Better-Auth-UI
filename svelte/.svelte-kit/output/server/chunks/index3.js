import { T as escape_html, O as render$1 } from "./index.js";
import { render as render$2 } from "@maizzle/framework";
import tailwindcssPresetEmail from "tailwindcss-preset-email";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import { contentPath, skeleton } from "@skeletonlabs/skeleton/plugin";
import * as themes from "@skeletonlabs/skeleton/themes";
import { b as RESEND_API_KEY } from "./private.js";
import { Resend } from "resend";
const tailwindConfig = {
  content: ["./src/**/*.{html,js,svelte,ts}", contentPath(import.meta.url, "svelte")],
  theme: {
    extend: {
      spacing: {
        128: "512px",
        160: "640px",
        192: "768px"
      }
    }
  },
  darkMode: "media",
  plugins: [
    skeleton({
      themes: [themes.cerberus]
    }),
    typography,
    forms
  ]
};
function Verification($$payload, $$props) {
  let { OTP } = $$props;
  $$payload.out += `<h1 class="h2">Verification code</h1> <p>Enter the following verification code when prompted:</p> <p class="h1">${escape_html(OTP)}</p> <p>To protect your account, do not share this code.</p>`;
}
const maizzleConfig = (input) => {
  return {
    css: {
      shorthand: true,
      tailwind: {
        presets: [tailwindcssPresetEmail],
        content: [
          {
            raw: input,
            extension: "html"
          }
        ],
        theme: tailwindConfig.theme
        // plugins: tailwindConfig.plugins
      }
    }
  };
};
const enrichBody = (body) => {
  return `<!doctype html>
    <html>
    <head>
        <style>
            @tailwind components;
            @tailwind utilities;
        </style>
    </head>
    <body>
        ${body}
    </body>
    </html>`;
};
const render = async (component, props) => {
  const { body } = await render$1(component, { props });
  const html = enrichBody(body);
  return await render$2(html, maizzleConfig(html));
};
const send = async ({ from, to, subject, html }) => {
  const resend = new Resend(RESEND_API_KEY);
  return await resend.emails.send({
    from,
    to,
    subject,
    html
  });
};
const getVerificationEmail = async (OTP) => {
  const componentProps = {
    OTP
  };
  return await render(Verification, componentProps);
};
export {
  getVerificationEmail as g,
  send as s
};
