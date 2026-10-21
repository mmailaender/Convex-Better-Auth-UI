import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { focusTarget, type AdminView } from './focus.ts';

const table = (tab = 'users'): AdminView => ({ tab, user: null, organization: null });
const BACK = '[data-admin-back]';

describe('focusTarget', () => {
	before(() => {
		// Node has no CSS.escape; ids here don't need escaping
		globalThis.CSS ??= { escape: (value: string) => value } as typeof CSS;
	});

	it('focuses the back button of a profile that opens', () => {
		assert.equal(focusTarget(table(), { ...table(), user: 'u1' }), BACK);
	});

	it('focuses the back button of an organization page that opens', () => {
		const organizations = table('organizations');
		assert.equal(focusTarget(organizations, { ...organizations, organization: 'o1' }), BACK);
	});

	it('focuses the back button of a member profile above an organization page', () => {
		const page = { ...table('organizations'), organization: 'o1' };
		assert.equal(focusTarget(page, { ...page, user: 'u1' }), BACK);
	});

	it('focuses the back button of an organization opened from a profile in the users tab', () => {
		assert.equal(
			focusTarget({ ...table(), user: 'u1' }, { ...table('organizations'), organization: 'o1' }),
			BACK
		);
	});

	it('focuses the link a profile was opened from once it closes', () => {
		assert.equal(focusTarget({ ...table(), user: 'u1' }, table()), '[data-admin-focus="u1"]');
	});

	it('focuses the member a profile above an organization page was opened from', () => {
		const page = { ...table('organizations'), organization: 'o1' };
		assert.equal(focusTarget({ ...page, user: 'u1' }, page), '[data-admin-focus="u1"]');
	});

	it('focuses the organization a page was opened from once it closes', () => {
		const organizations = table('organizations');
		assert.equal(
			focusTarget({ ...organizations, organization: 'o1' }, organizations),
			'[data-admin-focus="o1"]'
		);
	});

	it('leaves focus on the tab after switching tabs', () => {
		assert.equal(focusTarget({ ...table(), user: 'u1' }, table('organizations')), null);
		assert.equal(focusTarget(table(), table('organizations')), null);
	});

	it('leaves focus alone when nothing opens or closes', () => {
		assert.equal(focusTarget(table(), table()), null);
	});
});
