import {
	DEFAULT_BRAND_NAME,
	button,
	escapeHtml,
	heading,
	linkFallback,
	note,
	paragraph,
	renderBaseEmail,
	styles
} from './baseEmail';

interface BrandProps {
	brandName?: string;
	brandTagline?: string;
	brandLogoUrl?: string;
}

export interface VerifyEmailProps extends BrandProps {
	url: string;
}

export function renderVerifyEmail({ url, ...brand }: VerifyEmailProps): string {
	const brandName = brand.brandName ?? DEFAULT_BRAND_NAME;
	const content = `
		${heading('Verify your email address')}
		${paragraph(`Confirm your email address to finish setting up your ${escapeHtml(brandName)} account.`)}
		${button(url, 'Verify email address')}
		${linkFallback(url)}
		${note(`If you didn't sign up for ${brandName}, you can ignore this email.`)}
	`;

	return renderBaseEmail({
		children: content,
		previewText: `Confirm your email address to finish setting up your ${brandName} account.`,
		...brand
	});
}

export interface MagicLinkProps extends BrandProps {
	url: string;
}

export function renderMagicLink({ url, ...brand }: MagicLinkProps): string {
	const brandName = brand.brandName ?? DEFAULT_BRAND_NAME;
	const content = `
		${heading(`Sign in to ${brandName}`)}
		${paragraph(`Use the button below to sign in to your ${escapeHtml(brandName)} account.`)}
		${button(url, 'Sign in')}
		${linkFallback(url)}
		${note("If you didn't ask to sign in, you can ignore this email.")}
	`;

	return renderBaseEmail({
		children: content,
		previewText: `Your sign-in link for ${brandName}.`,
		...brand
	});
}

export interface VerifyOTPProps extends BrandProps {
	code: string;
}

export function renderVerifyOTP({ code, ...brand }: VerifyOTPProps): string {
	const content = `
		${heading('Your verification code')}
		${paragraph('Enter this code to continue:')}
		<div style="${styles.code}">${escapeHtml(code)}</div>
		${note("If you didn't ask for this code, you can ignore this email.")}
	`;

	return renderBaseEmail({
		children: content,
		previewText: `${code} is your verification code.`,
		...brand
	});
}

export interface ResetPasswordProps extends BrandProps {
	url: string;
}

export function renderResetPassword({ url, ...brand }: ResetPasswordProps): string {
	const brandName = brand.brandName ?? DEFAULT_BRAND_NAME;
	const content = `
		${heading('Reset your password')}
		${paragraph(`We received a request to reset the password of your ${escapeHtml(brandName)} account. Choose a new one with the button below.`)}
		${button(url, 'Reset password')}
		${linkFallback(url)}
		${note("If you didn't ask to reset your password, you can ignore this email. Your password stays the same.")}
	`;

	return renderBaseEmail({
		children: content,
		previewText: `Reset the password of your ${brandName} account.`,
		...brand
	});
}

export interface ChangeEmailVerificationProps extends BrandProps {
	url: string;
	newEmail: string;
	userName?: string;
}

/** Sent to the current address, which approves the move to `newEmail`. */
export function renderChangeEmailVerification({
	url,
	newEmail,
	userName,
	...brand
}: ChangeEmailVerificationProps): string {
	const brandName = brand.brandName ?? DEFAULT_BRAND_NAME;
	const content = `
		${heading('Confirm your email address change')}
		${userName ? paragraph(`Hi ${escapeHtml(userName)},`) : ''}
		${paragraph(`You asked to change the email address of your ${escapeHtml(brandName)} account to <strong style="${styles.strong}">${escapeHtml(newEmail)}</strong>. Confirm the change with the button below.`)}
		${button(url, 'Confirm change')}
		${linkFallback(url)}
		${note("If you didn't ask for this change, you can ignore this email. Your email address stays the same.")}
	`;

	return renderBaseEmail({
		children: content,
		previewText: `Confirm the change of your ${brandName} email address to ${newEmail}.`,
		...brand
	});
}

export interface InviteMemberProps extends BrandProps {
	url: string;
	inviter: {
		name: string;
		email: string;
		image?: string;
	};
	organization: {
		name: string;
		logo?: string;
	};
}

export function renderInviteMember({
	url,
	inviter,
	organization,
	...brand
}: InviteMemberProps): string {
	const brandName = brand.brandName ?? DEFAULT_BRAND_NAME;

	const orgLogoHtml = organization.logo
		? `<img src="${escapeHtml(organization.logo)}" width="48" height="48" alt="" style="display: block; width: 48px; height: 48px; border: 0; border-radius: 10px; margin: 0 0 20px;">`
		: '';

	const invitation = `<strong style="${styles.strong}">${escapeHtml(inviter.name)}</strong> (${escapeHtml(inviter.email)}) invited you to join <strong style="${styles.strong}">${escapeHtml(organization.name)}</strong> on ${escapeHtml(brandName)}.`;

	const invitationHtml = inviter.image
		? `
		<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 16px;">
			<tr>
				<td valign="top" style="padding: 0 12px 0 0;">
					<img src="${escapeHtml(inviter.image)}" width="36" height="36" alt="" style="display: block; width: 36px; height: 36px; border: 0; border-radius: 50%;">
				</td>
				<td valign="middle">
					<p style="${styles.text} margin: 0;">${invitation}</p>
				</td>
			</tr>
		</table>`
		: paragraph(invitation);

	const content = `
		${orgLogoHtml}
		${heading(`Join ${organization.name}`)}
		${invitationHtml}
		${button(url, 'Accept invitation')}
		${linkFallback(url)}
		${note("If you weren't expecting this invitation, you can ignore this email.")}
	`;

	return renderBaseEmail({
		children: content,
		previewText: `${inviter.name} invited you to join ${organization.name} on ${brandName}.`,
		...brand
	});
}
