import { describe, expect, it } from 'vitest';
import {
	renderChangeEmailVerification,
	renderInviteMember,
	renderVerifyEmail
} from './emailTemplates';

const brand = { brandName: 'Etesie', brandTagline: 'Own your auth. Own your design.' };

describe('email templates', () => {
	it('escapes user-controlled names so they cannot inject markup', () => {
		const html = renderInviteMember({
			url: 'https://example.com/accept?id=1&x=2',
			inviter: { name: '<a href="https://evil.example">Click</a>', email: 'a@example.com' },
			organization: { name: 'Acme <script>' },
			...brand
		});

		expect(html).not.toContain('evil.example">');
		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;a href=&quot;https://evil.example&quot;&gt;Click&lt;/a&gt;');
		expect(html).toContain('href="https://example.com/accept?id=1&amp;x=2"');
	});

	it('escapes the new address and name in the change confirmation', () => {
		const html = renderChangeEmailVerification({
			url: 'https://example.com/confirm',
			newEmail: '"><img src=x>@example.com',
			userName: '<b>Ada</b>',
			...brand
		});

		expect(html).not.toContain('<img src=x>');
		expect(html).not.toContain('<b>Ada</b>');
	});

	it('keeps the tagline as written in the footer', () => {
		const html = renderVerifyEmail({ url: 'https://example.com/verify', ...brand });

		expect(html).toContain('Etesie · Own your auth. Own your design.');
	});

	it('keeps style attributes intact, so the font stack applies', () => {
		const html = renderVerifyEmail({ url: 'https://example.com/verify', ...brand });

		for (const [, style] of html.matchAll(/style="([^"]*)"/g)) {
			expect(style).not.toMatch(/font-family:[^;]*$/);
		}
		expect(html).toContain("'Segoe UI'");
	});
});
