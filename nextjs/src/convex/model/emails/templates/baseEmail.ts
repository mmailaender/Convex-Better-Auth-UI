export interface BaseEmailProps {
	children: string;
	previewText: string;
	footerLinks?: Array<{ text: string; href: string }>;
	footerText?: string;
	brandName?: string;
	brandTagline?: string;
	brandLogoUrl?: string;
}

export const styles = {
	main: 'background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;',
	container: 'padding-left: 12px; padding-right: 12px; margin: 0 auto; max-width: 600px;',
	h1: 'color: #333; font-size: 24px; font-weight: bold; margin: 40px 0; padding: 0;',
	link: 'color: #2754C5; font-size: 14px; text-decoration: underline;',
	text: 'color: #333; font-size: 14px; margin: 24px 0; line-height: 1.5;',
	footer:
		'color: #898989; font-size: 12px; line-height: 22px; margin-top: 12px; margin-bottom: 24px;',
	code: 'display: inline-block; padding: 16px 4.5%; width: 90.5%; background-color: #f4f4f4; border-radius: 5px; border: 1px solid #eee; color: #333; font-family: monospace;'
};

export function renderBaseEmail({
	children,
	previewText,
	footerLinks = [],
	footerText,
	brandName = 'Better Auth',
	brandTagline = 'Simple, secure authentication for your applications',
	brandLogoUrl
}: BaseEmailProps): string {
	const footerLinksHtml = footerLinks
		.map(
			(link) =>
				`<a href="${link.href}" target="_blank" style="${styles.link}; color: #898989;">${link.text}</a>`
		)
		.join(' • ');

	const logoHtml = brandLogoUrl
		? `<img src="${brandLogoUrl}" width="32" height="32" alt="${brandName} Logo" style="margin-bottom: 16px;" />`
		: '';

	const finalFooterText = footerText || `${brandName}, ${brandTagline.toLowerCase()}`;

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${previewText}</title>
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
<body style="${styles.main}">
	<div style="display: none; overflow: hidden; line-height: 1px; opacity: 0; max-height: 0; max-width: 0;">
		${previewText}
	</div>
	<div style="${styles.container}">
		${children}
		${logoHtml}
		<div style="${styles.footer}">
			${footerLinksHtml}
			${footerLinks.length > 0 ? '<br>' : ''}
			${finalFooterText}
		</div>
	</div>
</body>
</html>`.trim();
}
