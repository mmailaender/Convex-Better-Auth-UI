'use client';

// React
import { useState, useEffect, useRef } from 'react';

// Primitives
import { toast } from 'sonner';

// API
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '../../../lib/auth/api/auth-client';

// Icons
import { Mail } from 'lucide-react';

interface MagicLinkFlowProps {
	email: string;
	onBack: () => void;
	submitting: boolean;
	onSubmittingChange: (submitting: boolean) => void;
	callbackURL?: string;
}

// Magic Link Flow Component
export const MagicLinkFlow = ({
	email,
	onBack,
	submitting,
	onSubmittingChange,
	callbackURL = '/'
}: MagicLinkFlowProps) => {
	const [name, setName] = useState('');
	const [linkSent, setLinkSent] = useState(false);
	const [mode, setMode] = useState<'login' | 'register'>('login');
	const [emailChecked, setEmailChecked] = useState(false);
	const linkSentRef = useRef(false);
	const onSubmittingChangeRef = useRef(onSubmittingChange);

	const checkEmailAvailabilityAndValidity = useAction(
		api.users.actions.checkEmailAvailabilityAndValidity
	);

	// Keep the ref updated with the latest function
	useEffect(() => {
		onSubmittingChangeRef.current = onSubmittingChange;
	});

	// Check email availability and send magic link when component mounts
	useEffect(() => {
		// Prevent multiple checks and magic link sends
		if (linkSentRef.current || emailChecked) return;
		linkSentRef.current = true;

		const checkEmailAndSendMagicLink = async () => {
			onSubmittingChangeRef.current(true);

			try {
				// First, check if email exists
				const emailData = await checkEmailAvailabilityAndValidity({ email });
				setMode(emailData.exists ? 'login' : 'register');
				setEmailChecked(true);

				// If user exists, send magic link immediately
				if (emailData.exists) {
					await authClient.signIn.magicLink(
						{
							email,
							callbackURL,
							errorCallbackURL: '/signin?error=magic-link-failed'
						},
						{
							onSuccess: () => {
								setLinkSent(true);
								onSubmittingChangeRef.current(false);
								toast.success('Magic link sent to your email!');
							},
							onError: (ctx) => {
								console.error('Magic link send error:', ctx.error);
								toast.error(ctx.error.message || 'Failed to send magic link. Please try again.');
								onSubmittingChangeRef.current(false);
								// Reset the refs on error so user can retry
								linkSentRef.current = false;
								setEmailChecked(false);
							}
						}
					);
				} else {
					// New user - just stop loading, we'll ask for name first
					onSubmittingChangeRef.current(false);
				}
			} catch (error) {
				console.error('Email validation error:', error);
				toast.error('Failed to validate email. Please try again.');
				onSubmittingChangeRef.current(false);
				// Reset the refs on error so user can retry
				linkSentRef.current = false;
				setEmailChecked(false);
			}
		};

		checkEmailAndSendMagicLink();
	}, [email, emailChecked, checkEmailAvailabilityAndValidity, callbackURL]);

	const handleSendMagicLink = async () => {
		onSubmittingChange(true);

		try {
			await authClient.signIn.magicLink(
				{
					email,
					name: mode === 'register' ? name : undefined,
					callbackURL,
					newUserCallbackURL: callbackURL,
					errorCallbackURL: '/signin?error=magic-link-failed'
				},
				{
					onSuccess: () => {
						setLinkSent(true);
						onSubmittingChange(false);
						toast.success('Magic link sent to your email!');
					},
					onError: (ctx) => {
						console.error('Magic link send error:', ctx.error);
						toast.error(ctx.error.message || 'Failed to send magic link. Please try again.');
						onSubmittingChange(false);
					}
				}
			);
		} catch (error) {
			console.error('Magic link error:', error);
			toast.error('Failed to send magic link. Please try again.');
			onSubmittingChange(false);
		}
	};

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!linkSent && mode === 'register' && emailChecked) {
			handleSendMagicLink();
		}
	};

	if (linkSent) {
		return (
			<div className="flex flex-col gap-4 text-center">
				<div className="mb-4 flex justify-center">
					<div className="bg-surface-100-900 flex h-16 w-16 items-center justify-center rounded-full">
						<Mail className="text-surface-600-400 size-8" />
					</div>
				</div>
				<h3 className="text-xl font-semibold">Check your email</h3>
				<p className="text-surface-600-400 text-sm">
					We&apos;ve sent a magic link to <strong>{email}</strong>
				</p>
				<p className="text-surface-600-400 text-sm">
					Click the link in your email to sign in instantly.
				</p>
				<button type="button" className="anchor mt-4 text-center text-sm" onClick={onBack}>
					Use a different email
				</button>
			</div>
		);
	}

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
						disabled={submitting || linkSent}
					/>
				</div>
			)}

			{mode === 'register' && emailChecked && (
				<button
					type="submit"
					className="btn preset-filled w-full"
					disabled={submitting || !name.trim()}
				>
					{submitting ? (
						<div className="flex items-center gap-2">
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
							Sending...
						</div>
					) : (
						'Send Magic Link'
					)}
				</button>
			)}

			{!emailChecked && (
				<div className="flex items-center justify-center py-4">
					<div className="flex items-center gap-2">
						<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
						<span className="text-surface-600-400 text-sm">Checking email...</span>
					</div>
				</div>
			)}

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
