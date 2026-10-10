import { describe, expect, it } from 'vitest';
import { safeRedirect } from './safeRedirect';

const ORIGIN = 'https://app.example';

describe('safeRedirect', () => {
	it('keeps a same-origin path with its query and hash', () => {
		expect(safeRedirect('/settings?tab=2&name=[draft]#one//two', '/', ORIGIN)).toBe(
			'/settings?tab=2&name=[draft]#one//two'
		);
	});

	it.each([
		['an empty value', ''],
		['a missing value', null],
		['a full URL to another host', 'https://attacker.example/signin'],
		['a protocol-relative URL', '//attacker.example'],
		['a backslash URL', '/\\attacker.example'],
		['a tab that turns into a protocol-relative URL', '/\t/attacker.example'],
		['a newline that turns into a protocol-relative URL', '/\n/attacker.example'],
		['a dot segment that resolves to a protocol-relative path', '/..//attacker.example'],
		['a javascript: URL', 'javascript:alert(document.domain)'],
		['a malformed URL', 'http://[']
	])('falls back for %s', (_label, target) => {
		expect(safeRedirect(target, '/', ORIGIN)).toBe('/');
		expect(safeRedirect(target, '/settings', ORIGIN)).toBe('/settings');
	});
});
