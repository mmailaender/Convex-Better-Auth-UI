import './polyfills';
import {
	renderVerifyEmail,
	renderMagicLink,
	renderVerifyOTP,
	renderResetPassword,
	renderChangeEmailVerification,
	renderInviteMember
} from './model/emails/templates/emailTemplates';
import { type ActionCtx } from './_generated/server';

import { Resend } from '@convex-dev/resend';
import { components } from './_generated/api';

const EMAIL_SEND_FROM = process.env.EMAIL_SEND_FROM;
const BRAND_NAME = process.env.BRAND_NAME;
const BRAND_TAGLINE = process.env.BRAND_TAGLINE;
const BRAND_LOGO_URL = process.env.BRAND_LOGO_URL;

export const resend: Resend = new Resend(components.resend, {
	testMode: false
});

export const sendEmailVerification = async (
	ctx: ActionCtx,
	{
		to,
		url
	}: {
		to: string;
		url: string;
	}
) => {
	if (!EMAIL_SEND_FROM) {
		throw new Error('EMAIL_SEND_FROM environment variable is required but not set');
	}
	await resend.sendEmail(ctx, {
		from: EMAIL_SEND_FROM,
		to,
		subject: 'Verify your email address',
		html: renderVerifyEmail({
			url,
			brandName: BRAND_NAME,
			brandTagline: BRAND_TAGLINE,
			brandLogoUrl: BRAND_LOGO_URL
		})
	});
};

export const sendOTPVerification = async (
	ctx: ActionCtx,
	{
		to,
		code
	}: {
		to: string;
		code: string;
	}
) => {
	if (!EMAIL_SEND_FROM) {
		throw new Error('EMAIL_SEND_FROM environment variable is required but not set');
	}
	await resend.sendEmail(ctx, {
		from: EMAIL_SEND_FROM,
		to,
		subject: `${code} is your verification code`,
		html: renderVerifyOTP({
			code,
			brandName: BRAND_NAME,
			brandTagline: BRAND_TAGLINE,
			brandLogoUrl: BRAND_LOGO_URL
		})
	});
};

export const sendMagicLink = async (
	ctx: ActionCtx,
	{
		to,
		url
	}: {
		to: string;
		url: string;
	}
) => {
	if (!EMAIL_SEND_FROM) {
		throw new Error('EMAIL_SEND_FROM environment variable is required but not set');
	}
	await resend.sendEmail(ctx, {
		from: EMAIL_SEND_FROM,
		to,
		subject: 'Sign in to your account',
		html: renderMagicLink({
			url,
			brandName: BRAND_NAME,
			brandTagline: BRAND_TAGLINE,
			brandLogoUrl: BRAND_LOGO_URL
		})
	});
};

export const sendResetPassword = async (
	ctx: ActionCtx,
	{
		to,
		url
	}: {
		to: string;
		url: string;
	}
) => {
	if (!EMAIL_SEND_FROM) {
		throw new Error('EMAIL_SEND_FROM environment variable is required but not set');
	}
	await resend.sendEmail(ctx, {
		from: EMAIL_SEND_FROM,
		to,
		subject: 'Reset your password',
		html: renderResetPassword({
			url,
			brandName: BRAND_NAME,
			brandTagline: BRAND_TAGLINE,
			brandLogoUrl: BRAND_LOGO_URL
		})
	});
};

export const sendChangeEmailVerification = async (
	ctx: ActionCtx,
	{
		to,
		url,
		newEmail,
		userName
	}: {
		to: string;
		url: string;
		newEmail: string;
		userName?: string;
	}
) => {
	if (!EMAIL_SEND_FROM) {
		throw new Error('EMAIL_SEND_FROM environment variable is required but not set');
	}
	await resend.sendEmail(ctx, {
		from: EMAIL_SEND_FROM,
		to,
		subject: 'Verify your new email address',
		html: renderChangeEmailVerification({
			url,
			newEmail,
			userName,
			brandName: BRAND_NAME,
			brandTagline: BRAND_TAGLINE,
			brandLogoUrl: BRAND_LOGO_URL
		})
	});
};

export const sendInviteMember = async (
	ctx: ActionCtx,
	{
		to,
		url,
		inviter,
		organization
	}: {
		to: string;
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
) => {
	if (!EMAIL_SEND_FROM) {
		throw new Error('EMAIL_SEND_FROM environment variable is required but not set');
	}
	await resend.sendEmail(ctx, {
		from: EMAIL_SEND_FROM,
		to,
		subject: `Join ${organization.name} on ${BRAND_NAME}`,
		html: renderInviteMember({
			url,
			inviter,
			organization,
			brandName: BRAND_NAME,
			brandTagline: BRAND_TAGLINE,
			brandLogoUrl: BRAND_LOGO_URL
		})
	});
};
