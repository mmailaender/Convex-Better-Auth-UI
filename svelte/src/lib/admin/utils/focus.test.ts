import { beforeAll, describe, expect, it } from 'vitest';
import { focusTarget, type AdminView } from './focus';

const table = (tab = 'users'): AdminView => ({ tab, user: null, organization: null });
const BACK = '[data-admin-back]';

describe('focusTarget', () => {
	beforeAll(() => {
		// Node has no CSS.escape; ids here don't need escaping
		globalThis.CSS ??= { escape: (value: string) => value } as typeof CSS;
	});

	it('focuses the back button of a profile that opens', () => {
		expect(focusTarget(table(), { ...table(), user: 'u1' })).toBe(BACK);
	});

	it('focuses the back button of an organization page that opens', () => {
		const organizations = table('organizations');
		expect(focusTarget(organizations, { ...organizations, organization: 'o1' })).toBe(BACK);
	});

	it('focuses the back button of a member profile above an organization page', () => {
		const page = { ...table('organizations'), organization: 'o1' };
		expect(focusTarget(page, { ...page, user: 'u1' })).toBe(BACK);
	});

	it('focuses the back button of an organization opened from a profile in the users tab', () => {
		expect(
			focusTarget({ ...table(), user: 'u1' }, { ...table('organizations'), organization: 'o1' })
		).toBe(BACK);
	});

	it('focuses the link a profile was opened from once it closes', () => {
		expect(focusTarget({ ...table(), user: 'u1' }, table())).toBe('[data-admin-focus="u1"]');
	});

	it('focuses the member a profile above an organization page was opened from', () => {
		const page = { ...table('organizations'), organization: 'o1' };
		expect(focusTarget({ ...page, user: 'u1' }, page)).toBe('[data-admin-focus="u1"]');
	});

	it('focuses the organization a page was opened from once it closes', () => {
		const organizations = table('organizations');
		expect(focusTarget({ ...organizations, organization: 'o1' }, organizations)).toBe(
			'[data-admin-focus="o1"]'
		);
	});

	it('leaves focus on the tab after switching tabs', () => {
		expect(focusTarget({ ...table(), user: 'u1' }, table('organizations'))).toBeNull();
		expect(focusTarget(table(), table('organizations'))).toBeNull();
	});

	it('leaves focus alone when nothing opens or closes', () => {
		expect(focusTarget(table(), table())).toBeNull();
	});
});
