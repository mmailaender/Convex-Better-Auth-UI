import * as server from '../entries/pages/_page.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.ts";
export const imports = ["_app/immutable/nodes/2.P3lt0NX3.js","_app/immutable/chunks/disclose-version.w09OKvMr.js","_app/immutable/chunks/entry.BCpqZHYJ.js","_app/immutable/chunks/props.CeX9gEMn.js","_app/immutable/chunks/index.DW9FamRL.js","_app/immutable/chunks/UserProfile.wVvUxjP4.js","_app/immutable/chunks/github.BSyZe2OA.js","_app/immutable/chunks/legacy.KdXuhMaS.js"];
export const stylesheets = ["_app/immutable/assets/UserProfile.BIaSm-mh.css"];
export const fonts = [];
