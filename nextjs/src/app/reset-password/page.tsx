'use client';

// React
import { useState, useEffect } from 'react';
// Next.js
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Primitives
import { toast } from 'sonner';

// API
import { authClient } from '../../lib/auth/api/auth-client';
import { AlertTriangle } from 'lucide-react';

type ResetState = 'loading' | 'valid-token' | 'invalid-token' | 'error';

export default function ResetPasswordPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [state, setState] = useState<ResetState>('loading');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [token, setToken] = useState<string | null>(null);

	useEffect(() => {
		const tokenParam = searchParams.get('token');
		const errorParam = searchParams.get('error');

		if (errorParam === 'INVALID_TOKEN') {
			setState('invalid-token');
		} else if (tokenParam) {
			setToken(tokenParam);
			setState('valid-token');
		} else {
			setState('invalid-token');
		}
	}, [searchParams]);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (password !== confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}

		if (password.length < 8) {
			toast.error('Password must be at least 8 characters long');
			return;
		}

		if (!token) {
			toast.error('Invalid reset token');
			return;
		}

		setIsSubmitting(true);

		try {
			const { error } = await authClient.resetPassword({
				newPassword: password,
				token
			});

			if (error) {
				throw new Error(error.message || 'Failed to reset password');
			}

			toast.success('Password reset successfully!');
			// Redirect immediately to sign in
			router.push('/signin');
		} catch (error) {
			console.error('Reset password error:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to reset password. Please try again.';

			if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
				setState('invalid-token');
				toast.error('Reset link has expired or is invalid. Please request a new one.');
			} else {
				setState('error');
				toast.error(errorMessage);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderContent = () => {
		switch (state) {
			case 'loading':
				return (
					<div className="flex flex-col items-center gap-4">
						<div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
						<p className="text-surface-600-400 text-sm">Verifying reset link...</p>
					</div>
				);

			case 'invalid-token':
				return (
					<div className="flex flex-col items-center gap-6">
						<div className="bg-error-500/10 text-error-500 rounded-full p-3">
							<AlertTriangle className="size-6" />
						</div>
						<div className="text-center">
							<h2 className="text-surface-950-50 text-xl font-semibold">Invalid or Expired Link</h2>
							<p className="text-surface-600-400 mt-2 text-sm">
								This password reset link is invalid or has expired.
								<br />
								Please request a new password reset link.
							</p>
						</div>
						<Link href="/signin" className="btn preset-filled">
							Back to Sign In
						</Link>
					</div>
				);

			case 'valid-token':
				return (
					<form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
						<div className="flex flex-col gap-2">
							<label className="text-surface-950-50 text-sm font-medium">New Password</label>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="input preset-filled-surface-200"
								placeholder="Enter your new password"
								required
								minLength={8}
								disabled={isSubmitting}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-surface-950-50 text-sm font-medium">
								Confirm New Password
							</label>
							<input
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="input preset-filled-surface-200"
								placeholder="Confirm your new password"
								required
								minLength={8}
								disabled={isSubmitting}
							/>
						</div>

						<button type="submit" className="btn preset-filled w-full" disabled={isSubmitting}>
							{isSubmitting ? (
								<div className="flex items-center gap-2">
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
									Resetting password...
								</div>
							) : (
								'Reset Password'
							)}
						</button>

						<Link href="/signin" className="anchor text-center text-sm">
							Back to Sign In
						</Link>
					</form>
				);

			case 'error':
			default:
				return (
					<div className="flex flex-col items-center gap-6">
						<div className="bg-error-500/10 text-error-500 rounded-full p-3">
							<AlertTriangle className="size-6" />
						</div>
						<div className="text-center">
							<h2 className="text-surface-950-50 text-xl font-semibold">Something went wrong</h2>
							<p className="text-surface-600-400 mt-2 text-sm">
								There was an error resetting your password.
								<br />
								Please try again or request a new reset link.
							</p>
						</div>
						<div className="flex gap-2">
							<Link href="/signin" className="btn preset-tonal">
								Back to Sign In
							</Link>
							<button
								type="button"
								className="btn preset-filled"
								onClick={() => {
									setState('valid-token');
									setPassword('');
									setConfirmPassword('');
								}}
							>
								Try Again
							</button>
						</div>
					</div>
				);
		}
	};

	return (
		<div className="flex h-screen w-full flex-col items-center justify-center">
			<div className="flex h-full w-full max-w-md flex-col p-8">
				<div className="mb-10">
					<h1 className="h4 text-left leading-9 tracking-tighter">
						{state === 'valid-token' ? 'Reset your password' : 'Password Reset'}
					</h1>
					{state === 'valid-token' && (
						<p className="text-surface-600-400 mt-3 text-left text-sm">
							Enter your new password below.
						</p>
					)}
				</div>

				<div className="flex flex-col justify-center">{renderContent()}</div>
			</div>
		</div>
	);
}
