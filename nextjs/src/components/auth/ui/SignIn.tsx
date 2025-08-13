'use client';

// React
import { useState, useCallback, useEffect } from 'react';
// Nextjs
import { redirect, useSearchParams } from 'next/navigation';

// Primitives
import { toast } from 'sonner';
// Icons
import { SiGithub } from '@icons-pack/react-simple-icons';

// Constants
import { AUTH_CONSTANTS } from '@/convex/auth.constants';
// API
import { authClient } from '../api/auth-client';
import { useConvexAuth } from 'convex/react';

// Components
import { EmailStep } from './EmailStep';
import { PasswordFlow } from './PasswordFlow';
import { EmailOtpFlow } from './EmailOtpFlow';
import { MagicLinkFlow } from './MagicLinkFlow';

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
}

// Main SignIn Component
export default function SignIn({ redirectTo: redirectParam, onSignIn }: SignInProps = {}) {
	const searchParams = useSearchParams();
	const { isAuthenticated, isLoading } = useConvexAuth();
	const [currentStep, setCurrentStep] = useState<AuthStep>('email');
	const [email, setEmail] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [isSigningIn, setIsSigningIn] = useState(false);

	const getAvailableMethods = (): AuthMethod[] => {
		const methods: AuthMethod[] = [];
		if (AUTH_CONSTANTS.providers.password) methods.push('password');
		if (AUTH_CONSTANTS.providers.emailOTP) methods.push('emailOTP');
		if (AUTH_CONSTANTS.providers.magicLink) methods.push('magicLink');
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

		if (window.location.pathname.includes('/signin')) {
			redirect('/');
		}
	}, [redirectParam, searchParams]);

	const handleRedirect = useCallback((): void => {
		const url = getRedirectURL();
		if (!url) return;
		redirect(url);
	}, [getRedirectURL]);

	const handleAuthSuccess = () => {
		console.log('Sign in successful, waiting for Convex auth sync...');
		toast.success('Signed in successfully!');
		setIsSigningIn(true);
		// Don't redirect immediately - wait for Convex auth sync
	};

	// Monitor authentication state and redirect once Convex auth is synchronized
	useEffect(() => {
		if (isSigningIn && isAuthenticated && !isLoading) {
			// User has been signed in and Convex auth state has synchronized
			console.log('Convex auth synchronized, redirecting...');
			onSignIn?.();
			handleRedirect();
			setSubmitting(false);
			setIsSigningIn(false);
		}
	}, [isSigningIn, isAuthenticated, isLoading, onSignIn, handleRedirect]);

	const handleMethodSelect = (method: AuthMethod) => {
		switch (method) {
			case 'password':
				setCurrentStep('password-flow');
				break;
			case 'emailOTP':
				setCurrentStep('email-otp-flow');
				break;
			case 'magicLink':
				setCurrentStep('magic-link-flow');
				break;
		}
	};

	const handleSocialSignIn = async (provider: string): Promise<void> => {
		await authClient.signIn.social(
			{ provider },
			{
				onSuccess: handleAuthSuccess,
				onError: (ctx) => {
					console.error('Social sign in error:', ctx.error);
					toast.error('Failed to sign in with GitHub. Please try again.');
				}
			}
		);
	};

	const resetToEmailStep = () => {
		setCurrentStep('email');
		setEmail('');
		setSubmitting(false);
	};

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
						onSuccess={handleAuthSuccess}
						onBack={resetToEmailStep}
						submitting={submitting}
						onSubmittingChange={setSubmitting}
					/>
				);
			case 'email-otp-flow':
				return (
					<EmailOtpFlow
						email={email}
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
					/>
				);
			default:
				return null;
		}
	};

	const getStepTitle = () => {
		switch (currentStep) {
			case 'password-flow':
				return 'Sign in with password';
			case 'email-otp-flow':
				return 'Sign in with verification code';
			case 'magic-link-flow':
				return 'Sign in with magic link';
			default:
				return 'Self hosted Auth in Minutes';
		}
	};

	const getStepDescription = () => {
		switch (currentStep) {
			case 'password-flow':
				return 'Enter your password to continue.';
			case 'email-otp-flow':
				return "We'll send a verification code to your email address.";
			case 'magic-link-flow':
				return "We'll send a magic link to your email address.";
			default:
				return 'Pre-built auth, UI kit, theme generator, and guides — everything you need to start fast.';
		}
	};

	return (
		<div className="flex h-full w-full flex-col items-center justify-center">
			<div className="flex h-full w-full max-w-md flex-col p-8">
				<h5 className="h4 max-w-96 text-left leading-9 tracking-tighter">{getStepTitle()}</h5>
				<p className="text-surface-600-400 mt-3 mb-10 max-w-96 text-left text-sm">
					{getStepDescription()}
				</p>

				<div className="flex h-full w-full flex-col gap-8">
					{/* Social Sign In */}
					{AUTH_CONSTANTS.providers.github && currentStep === 'email' && (
						<>
							<button
								className="btn preset-filled hover:border-surface-600-400 w-full shadow-sm"
								onClick={() => handleSocialSignIn('github')}
							>
								<SiGithub className="size-5" />
								Sign in with GitHub
							</button>

							{availableMethods.length > 0 && (
								<div className="relative flex items-center">
									<div className="border-surface-600-400 flex-1 border-t"></div>
									<span className="text-surface-600-400 px-4">OR</span>
									<div className="border-surface-600-400 flex-1 border-t"></div>
								</div>
							)}
						</>
					)}

					{/* Email-based Auth Methods */}
					{availableMethods.length > 0 && renderCurrentStep()}
				</div>

				<div>
					<p className="text-surface-600-400 mt-10 text-xs">
						By continuing, you agree to our{' '}
						<a href={AUTH_CONSTANTS.terms} className="anchor text-surface-950-50">
							Terms
						</a>{' '}
						and{' '}
						<a href={AUTH_CONSTANTS.privacy} className="anchor text-surface-950-50">
							Privacy Policies
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}
