'use client';

// React
import { useState, useCallback, useEffect } from 'react';
// Nextjs
import { useRouter, useSearchParams } from 'next/navigation';

// Primitives
import { toast } from 'sonner';
// Icons
import { Mail } from 'lucide-react';

// Utils
import { cn } from '../../../lib/utils';

// Constants
import { AUTH_CONSTANTS } from '@/convex/auth.constants';
// API
import { authClient } from '../../../lib/auth/api/auth-client';
import { useConvexAuth } from 'convex/react';

// Components
import { EmailStep } from './EmailStep';
import { PasswordFlow } from './PasswordFlow';
import { EmailOtpFlow } from './EmailOtpFlow';
import { MagicLinkFlow } from './MagicLinkFlow';
import { SocialFlow } from './SocialFlow';

type AuthStep =
	| 'email'
	| 'password-flow'
	| 'email-otp-flow'
	| 'magic-link-flow'
	| 'verify-email'
	| 'success';
type AuthMethod = 'password' | 'emailOTP' | 'magicLink';

interface SignInProps {
	redirectTo?: string;
	onSignIn?: () => void;
	className?: string;
}

// Main SignIn Component
export default function SignIn({
	redirectTo: redirectParam,
	onSignIn,
	className
}: SignInProps = {}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { isAuthenticated, isLoading } = useConvexAuth();
	const [currentStep, setCurrentStep] = useState<AuthStep>('email');
	const [email, setEmail] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [isSigningIn, setIsSigningIn] = useState(false);
	const [magicLinkSent, setMagicLinkSent] = useState(false);
	const [emailExists, setEmailExists] = useState(false);
	const [verifyContext, setVerifyContext] = useState<'emailVerification' | 'magicLink'>(
		'emailVerification'
	);

	const getAvailableMethods = (): AuthMethod[] => {
		const methods: AuthMethod[] = [];
		if (AUTH_CONSTANTS.providers.password) methods.push('password');
		if (AUTH_CONSTANTS.providers.emailOTP && AUTH_CONSTANTS.sendEmails) methods.push('emailOTP');
		if (AUTH_CONSTANTS.providers.magicLink && AUTH_CONSTANTS.sendEmails) methods.push('magicLink');
		return methods;
	};

	const availableMethods = getAvailableMethods();

	const getRedirectURL = useCallback((): string | undefined => {
		if (redirectParam) {
			return redirectParam;
		}

		const redirectTo = searchParams.get('redirectTo');
		if (redirectTo) {
			return redirectTo;
		}

		if (typeof window !== 'undefined' && window.location.pathname.includes('/signin')) {
			return '/';
		}
	}, [redirectParam, searchParams]);

	const handleRedirect = useCallback((): 'internal' | 'external' | 'none' => {
		const redirectURL = getRedirectURL();
		if (!redirectURL || typeof window === 'undefined') return 'none';

		try {
			const target = new URL(redirectURL, window.location.origin);
			if (target.origin === window.location.origin) {
				router.push(`${target.pathname}${target.search}${target.hash}`);
				return 'internal';
			}

			window.location.assign(target.toString());
			return 'external';
		} catch {
			if (redirectURL.startsWith('/')) {
				router.push(redirectURL);
				return 'internal';
			}
		}

		return 'none';
	}, [getRedirectURL, router]);

	const handleAuthSuccess = () => {
		console.log('Sign in successful, waiting for Convex auth sync...');
		toast.success('Signed in successfully!');
		setIsSigningIn(true);
		// Don't redirect immediately - wait for Convex auth sync
	};

	// Monitor authentication state and redirect once Convex auth is synchronized
	useEffect(() => {
		if (isSigningIn && isAuthenticated && !isLoading) {
			console.log('Convex auth synchronized, redirecting...');
			onSignIn?.();
			const redirectMode = handleRedirect();
			if (redirectMode !== 'external') {
				setSubmitting(false);
				setIsSigningIn(false);
			}
		}
	}, [isSigningIn, isAuthenticated, isLoading, onSignIn, handleRedirect]);

	useEffect(() => {
		const availableMethodSet = new Set(availableMethods);
		const isPasswordFlow = currentStep === 'password-flow';
		const isOtpFlow = currentStep === 'email-otp-flow';
		const isMagicLinkFlow = currentStep === 'magic-link-flow';
		const isVerifyEmail = currentStep === 'verify-email';

		if (!AUTH_CONSTANTS.sendEmails && (isVerifyEmail || isMagicLinkFlow || isOtpFlow)) {
			resetToEmailStep();
			return;
		}

		if (isPasswordFlow && !availableMethodSet.has('password')) resetToEmailStep();
		if (isOtpFlow && !availableMethodSet.has('emailOTP')) resetToEmailStep();
		if (isMagicLinkFlow && !availableMethodSet.has('magicLink')) resetToEmailStep();
	}, [availableMethods, currentStep]);

	const handleMethodSelect = async (method: AuthMethod, exists: boolean): Promise<void> => {
		setEmailExists(exists);

		// Existing user + magic link: send directly, skip MagicLinkFlow UI
		if (method === 'magicLink' && exists) {
			await authClient.signIn.magicLink(
				{
					email,
					callbackURL: getRedirectURL() || '/',
					errorCallbackURL: '/signin?error=magic-link-failed'
				},
				{
					onSuccess: () => {
						setVerifyContext('magicLink');
						setMagicLinkSent(true);
						setIsSigningIn(true);
						toast.success('Magic link sent to your email!');
					},
					onError: (ctx) => {
						console.error('Magic link send error:', ctx.error);
						toast.error(ctx.error.message || 'Failed to send magic link. Please try again.');
					}
				}
			);
			return;
		}

		// Email OTP: send OTP directly while EmailStep button shows "Sending..."
		if (method === 'emailOTP') {
			let otpSendSuccess = false;
			await authClient.emailOtp.sendVerificationOtp(
				{ email, type: 'sign-in' },
				{
					onSuccess: () => {
						otpSendSuccess = true;
						toast.success('Verification code sent to your email!');
					},
					onError: (ctx) => {
						console.error('OTP send error:', ctx.error);
						toast.error(ctx.error.message || 'Failed to send verification code. Please try again.');
					}
				}
			);
			if (otpSendSuccess) {
				setCurrentStep('email-otp-flow');
			}
			return;
		}

		// Navigate to the appropriate step based on method
		switch (method) {
			case 'password':
				setCurrentStep('password-flow');
				break;
			case 'magicLink':
				setCurrentStep('magic-link-flow');
				break;
		}
	};

	function resetToEmailStep() {
		setCurrentStep('email');
		setEmail('');
		setSubmitting(false);
		setMagicLinkSent(false);
		setEmailExists(false);
		setVerifyContext('emailVerification');
	}

	const renderCurrentStep = () => {
		switch (currentStep) {
			case 'email':
				return (
					<EmailStep
						email={email}
						onEmailChange={setEmail}
						onMethodSelect={handleMethodSelect}
						submitting={submitting}
						availableMethods={availableMethods}
					/>
				);
			case 'password-flow':
				return (
					<PasswordFlow
						email={email}
						emailExists={emailExists}
						onSuccess={handleAuthSuccess}
						onVerifyEmail={() => {
							setVerifyContext('emailVerification');
							setCurrentStep('verify-email');
						}}
						onBack={resetToEmailStep}
						submitting={submitting}
						onSubmittingChange={setSubmitting}
						callbackURL={getRedirectURL() || '/'}
					/>
				);
			case 'email-otp-flow':
				return (
					<EmailOtpFlow
						email={email}
						emailExists={emailExists}
						onSuccess={handleAuthSuccess}
						onBack={resetToEmailStep}
						submitting={submitting}
						onSubmittingChange={setSubmitting}
					/>
				);
			case 'magic-link-flow':
				return (
					<MagicLinkFlow
						email={email}
						onBack={resetToEmailStep}
						submitting={submitting}
						onSubmittingChange={setSubmitting}
						callbackURL={getRedirectURL() || '/'}
						onLinkSent={() => {
							setMagicLinkSent(true);
							setIsSigningIn(true);
						}}
					/>
				);
			default:
				return null;
		}
	};

	const termsUrl = (AUTH_CONSTANTS.terms ?? '').trim();
	const privacyUrl = (AUTH_CONSTANTS.privacy ?? '').trim();
	const showTerms = Boolean(termsUrl);
	const showPrivacy = Boolean(privacyUrl);
	const showLegal = showTerms || showPrivacy;

	const getStepTitle = () => {
		switch (currentStep) {
			case 'password-flow':
				return emailExists ? 'Sign in with password' : 'Create account with password';
			case 'email-otp-flow':
				return emailExists
					? 'Sign in with verification code'
					: 'Create account with verification code';
			case 'magic-link-flow':
				return 'Sign in with magic link';
			default:
				return `Sign in into ${(AUTH_CONSTANTS.brandName ?? 'self hosted Auth').trim()}`;
		}
	};

	const getStepDescription = () => {
		switch (currentStep) {
			case 'password-flow':
				return emailExists ? 'Enter your password to continue.' : 'Create a password to continue.';
			case 'email-otp-flow':
				return emailExists
					? 'Enter the verification code we sent to your email address.'
					: 'Enter the verification code we sent to your email address.';
			case 'magic-link-flow':
				return "We'll send a magic link to your email address.";
			default:
				return (
					AUTH_CONSTANTS.brandTagline ?? 'Plug & Play Auth Widgets for your application.'
				).trim();
		}
	};

	const showEmailSentState =
		AUTH_CONSTANTS.sendEmails &&
		(currentStep === 'verify-email' || (verifyContext === 'magicLink' && magicLinkSent));

	return (
		<div
			className={cn(
				'mx-auto flex h-full w-full max-w-md flex-col justify-center p-4 pb-8',
				className
			)}
		>
			{showEmailSentState ? (
				<div className="flex flex-col">
					<div className="mb-4 flex">
						<div className="bg-surface-200-800 flex h-16 w-16 items-center justify-center rounded-full">
							<Mail className="text-surface-600-400 size-8" />
						</div>
					</div>

					<h3 className="h5 w-full text-left leading-8">Check your email</h3>
					<p className="text-surface-600-400 mt-2 text-sm">
						{verifyContext === 'magicLink' ? (
							<>
								We&apos;ve sent a magic link to <strong>{email}</strong>.
							</>
						) : (
							<>
								We&apos;ve sent a verification link to <strong>{email}</strong>.
							</>
						)}
					</p>
					<p className="text-surface-600-400 pb-8 text-sm">
						{verifyContext === 'magicLink'
							? 'Click the link in your email to sign in instantly.'
							: "Click the link to verify your email. You'll be signed in automatically after verification."}
					</p>

					<button
						type="button"
						className="btn preset-filled-surface-300-700"
						onClick={resetToEmailStep}
					>
						Use a different email
					</button>
				</div>
			) : (
				<>
					<h5 className="h5 w-full text-left leading-8">{getStepTitle()}</h5>
					<p className="text-surface-600-400 mt-2 max-w-96 pb-16 text-left text-sm sm:pb-12">
						{getStepDescription()}
					</p>

					<div className="flex h-full w-full flex-col gap-6">
						<SocialFlow
							show={currentStep === 'email'}
							dividerAfter={availableMethods.length > 0}
							callbackURL={getRedirectURL() || '/'}
							onSuccess={handleAuthSuccess}
							onSubmittingChange={setSubmitting}
						/>

						{/* Email-based Auth Methods */}
						{availableMethods.length > 0 && renderCurrentStep()}
					</div>

					{showLegal ? (
						<div>
							<p className="text-surface-600-400 mt-10 text-xs">
								By continuing, you agree to our{' '}
								{showTerms ? (
									<a href={termsUrl} className="anchor text-surface-950-50">
										Terms
									</a>
								) : null}
								{showTerms && showPrivacy ? ' and ' : null}
								{showPrivacy ? (
									<a href={privacyUrl} className="anchor text-surface-950-50">
										Privacy Policies
									</a>
								) : null}
							</p>
						</div>
					) : null}
				</>
			)}
		</div>
	);
}
