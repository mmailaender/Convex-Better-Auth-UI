'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

// You'll need to add your Convex URL here
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || '';
const client = new ConvexHttpClient(CONVEX_URL);

type AuthStep = 'email' | 'login' | 'register';

export default function SignIn() {
	const { signIn } = useAuthActions();
	const searchParams = useSearchParams();
	const router = useRouter();

	const [currentStep, setCurrentStep] = useState<AuthStep>('email');
	const [email, setEmail] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [verifyingEmail, setVerifyingEmail] = useState(false);
	const [error, setError] = useState('');

	const handleSocialSignIn = (): void => {
		const redirectTo = searchParams.get('redirectTo');
		if (redirectTo) {
			void signIn('github', { redirectTo });
		} else {
			void signIn('github');
		}
	};

	/**
	 * Verifies if email exists and determines the appropriate flow
	 */
	const verifyEmail = async (emailValue: string): Promise<void> => {
		setVerifyingEmail(true);
		setError('');

		try {
			const data = await client.action(api.users.actions.checkEmailAvailabilityAndValidity, {
				email: emailValue
			});

			if (data.exists) {
				setCurrentStep('login');
			} else if (data.valid) {
				setCurrentStep('register');
			} else {
				setError('Invalid email. Please try again.');
			}
		} catch (error) {
			setError('Failed to verify email. Please try again.');
			console.error('Email verification error:', error);
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
			void verifyEmail(emailValue);
		}
	};

	/**
	 * Handles authentication form submission (login or register)
	 */
	const handleAuthSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		setSubmitting(true);
		setError('');

		const formData = new FormData(event.currentTarget);
		formData.set('flow', currentStep === 'login' ? 'signIn' : 'signUp');
		formData.set('email', email);

		const redirectTo = searchParams.get('redirectTo') || '/';

		signIn('password', formData)
			.then(() => {
				router.push(redirectTo);
			})
			.catch((error) => {
				let errorMessage = '';
				if (error.message.includes('Invalid password')) {
					errorMessage = 'Invalid password. Please try again.';
				} else {
					errorMessage =
						currentStep === 'login'
							? 'Could not sign in. Please check your credentials.'
							: 'Could not create account. Please try again.';
				}
				setError(errorMessage);
				setSubmitting(false);
			});
	};

	/**
	 * Resets the flow back to email entry
	 */
	const resetFlow = (): void => {
		setCurrentStep('email');
		setEmail('');
		setError('');
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
			{error && <p className="text-sm text-red-500">{error}</p>}
		</form>
	);

	const renderLoginStep = () => (
		<form className="flex flex-col gap-2" onSubmit={handleAuthSubmit}>
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
			{error && <p className="text-sm text-red-500">{error}</p>}
		</form>
	);

	const renderRegisterStep = () => (
		<form className="flex flex-col gap-2" onSubmit={handleAuthSubmit}>
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
			{error && <p className="text-sm text-red-500">{error}</p>}
		</form>
	);

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

					<div className="relative flex items-center">
						<div className="border-surface-600-400 flex-1 border-t"></div>
						<span className="text-surface-600-400 px-4">OR</span>
						<div className="border-surface-600-400 flex-1 border-t"></div>
					</div>

					{/* Progressive Email Flow */}
					{currentStep === 'email' && renderEmailStep()}
					{currentStep === 'login' && renderLoginStep()}
					{currentStep === 'register' && renderRegisterStep()}

					{process.env.NEXT_PUBLIC_E2E_TEST && (
						<form
							className="flex flex-col gap-2"
							onSubmit={(event: React.FormEvent<HTMLFormElement>): void => {
								event.preventDefault();
								const formData = new FormData(event.currentTarget);
								signIn('secret', formData)
									.then(() => {
										router.push('/');
									})
									.catch(() => {
										window.alert('Invalid secret');
									});
							}}
						>
							Test only: Sign in with a secret
							<input
								aria-label="Secret"
								type="text"
								name="secret"
								placeholder="secret value"
								className="input"
							/>
							<button className="btn preset-filled" type="submit">
								Sign in with secret
							</button>
						</form>
					)}
				</div>
				<div>
					<p className="text-surface-600-400 mt-10 text-xs">
						By continuing, you agree to our{' '}
						<a href="#" className="anchor text-surface-950-50">
							Terms
						</a>{' '}
						and{' '}
						<a href="#" className="anchor text-surface-950-50">
							Privacy Policies
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}
