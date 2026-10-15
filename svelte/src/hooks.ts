import { initConvex } from 'convex-svelte/sveltekit';
import { PUBLIC_CONVEX_URL } from '$app/env/public';

// Registers the Convex URL for the auth client in the root layout, the SSR client in
// +layout.server.ts and the auth handler. On the server the client never opens a WebSocket.
initConvex(PUBLIC_CONVEX_URL);
