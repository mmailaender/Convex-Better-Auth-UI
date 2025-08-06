'use client';

// React
import { useState } from 'react';

// Primitives
import { toast } from 'sonner';

// API
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '../api/auth-client';

interface PasswordFlowProps {
	email: string;
	onSuccess: () => void;
	onBack: () => void;
	submitting: boolean;
	onSubmittingChange: (submitting: boolean) => void;
}

// Password Flow Component
export const PasswordFlow = ({
	email,
	onSuccess,
	onBack,
	submitting,
	onSubmittingChange
}: PasswordFlowProps) => {
	const [mode, setMode] = useState<'login' | 'register'>('login');
	const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
	const [isRequestingReset, setIsRequestingReset] = useState(false);
	const checkEmailAvailabilityAndValidity = useAction(
		api.users.actions.checkEmailAvailabilityAndValidity
	);

	useState(() => {
		// Determine if this is login or register based on email
		const validateEmail = async () => {
			try {
				const data = await checkEmailAvailabilityAndValidity({ email });
				setMode(data.exists ? 'login' : 'register');
			} catch (error) {
				console.error('Email validation error:', error);
			}
		};
		validateEmail();
	});

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		onSubmittingChange(true);

		const formData = new FormData(event.currentTarget);
		const password = formData.get('password') as string;

		if (mode === 'login') {
			await authClient.signIn.email(
				{ email, password },
				{
					onSuccess,
					onError: (ctx) => {
						console.error('Sign in error:', ctx.error);
						let errorMessage = 'Could not sign in. Please check your credentials.';

						if (ctx.error.message) {
							if (ctx.error.status === 403) {
								errorMessage = 'Please verify your email address.';
							} else if (ctx.error.message.includes('Invalid password')) {
								errorMessage = 'Invalid password. Please try again.';
							} else if (ctx.error.message.includes('not found')) {
								errorMessage = 'Account not found. Please check your email or sign up.';
							} else {
								errorMessage = ctx.error.message;
							}
						}

						toast.error(errorMessage);
						onSubmittingChange(false);
					}
				}
			);
		} else {
			const name = formData.get('name') as string;

			await authClient.signUp.email(
				{ email, password, name },
				{
					onSuccess: () => {
						// For register, we might want to show email verification step
						onSuccess();
					},
					onError: (ctx) => {
						console.error('Sign up error:', ctx.error);
						let errorMessage = 'Could not create account. Please try again.';

						if (ctx.error.message) {
							if (ctx.error.message.includes('already exists')) {
								errorMessage = 'An account with this email already exists.';
							} else if (ctx.error.message.includes('password')) {
								errorMessage = 'Password does not meet requirements.';
							} else {
								errorMessage = ctx.error.message;
							}
						}

						toast.error(errorMessage);
						onSubmittingChange(false);
					}
				}
			);
		}
	};

	const handleForgotPassword = async () => {
		setIsRequestingReset(true);
		try {
			const { error } = await authClient.requestPasswordReset({
				email,
				redirectTo: `${window.location.origin}/reset-password`
			});

			if (error) {
				throw new Error(error.message || 'Failed to send reset email');
			}

			setShowForgotPasswordDialog(true);
			toast.success('Password reset email sent!');
		} catch (error) {
			console.error('Password reset error:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to send reset email. Please try again.');
		} finally {
			setIsRequestingReset(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<label className="text-surface-950-50 text-sm font-medium">Email</label>
				<input
					type="email"
					value={email}
					disabled
					className="input preset-filled-surface-200 cursor-not-allowed opacity-60"
				/>
			</div>

			{mode === 'register' && (
				<div className="flex flex-col gap-2">
					<label className="text-surface-950-50 text-sm font-medium">Full Name</label>
					<input
						name="name"
						type="text"
						className="input preset-filled-surface-200"
						placeholder="Enter your full name"
						required
						disabled={submitting}
					/>
				</div>
			)}

			<div className="flex flex-col gap-2">
				<label className="text-surface-950-50 text-sm font-medium">Password</label>
				<input
					name="password"
					type="password"
					className="input preset-filled-surface-200"
					placeholder={mode === 'register' ? 'Create a password' : 'Enter your password'}
					required
					disabled={submitting}
				/>
			</div>

			<button type="submit" className="btn preset-filled w-full" disabled={submitting}>
				{submitting ? (
					<div className="flex items-center gap-2">
						<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
						{mode === 'register' ? 'Creating account...' : 'Signing in...'}
					</div>
				) : mode === 'register' ? (
					'Create Account'
				) : (
					'Sign In'
				)}
			</button>

			{mode === 'login' && (
				<button
					type="button"
					className="anchor text-center text-sm"
					onClick={handleForgotPassword}
					disabled={submitting || isRequestingReset}
				>
					{isRequestingReset ? 'Sending...' : 'Forgot password?'}
				</button>
			)}

			<button
				type="button"
				className="anchor text-center text-sm"
				onClick={onBack}
				disabled={submitting}
			>
				Use a different email
			</button>

			{/* Forgot Password Confirmation Dialog */}
			{showForgotPasswordDialog && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="bg-surface-50-950 border-surface-200-800 mx-4 w-full max-w-md rounded-lg border p-6 shadow-lg">
						<div className="mb-4">
							<h3 className="text-surface-950-50 text-lg font-semibold">Check your email</h3>
							<p className="text-surface-600-400 mt-2 text-sm">
								We&apos;ve sent a password reset link to <strong>{email}</strong>.
								<br />
								Click the link in the email to reset your password.
							</p>
						</div>
						<div className="flex gap-2">
							<button
								type="button"
								className="btn preset-filled flex-1"
								onClick={() => setShowForgotPasswordDialog(false)}
							>
								Got it
							</button>
							<button
								type="button"
								className="btn preset-tonal flex-1"
								onClick={handleForgotPassword}
								disabled={isRequestingReset}
							>
								{isRequestingReset ? 'Sending...' : 'Resend email'}
							</button>
						</div>
					</div>
				</div>
			)}
		</form>
	);
};
