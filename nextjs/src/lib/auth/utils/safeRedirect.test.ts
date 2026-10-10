import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { safeRedirect } from './safeRedirect.ts';

const ORIGIN = 'https://app.example';

describe('safeRedirect', () => {
	it('keeps a same-origin path with its query and hash', () => {
		assert.equal(
			safeRedirect('/settings?tab=2&name=[draft]#one//two', '/', ORIGIN),
			'/settings?tab=2&name=[draft]#one//two'
		);
	});

	for (const [label, target] of [
		['an empty value', ''],
		['a missing value', null],
		['a full URL to another host', 'https://attacker.example/signin'],
		['a protocol-relative URL', '//attacker.example'],
		['a backslash URL', '/\\attacker.example'],
		['a tab that turns into a protocol-relative URL', '/\t/attacker.example'],
		['a newline that turns into a protocol-relative URL', '/\n/attacker.example'],
		['a dot segment that resolves to a protocol-relative path', '/..//attacker.example'],
		['a javascript: URL', 'javascript:alert(document.domain)'],
		['a same-origin blob: URL', `blob:${ORIGIN}/id`],
		['a malformed URL', 'http://[']
	] as const) {
		it(`falls back for ${label}`, () => {
			assert.equal(safeRedirect(target, '/', ORIGIN), '/');
			assert.equal(safeRedirect(target, '/settings', ORIGIN), '/settings');
		});
	}

	it('keeps the origin of a callback built from a same-origin blob: URL', () => {
		assert.equal(ORIGIN + safeRedirect(`blob:${ORIGIN}/id`, '/', ORIGIN), `${ORIGIN}/`);
	});
});
