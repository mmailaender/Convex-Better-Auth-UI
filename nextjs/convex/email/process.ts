import { render as maizzleRender } from "@maizzle/framework";

/**
 * Maizzle configuration for processing HTML templates
 */
export function createMaizzleConfig(input: string) {
  return {
    css: {
      shorthand: true,
      tailwind: {
        content: [
          {
            raw: input,
            extension: "html",
          },
        ],
      },
    },
  };
}

/**
 * Process HTML with Maizzle for consistent email styling
 * @param html - Raw HTML string to process
 * @returns Processed HTML with inlined CSS and optimizations
 */
export async function processEmailHtml(html: string) {
  return (await maizzleRender(html, createMaizzleConfig(html))).html;
}
