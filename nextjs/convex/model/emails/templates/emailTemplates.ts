import { renderBaseEmail, styles } from './baseEmail';

export interface VerifyEmailProps {
	url: string;
	brandName?: string;
	brandTagline?: string;
	brandLogoUrl?: string;
}

export function renderVerifyEmail({
	url,
	brandName,
	brandTagline,
	brandLogoUrl
}: VerifyEmailProps): string {
	const content = `
		<h1 style="${styles.h1}">Verify your email</h1>
		<a href="${url}" target="_blank" style="${styles.link}; display: block; margin-bottom: 16px;">
			Click here to verify your email address
		</a>
		<p style="${styles.text}; color: #ababab; margin-top: 14px; margin-bottom: 16px;">
			If you didn't create an account, you can safely ignore this email.
		</p>
	`;

	return renderBaseEmail({
		children: content,
		previewText: 'Verify your email address',
		brandName,
		brandTagline,
		brandLogoUrl
	});
}

export interface MagicLinkProps {
	url: string;
	brandName?: string;
	brandTagline?: string;
	brandLogoUrl?: string;
}

export function renderMagicLink({
	url,
	brandName,
	brandTagline,
	brandLogoUrl
}: MagicLinkProps): string {
	const content = `
		<h1 style="${styles.h1}">Sign in to your account</h1>
		<a href="${url}" target="_blank" style="${styles.link}; display: block; margin-bottom: 16px;">
			Click here to sign in
		</a>
		<p style="${styles.text}; color: #ababab; margin-top: 14px; margin-bottom: 16px;">
			If you didn't request this, you can safely ignore this email.
		</p>
	`;

	return renderBaseEmail({
		children: content,
		previewText: 'Sign in to your account',
		brandName,
		brandTagline,
		brandLogoUrl
	});
}

export interface VerifyOTPProps {
	code: string;
	brandName?: string;
	brandTagline?: string;
	brandLogoUrl?: string;
}

export function renderVerifyOTP({
	code,
	brandName,
	brandTagline,
	brandLogoUrl
}: VerifyOTPProps): string {
	const content = `
		<h1 style="${styles.h1}">Verify your email</h1>
		<p style="${styles.text}">
			Use the following verification code to complete your sign-up:
		</p>
		<div style="${styles.code}; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px;">
			${code}
		</div>
		<p style="${styles.text}; color: #ababab; margin-top: 14px; margin-bottom: 16px;">
			If you didn't create an account, you can safely ignore this email.
		</p>
	`;

	return renderBaseEmail({
		children: content,
		previewText: 'Verify your email address',
		brandName,
		brandTagline,
		brandLogoUrl
	});
}

export interface ResetPasswordProps {
	url: string;
	brandName?: string;
	brandTagline?: string;
	brandLogoUrl?: string;
}

export function renderResetPassword({
	url,
	brandName,
	brandTagline,
	brandLogoUrl
}: ResetPasswordProps): string {
	const content = `
		<h1 style="${styles.h1}">Reset your password</h1>
		<a href="${url}" target="_blank" style="${styles.link}; display: block; margin-bottom: 16px;">
			Click here to reset your password
		</a>
		<p style="${styles.text}; color: #ababab; margin-top: 14px; margin-bottom: 16px;">
			If you didn't request this, you can safely ignore this email.
		</p>
	`;

	return renderBaseEmail({
		children: content,
		previewText: 'Reset your password',
		brandName,
		brandTagline,
		brandLogoUrl
	});
}

export interface ChangeEmailVerificationProps {
	url: string;
	newEmail: string;
	userName?: string;
	brandName?: string;
	brandTagline?: string;
	brandLogoUrl?: string;
}

export function renderChangeEmailVerification({
	url,
	newEmail,
	userName,
	brandName,
	brandTagline,
	brandLogoUrl
}: ChangeEmailVerificationProps): string {
	const content = `
		<h1 style="${styles.h1}">Verify your new email address</h1>
		<p style="${styles.text}">
			${userName ? `Hi ${userName}, ` : ''}You've requested to change your email address to <strong>${newEmail}</strong>.
		</p>
		<p style="${styles.text}">
			To complete this change, please verify your new email address by clicking the link below:
		</p>
		<a href="${url}" target="_blank" style="${styles.link}; display: block; margin-bottom: 16px;">
			Verify new email address
		</a>
		<p style="${styles.text}; color: #ababab; margin-top: 14px; margin-bottom: 16px;">
			If you didn't request this change, you can safely ignore this email. Your current email address will remain unchanged.
		</p>
	`;

	return renderBaseEmail({
		children: content,
		previewText: 'Verify your new email address',
		brandName,
		brandTagline,
		brandLogoUrl
	});
}

export interface InviteMemberProps {
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
	brandName?: string;
	brandTagline?: string;
	brandLogoUrl?: string;
}

export function renderInviteMember({
	url,
	inviter,
	organization,
	brandName,
	brandTagline,
	brandLogoUrl
}: InviteMemberProps): string {
	const inviterImageHtml = inviter.image
		? `<img src="${inviter.image}" width="40" height="40" alt="${inviter.name}" style="border-radius: 50%; margin-right: 12px; vertical-align: middle;" />`
		: '';

	const orgLogoHtml = organization.logo
		? `<img src="${organization.logo}" width="32" height="32" alt="${organization.name}" style="border-radius: 4px; margin-right: 8px; vertical-align: middle;" />`
		: '';

	const content = `
		<h1 style="${styles.h1}">You've been invited to join ${organization.name}</h1>
		<div style="margin: 24px 0; padding: 16px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #2754C5;">
			<div style="display: flex; align-items: center; margin-bottom: 12px;">
				${inviterImageHtml}
				<div>
					<strong style="color: #333; font-size: 14px;">${inviter.name}</strong>
					<div style="color: #666; font-size: 12px;">${inviter.email}</div>
				</div>
			</div>
			<p style="margin: 0; color: #666; font-size: 14px;">
				has invited you to join
			</p>
			<div style="display: flex; align-items: center; margin-top: 8px;">
				${orgLogoHtml}
				<strong style="color: #333; font-size: 16px;">${organization.name}</strong>
			</div>
		</div>
		<a href="${url}" target="_blank" style="${styles.link}; display: inline-block; background-color: #2754C5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
			Accept Invitation
		</a>
		<p style="${styles.text}; color: #ababab; margin-top: 24px; margin-bottom: 16px;">
			If you don't want to join this organization, you can safely ignore this email.
		</p>
	`;

	return renderBaseEmail({
		children: content,
		previewText: `Join ${organization.name} on ${brandName}`,
		brandName,
		brandTagline,
		brandLogoUrl
	});
}
