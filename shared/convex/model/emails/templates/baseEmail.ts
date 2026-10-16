export interface BaseEmailProps {
	/** Body HTML, built from the helpers below so every interpolated value is escaped. */
	children: string;
	previewText: string;
	footerLinks?: Array<{ text: string; href: string }>;
	footerText?: string;
	brandName?: string;
	brandTagline?: string;
	brandLogoUrl?: string;
}

export const DEFAULT_BRAND_NAME = 'Better Auth';
const DEFAULT_BRAND_TAGLINE = 'Simple, secure authentication for your applications';

const colors = {
	page: '#f4f4f5',
	surface: '#ffffff',
	border: '#e4e4e7',
	heading: '#18181b',
	text: '#3f3f46',
	// 4.8:1 on the page background and 5.3:1 on the card (WCAG AA for small text).
	muted: '#6b6b73',
	action: '#18181b',
	onAction: '#ffffff'
};

// Single quotes only: these strings sit inside double-quoted style attributes.
const fontFamily =
	"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const styles = {
	h1: `margin: 0 0 16px; font-size: 22px; line-height: 30px; font-weight: 600; color: ${colors.heading};`,
	text: `margin: 0 0 16px; font-size: 15px; line-height: 24px; color: ${colors.text};`,
	small: `margin: 0; font-size: 13px; line-height: 20px; color: ${colors.muted};`,
	strong: `font-weight: 600; color: ${colors.heading};`,
	link: `color: ${colors.text}; text-decoration: underline;`,
	code: `margin: 8px 0 24px; padding: 16px; background-color: ${colors.page}; border-radius: 8px; text-align: center; font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 30px; line-height: 36px; font-weight: 600; letter-spacing: 6px; color: ${colors.heading};`
};

/** Escapes text for HTML content and double-quoted attribute values. */
export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function heading(text: string): string {
	return `<h1 style="${styles.h1}">${escapeHtml(text)}</h1>`;
}

/** `html` is trusted markup; escape any value placed into it. */
export function paragraph(html: string): string {
	return `<p style="${styles.text}">${html}</p>`;
}

/** Table-based so Outlook keeps the fill; it ignores padding on links, so `mso-padding-alt` pads the cell there instead. */
export function button(url: string, label: string): string {
	return `
		<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 8px 0 24px;">
			<tr>
				<td align="center" bgcolor="${colors.action}" style="border-radius: 8px; background-color: ${colors.action}; mso-padding-alt: 12px 24px;">
					<a href="${escapeHtml(url)}" target="_blank" style="display: inline-block; padding: 12px 24px; font-family: ${fontFamily}; font-size: 15px; line-height: 20px; font-weight: 600; color: ${colors.onAction}; text-decoration: none; border-radius: 8px;">${escapeHtml(label)}</a>
				</td>
			</tr>
		</table>`;
}

/** The raw link for clients that block buttons, or readers who copy it. */
export function linkFallback(url: string): string {
	const safeUrl = escapeHtml(url);
	return `
		<p style="${styles.small}">
			If the button doesn't work, paste this link into your browser:<br>
			<a href="${safeUrl}" target="_blank" style="${styles.link} color: ${colors.muted}; word-break: break-all;">${safeUrl}</a>
		</p>`;
}

/** The closing "you can ignore this" line, set apart by a rule. */
export function note(text: string): string {
	return `<p style="${styles.small} margin-top: 24px; padding-top: 20px; border-top: 1px solid ${colors.border};">${escapeHtml(text)}</p>`;
}

export function renderBaseEmail({
	children,
	previewText,
	footerLinks = [],
	footerText,
	brandName = DEFAULT_BRAND_NAME,
	brandTagline = DEFAULT_BRAND_TAGLINE,
	brandLogoUrl
}: BaseEmailProps): string {
	const safeBrandName = escapeHtml(brandName);

	const logoHtml = brandLogoUrl
		? `<img src="${escapeHtml(brandLogoUrl)}" width="28" height="28" alt="" style="display: inline-block; width: 28px; height: 28px; border: 0; border-radius: 6px; vertical-align: middle; margin-right: 10px;">`
		: '';

	const footerLinksHtml = footerLinks
		.map(
			(link) =>
				`<a href="${escapeHtml(link.href)}" target="_blank" style="color: ${colors.muted}; text-decoration: underline;">${escapeHtml(link.text)}</a>`
		)
		.join(' &middot; ');

	const finalFooterText = escapeHtml(footerText ?? `${brandName} — ${brandTagline}`);

	// Invisible filler keeps the client from appending body text to the inbox preview.
	const previewFiller = '&#847;&zwnj;&nbsp;'.repeat(40);

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="x-apple-disable-message-reformatting">
	<meta name="color-scheme" content="light">
	<meta name="supported-color-schemes" content="light">
	<title>${escapeHtml(previewText)}</title>
	<style>
		@media (max-width: 480px) {
			.email-card { padding: 24px !important; }
		}
	</style>
	<!--[if mso]>
	<noscript>
		<xml>
			<o:OfficeDocumentSettings>
				<o:PixelsPerInch>96</o:PixelsPerInch>
			</o:OfficeDocumentSettings>
		</xml>
	</noscript>
	<![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.page};">
	<div style="display: none; overflow: hidden; line-height: 1px; opacity: 0; max-height: 0; max-width: 0;">
		${escapeHtml(previewText)}${previewFiller}
	</div>
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${colors.page}" style="background-color: ${colors.page};">
		<tr>
			<td align="center" style="padding: 40px 16px;">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; font-family: ${fontFamily};">
					<tr>
						<td style="padding: 0 4px 20px; font-family: ${fontFamily}; font-size: 17px; line-height: 28px; font-weight: 600; color: ${colors.heading};">
							${logoHtml}<span style="vertical-align: middle;">${safeBrandName}</span>
						</td>
					</tr>
					<tr>
						<td class="email-card" bgcolor="${colors.surface}" style="padding: 32px; background-color: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 12px; font-family: ${fontFamily};">
							${children}
						</td>
					</tr>
					<tr>
						<td style="padding: 20px 4px 0; font-family: ${fontFamily}; font-size: 12px; line-height: 18px; color: ${colors.muted};">
							${footerLinksHtml ? `${footerLinksHtml}<br>` : ''}
							${finalFooterText}
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`.trim();
}
