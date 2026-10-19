import './polyfills';
import {
	renderVerifyEmail,
	renderMagicLink,
	renderVerifyOTP,
	renderResetPassword,
	renderChangeEmailVerification,
	renderInviteMember
} from './model/emails/templates/emailTemplates';
import { BRAND_NAME } from './model/emails/templates/baseEmail';
import { type ActionCtx } from './_generated/server';

import { Resend } from '@convex-dev/resend';
import { components } from './_generated/api';

const EMAIL_SEND_FROM = process.env.EMAIL_SEND_FROM;
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
		subject: `Sign in to ${BRAND_NAME}`,
		html: renderMagicLink({
			url,
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
		subject: 'Confirm your email address change',
		html: renderChangeEmailVerification({
			url,
			newEmail,
			userName,
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
			brandLogoUrl: BRAND_LOGO_URL
		})
	});
};
