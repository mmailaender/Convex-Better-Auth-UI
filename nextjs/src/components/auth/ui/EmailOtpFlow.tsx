'use client';

// React
import { useState, useEffect, useRef } from 'react';

// Primitives
import { toast } from 'sonner';

// API
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '../api/auth-client';

interface EmailOtpFlowProps {
	email: string;
	onSuccess: () => void;
	onBack: () => void;
	submitting: boolean;
	onSubmittingChange: (submitting: boolean) => void;
}

// Email OTP Flow Component
export const EmailOtpFlow = ({
	email,
	onSuccess,
	onBack,
	submitting,
	onSubmittingChange
}: EmailOtpFlowProps) => {
	const [otp, setOtp] = useState('');
	const [name, setName] = useState('');
	const [otpSent, setOtpSent] = useState(false);
	const [mode, setMode] = useState<'login' | 'register'>('login');
	const [emailChecked, setEmailChecked] = useState(false);
	const otpSentRef = useRef(false);
	const onSubmittingChangeRef = useRef(onSubmittingChange);

	const checkEmailAvailabilityAndValidity = useAction(
		api.users.actions.checkEmailAvailabilityAndValidity
	);

	// Keep the ref updated with the latest function
	useEffect(() => {
		onSubmittingChangeRef.current = onSubmittingChange;
	});

	// Check email availability and send OTP when component mounts
	useEffect(() => {
		// Prevent multiple checks and OTP sends
		if (otpSentRef.current || emailChecked) return;
		otpSentRef.current = true;

		const checkEmailAndSendOtp = async () => {
			onSubmittingChangeRef.current(true);

			try {
				// First, check if email exists
				const emailData = await checkEmailAvailabilityAndValidity({ email });
				setMode(emailData.exists ? 'login' : 'register');
				setEmailChecked(true);

				// Then send OTP
				await authClient.emailOtp.sendVerificationOtp(
					{ email, type: 'sign-in' },
					{
						onSuccess: () => {
							setOtpSent(true);
							onSubmittingChangeRef.current(false);
							toast.success('Verification code sent to your email!');
						},
						onError: (ctx) => {
							console.error('OTP send error:', ctx.error);
							toast.error(
								ctx.error.message || 'Failed to send verification code. Please try again.'
							);
							onSubmittingChangeRef.current(false);
							// Reset the refs on error so user can retry
							otpSentRef.current = false;
							setEmailChecked(false);
						}
					}
				);
			} catch (error) {
				console.error('Email validation error:', error);
				toast.error('Failed to validate email. Please try again.');
				onSubmittingChangeRef.current(false);
				// Reset the refs on error so user can retry
				otpSentRef.current = false;
				setEmailChecked(false);
			}
		};

		checkEmailAndSendOtp();
	}, [email, emailChecked, checkEmailAvailabilityAndValidity]); // Dependencies for email check and OTP send

	const handleVerifyOtp = async () => {
		onSubmittingChange(true);

		if (mode === 'login') {
			// Existing user - use regular sign in
			await authClient.signIn.emailOtp(
				{ email, otp },
				{
					onSuccess,
					onError: (ctx) => {
						console.error('OTP verification error:', ctx.error);
						toast.error(ctx.error.message || 'Invalid verification code. Please try again.');
						onSubmittingChange(false);
					}
				}
			);
		} else {
			// New user - use sign up with OTP
			try {
				await authClient.signIn.emailOtp(
					{ email, otp },
					{
						onError: (ctx) => {
							console.error('OTP verification error:', ctx.error);
							toast.error(ctx.error.message || 'Invalid verification code. Please try again.');
							onSubmittingChange(false);
						}
					}
				);

				await authClient.updateUser(
					{ name },
					{
						onSuccess,
						onError: (ctx) => {
							console.error('OTP verification error:', ctx.error);
							toast.error(ctx.error.message || 'Invalid verification code. Please try again.');
							onSubmittingChange(false);
						}
					}
				);
			} catch (error) {
				console.error('OTP sign up error:', error);
				let errorMessage = 'Invalid verification code. Please try again.';

				if (error instanceof Error) {
					if (error.message.includes('Invalid OTP')) {
						errorMessage = 'Invalid verification code. Please try again.';
					} else if (error.message.includes('expired')) {
						errorMessage = 'Verification code has expired. Please request a new one.';
					} else {
						errorMessage = error.message;
					}
				}

				toast.error(errorMessage);
				onSubmittingChange(false);
			}
		}
	};

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		handleVerifyOtp();
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

			{mode === 'register' && emailChecked && (
				<div className="flex flex-col gap-2">
					<label className="text-surface-950-50 text-sm font-medium">Full Name</label>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="input preset-filled-surface-200"
						placeholder="Enter your full name"
						required
						disabled={submitting || !otpSent}
					/>
				</div>
			)}

			<div className="flex flex-col gap-2">
				<label className="text-surface-950-50 text-sm font-medium">Verification Code</label>
				<input
					type="text"
					value={otp}
					onChange={(e) => setOtp(e.target.value)}
					className="input preset-filled-surface-200"
					placeholder="Enter verification code"
					pattern="[0-9]*"
					inputMode="numeric"
					maxLength={6}
					required
					disabled={!otpSent}
				/>
			</div>

			<button
				type="submit"
				className="btn preset-filled w-full"
				disabled={submitting || !otp.trim() || !otpSent || (mode === 'register' && !name.trim())}
			>
				{submitting ? (
					<div className="flex items-center gap-2">
						<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
						{!emailChecked
							? 'Checking email...'
							: !otpSent
								? 'Sending...'
								: mode === 'register'
									? 'Creating account...'
									: 'Verifying...'}
					</div>
				) : mode === 'register' ? (
					'Create Account'
				) : (
					'Verify Code'
				)}
			</button>

			<button
				type="button"
				className="anchor text-center text-sm"
				onClick={onBack}
				disabled={submitting}
			>
				Use a different email
			</button>
		</form>
	);
};
