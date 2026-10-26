// Tests shared/convex code from the Svelte app: inside shared/convex, the
// vitest import would break the Next.js and Convex typechecks.
import { describe, expect, it } from 'vitest';
import { resolveBaseUrlProtocol } from '../../../convex/url';

describe('resolveBaseUrlProtocol', () => {
	it('lets a valid explicit protocol win over the fallback URL', () => {
		expect(resolveBaseUrlProtocol('http', 'https://app.example.com')).toBe('http');
		expect(resolveBaseUrlProtocol('https', 'http://localhost:5173')).toBe('https');
		expect(resolveBaseUrlProtocol('auto', 'https://app.example.com')).toBe('auto');
	});

	it('takes https from an https fallback URL', () => {
		expect(resolveBaseUrlProtocol(undefined, 'https://app.example.com')).toBe('https');
	});

	it('leaves the protocol to each request with an http fallback URL', () => {
		expect(resolveBaseUrlProtocol(undefined, 'http://localhost:5173')).toBe(undefined);
	});

	it('returns no protocol without a usable fallback URL', () => {
		expect(resolveBaseUrlProtocol(undefined, undefined)).toBe(undefined);
		expect(resolveBaseUrlProtocol(undefined, '')).toBe(undefined);
		expect(resolveBaseUrlProtocol(undefined, 'app.example.com')).toBe(undefined);
		expect(resolveBaseUrlProtocol(undefined, 'ftp://app.example.com')).toBe(undefined);
	});

	it('uses the fallback URL when the explicit value is invalid', () => {
		expect(resolveBaseUrlProtocol('HTTPS', 'https://app.example.com')).toBe('https');
		expect(resolveBaseUrlProtocol('', 'http://localhost:5173')).toBe(undefined);
		expect(resolveBaseUrlProtocol('ws', undefined)).toBe(undefined);
	});
});
