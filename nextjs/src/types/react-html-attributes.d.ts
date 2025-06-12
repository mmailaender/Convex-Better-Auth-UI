import 'react';

declare module 'react' {
	interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
		// Allow data-state attribute used by components like Popover, Select, etc.
		'data-state'?: 'open' | 'closed' | 'on' | 'off' | 'active' | 'inactive' | string;
		// Add other custom data attributes here if needed
		// 'data-custom'?: string;
	}
}
