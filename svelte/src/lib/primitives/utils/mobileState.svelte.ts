// Mobile detection utility
// Safe for SSR: defaults to mobile-first, then hydrates on client

export const DESKTOP_BREAKPOINT_MQ = '(min-width: 768px)';

// Global reactive state - shared across all components
let isMobile = $state(true); // Default to mobile for SSR/progressive enhancement
let isInitialized = false;

function initializeMobileDetection(mediaQuery: string) {
	if (isInitialized || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
		return;
	}

	const mql = window.matchMedia(mediaQuery);

	// Set initial state
	isMobile = !mql.matches;

	const handler = (e: MediaQueryListEvent) => {
		isMobile = !e.matches;
	};

	// Add listener with browser compatibility
	if (typeof mql.addEventListener === 'function') {
		mql.addEventListener('change', handler);
	} else if (typeof (mql as any).addListener === 'function') {
		(mql as any).addListener(handler);
	}

	isInitialized = true;
}

/**
 * Get the global mobile state. Initializes detection on first call.
 * All components using this will share the same reactive state.
 */
export function useMobileState(mediaQuery: string = DESKTOP_BREAKPOINT_MQ) {
	initializeMobileDetection(mediaQuery);

	return {
		get isMobile() {
			return isMobile;
		},
		get isDesktop() {
			return !isMobile;
		}
	};
}
