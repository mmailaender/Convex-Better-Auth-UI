import { describe, expect, it } from 'vitest';
import {
	renderChangeEmailVerification,
	renderInviteMember,
	renderVerifyEmail
} from '../../convex/model/emails/templates/emailTemplates';

describe('email templates', () => {
	it('escapes user-controlled names so they cannot inject markup', () => {
		const html = renderInviteMember({
			url: 'https://example.com/accept?id=1&x=2',
			inviter: { name: '<a href="https://evil.example">Click</a>', email: 'a@example.com' },
			organization: { name: 'Acme <script>' }
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
			userName: '<b>Ada</b>'
		});

		expect(html).not.toContain('<img src=x>');
		expect(html).not.toContain('<b>Ada</b>');
	});

	it('signs the footer with the brand of AUTH_CONSTANTS, as written', () => {
		const html = renderVerifyEmail({ url: 'https://example.com/verify' });

		expect(html).toContain('self hosted Auth — Plug &amp; Play Auth Widgets for your application.');
	});

	it('keeps style attributes intact, so the font stack applies', () => {
		const html = renderVerifyEmail({ url: 'https://example.com/verify' });

		for (const [, style] of html.matchAll(/style="([^"]*)"/g)) {
			expect(style).not.toMatch(/font-family:[^;]*$/);
		}
		expect(html).toContain("'Segoe UI'");
	});
});
