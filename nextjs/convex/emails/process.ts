"use node";

import { render } from "@maizzle/framework";

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
 * @param rawHtml - Raw HTML string to process
 * @returns Processed HTML with inlined CSS and optimizations
 */
export async function processEmailHtml(rawHtml: string) {
  console.log("Before");
  const processedHtml = (await render(rawHtml, createMaizzleConfig(rawHtml)))
    .html;
  console.log("After");
  return processedHtml;
}
