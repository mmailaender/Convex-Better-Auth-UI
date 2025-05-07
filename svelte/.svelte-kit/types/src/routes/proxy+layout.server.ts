// @ts-nocheck
import { createConvexAuthHandlers } from '@convex-dev/auth/sveltekit/server';
import type { LayoutServerLoad } from './$types';

// Create auth handlers - convexUrl is automatically detected from environment
const { getAuthState } = createConvexAuthHandlers();

// Export load function to provide auth state to layout
export const load = async (event: Parameters<LayoutServerLoad>[0]) => {
	return { authState: await getAuthState(event) };
};
