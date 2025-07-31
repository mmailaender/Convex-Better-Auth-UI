'use client';

// React
import { useState, useCallback } from 'react';
// Nextjs
import { redirect, useSearchParams } from 'next/navigation';

// Primitives
import { toast } from 'sonner';

// Constants
import { AUTH_CONSTANTS } from '@/convex/auth.constants';
// API
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '../lib/auth-client';

// Icons
import { Mail } from 'lucide-react';

type AuthStep = 'email' | 'login' | 'register' | 'verify-email';

interface SignInProps {
	redirectTo?: string;
	onSignIn?: () => void;
}

export default function SignIn({ redirectTo: redirectParam, onSignIn }: SignInProps = {}) {
	const checkEmailAvailabilityAndValidity = useAction(
		api.users.actions.checkEmailAvailabilityAndValidity
	);
	const searchParams = useSearchParams();

	const [currentStep, setCurrentStep] = useState<AuthStep>('email');
	const [email, setEmail] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [verifyingEmail, setVerifyingEmail] = useState(false);
	const [userEmail, setUserEmail] = useState('');

	/**
	 * Creates redirect URL and redirects based on priority conditions
	 */
	const handleRedirect = useCallback((): void => {
		// First check for redirectParam
		if (redirectParam) {
			redirect(redirectParam);
		}

		// Second check for searchParams redirectTo
		const redirectTo = searchParams.get('redirectTo');
		if (redirectTo) {
			redirect(redirectTo);
		}

		// Third check if we're on signin page, redirect to '/'
		if (window.location.pathname.includes('/signin')) {
			redirect('/');
		}

		// If none of the above conditions are true, don't redirect
	}, [redirectParam, searchParams]);

	/**
	 * Waits for Convex authentication state to sync before redirecting
	 */
	const handleAuthSuccess = () => {
		console.log('Sign in successful, waiting for Convex auth sync...');
		toast.success('Signed in successfully!');
		onSignIn?.();
		handleRedirect();
		setSubmitting(false);
	};

	/**
	 * Verifies if email exists and determines the appropriate flow
	 */
	const validateEmail = async (emailValue: string): Promise<void> => {
		setVerifyingEmail(true);

		try {
			const data = await checkEmailAvailabilityAndValidity({
				email: emailValue
			});

			if (data.exists) {
				setCurrentStep('login');
			} else if (data.valid) {
				setCurrentStep('register');
			} else {
				toast.error('Invalid email. Please try again.');
			}
		} catch (error) {
			toast.error('Failed to validate email. Please try again.');

			console.error('Email validation error:', error);
		} finally {
			setVerifyingEmail(false);
		}
	};

	/**
	 * Handles email form submission
	 */
	const handleEmailSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const emailValue = formData.get('email') as string;

		if (emailValue) {
			setEmail(emailValue);
			void validateEmail(emailValue);
		}
	};

	/**
	 * Handles authentication form submission (login or register)
	 */
	const handlePasswordSignIn = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		setSubmitting(true);

		const formData = new FormData(event.currentTarget);

		if (currentStep === 'login') {
			await authClient.signIn.email(
				{
					email,
					password: formData.get('password') as string
				},
				{
					onSuccess: handleAuthSuccess,
					onError: (ctx) => {
						console.error('Sign in error:', ctx.error);
						let errorMessage = 'Could not sign in. Please check your credentials.';

						if (ctx.error.message) {
							if (ctx.error.status === 403) {
								errorMessage = 'Please verify your email address.';
							} else if (
								ctx.error.message.includes('Invalid password') ||
								ctx.error.message.includes('password')
							) {
								errorMessage = 'Invalid password. Please try again.';
							} else if (
								ctx.error.message.includes('not found') ||
								ctx.error.message.includes('email')
							) {
								errorMessage = 'No account found with this email.';
							} else {
								errorMessage = ctx.error.message;
							}
						}

						toast.error(errorMessage);
						setSubmitting(false);
					}
				}
			);
		} else if (currentStep === 'register') {
			await authClient.signUp.email(
				{
					email,
					password: formData.get('password') as string,
					name: formData.get('name') as string
				},
				{
					onSuccess: () => {
						console.log('Registration successful, showing email verification step...');
						setUserEmail(email);
						setCurrentStep('verify-email');
						setSubmitting(false);
					},
					onError: (ctx) => {
						console.error('Sign up error:', ctx.error);
						let errorMessage = 'Could not create account. Please try again.';

						if (ctx.error.message) {
							if (ctx.error.status === 403) {
								errorMessage = 'Please verify your email address.';
							} else if (
								ctx.error.message.includes('already exists') ||
								ctx.error.message.includes('duplicate')
							) {
								errorMessage = 'An account with this email already exists.';
							} else if (ctx.error.message.includes('password')) {
								errorMessage = 'Password does not meet requirements.';
							} else {
								errorMessage = ctx.error.message;
							}
						}

						toast.error(errorMessage);
						setSubmitting(false);
					}
				}
			);
		}
	};

	/**
	 * Resets the flow back to email entry
	 */
	const resetFlow = (): void => {
		setCurrentStep('email');
		setEmail('');
	};

	const renderEmailStep = () => (
		<form className="flex flex-col gap-2" onSubmit={handleEmailSubmit}>
			<input
				className="input"
				type="email"
				name="email"
				placeholder="Enter your email"
				required
				disabled={verifyingEmail}
			/>
			<button className="btn preset-filled" type="submit" disabled={verifyingEmail}>
				{verifyingEmail ? 'Verifying...' : 'Continue'}
			</button>
		</form>
	);

	const renderLoginStep = () => (
		<form className="flex flex-col gap-2" onSubmit={handlePasswordSignIn}>
			<input className="input" type="email" name="email" value={email} disabled />
			<input
				className="input"
				type="password"
				name="password"
				placeholder="Enter your password"
				required
			/>
			<button className="btn preset-filled" type="submit" disabled={submitting}>
				{submitting ? 'Signing in...' : 'Sign in'}
			</button>
			<button type="button" className="anchor text-center text-sm" onClick={resetFlow}>
				Use a different email
			</button>
		</form>
	);

	const renderRegisterStep = () => (
		<form className="flex flex-col gap-2" onSubmit={handlePasswordSignIn}>
			<input className="input" type="email" name="email" value={email} disabled />
			<input className="input" type="text" name="name" placeholder="Enter your name" required />
			<input
				className="input"
				type="password"
				name="password"
				placeholder="Create a password"
				required
			/>
			<button className="btn preset-filled" type="submit" disabled={submitting}>
				{submitting ? 'Creating account...' : 'Create account'}
			</button>
			<button type="button" className="anchor text-center text-sm" onClick={resetFlow}>
				Use a different email
			</button>
		</form>
	);

	const renderVerifyEmailStep = () => (
		<div className="flex flex-col gap-4 text-center">
			<div className="mb-4 flex justify-center">
				<div className="bg-surface-100-900 flex h-16 w-16 items-center justify-center rounded-full">
					<Mail className="text-surface-600-400 size-8" />
				</div>
			</div>
			<h3 className="text-xl font-semibold">Check your email</h3>
			<p className="text-surface-600-400 text-sm">
				We&apos;ve sent a verification link to <strong>{userEmail}</strong>
			</p>
			<p className="text-surface-600-400 text-sm">
				Please check your email and click the verification link to complete your account setup.
			</p>
			<div className="mt-4 flex flex-col gap-2">
				<button type="button" className="anchor text-center text-sm" onClick={resetFlow}>
					Use a different email
				</button>
			</div>
		</div>
	);

	/**
	 * Handles sign in with the specified provider
	 */
	const handleSocialSignIn = async (): Promise<void> => {
		await authClient.signIn.social(
			{ provider: 'github' },
			{
				onSuccess: handleAuthSuccess,
				onError: (ctx) => {
					console.error('Social sign in error:', ctx.error);
					toast.error('Failed to sign in with GitHub. Please try again.');
				}
			}
		);
	};

	// Email verification step - clean UI
	if (currentStep === 'verify-email') {
		return (
			<div className="flex h-full w-full flex-col items-center justify-center">
				<div className="flex h-full w-full max-w-md flex-col justify-center p-8">
					{renderVerifyEmailStep()}
				</div>
			</div>
		);
	}

	// Default sign-in UI
	return (
		<div className="flex h-full w-full flex-col items-center justify-center">
			<div className="flex h-full w-full max-w-md flex-col p-8">
				<h5 className="h4 max-w-96 text-left leading-9 tracking-tighter">
					Build your app 10x faster <br /> with Skeleton Plus
				</h5>
				<p className="text-surface-600-400 mt-3 mb-10 max-w-96 text-left text-sm">
					Pre-built auth, UI kit, theme generator, and guides — everything you need to start fast.
				</p>
				<div className="flex h-full w-full flex-col gap-8">
					{AUTH_CONSTANTS.providers.github && (
						<button
							className="btn preset-filled hover:border-surface-600-400 w-full shadow-sm"
							onClick={handleSocialSignIn}
						>
							<svg
								aria-label="GitHub logo"
								width="20"
								height="20"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
							>
								<path
									fill="currentColor"
									d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"
								></path>
							</svg>
							Sign in with GitHub
						</button>
					)}

					{AUTH_CONSTANTS.providers.github && AUTH_CONSTANTS.providers.password && (
						<div className="relative flex items-center">
							<div className="border-surface-600-400 flex-1 border-t"></div>
							<span className="text-surface-600-400 px-4">OR</span>
							<div className="border-surface-600-400 flex-1 border-t"></div>
						</div>
					)}

					{/* Progressive Email Flow */}
					{AUTH_CONSTANTS.providers.password && (
						<>
							{currentStep === 'email' && renderEmailStep()}
							{currentStep === 'login' && renderLoginStep()}
							{currentStep === 'register' && renderRegisterStep()}
						</>
					)}
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
