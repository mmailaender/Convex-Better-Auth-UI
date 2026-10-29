'use client';

// React
import { useLayoutEffect, useRef, useState } from 'react';

// Primitives
import { toast } from 'sonner';

// API
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

type AuthMethod = 'password' | 'emailOTP' | 'magicLink';

interface EmailStepProps {
	email: string;
	onEmailChange: (email: string) => void;
	onMethodSelect: (method: AuthMethod, emailExists: boolean) => void | Promise<void>;
	submitting: boolean;
	availableMethods: AuthMethod[];
}

// Email Input Step Component
export const EmailStep = ({
	email,
	onEmailChange,
	onMethodSelect,
	submitting,
	availableMethods
}: EmailStepProps) => {
	const [validatingEmail, setValidatingEmail] = useState(false);
	const [validatingEmailMethod, setValidatingEmailMethod] = useState<AuthMethod | null>(null);
	const checkEmailAvailabilityAndValidity = useAction(
		api.users.actions.checkEmailAvailabilityAndValidity
	);

	// The server renders this field, so someone can type into it before the page hydrates.
	// Hydration keeps that text in the field but not in `email`, and React's next render would
	// reset the field to `email`. Take the text into state once mounted, before anything paints.
	const emailInput = useRef<HTMLInputElement>(null);
	useLayoutEffect(() => {
		const typed = emailInput.current?.value;
		if (typed && typed !== email) onEmailChange(typed);
		// Only on mount: from then on, typing reaches `email` through `onChange`
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const getSingleMethodButtonText = () => {
		if (availableMethods.length === 1) {
			switch (availableMethods[0]) {
				case 'password':
					return 'Continue';
				case 'emailOTP':
					return 'Continue';
				case 'magicLink':
					return 'Continue';
				default:
					return 'Continue';
			}
		}
		return 'Continue with Password';
	};

	const handleMethodClick = async (method: AuthMethod) => {
		if (!email) {
			toast.error('Please enter your email address');
			return;
		}

		// Always validate the email before proceeding to any flow
		setValidatingEmail(true);
		setValidatingEmailMethod(method);
		try {
			const data = await checkEmailAvailabilityAndValidity({ email });
			if (!data.valid) {
				toast.error(data.reason || 'Please enter a valid email address.');
				return;
			}
			await onMethodSelect(method, data.exists);
		} catch (error) {
			toast.error('Failed to validate email. Please try again.');
			console.error('Email validation error:', error);
		} finally {
			setValidatingEmail(false);
			setValidatingEmailMethod(null);
		}
	};

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col">
				<label className="label" htmlFor="email">
					Email
				</label>
				<input
					ref={emailInput}
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					value={email}
					onChange={(e) => onEmailChange(e.target.value)}
					className="input preset-filled-surface-200 text-sm"
					placeholder="Enter your email"
					required
					disabled={submitting || validatingEmail}
				/>
			</div>

			{availableMethods.length === 1 ? (
				// Single method available
				<button
					type="button"
					onClick={() => handleMethodClick(availableMethods[0])}
					className="btn preset-filled w-full"
					disabled={submitting || validatingEmail || !email}
				>
					{validatingEmail
						? validatingEmailMethod === 'password'
							? 'Verifying...'
							: 'Sending...'
						: getSingleMethodButtonText()}
				</button>
			) : (
				// Multiple methods available
				<div className="flex flex-col gap-2">
					{availableMethods.includes('password') && (
						<button
							type="button"
							onClick={() => handleMethodClick('password')}
							className="btn preset-filled w-full"
							disabled={submitting || validatingEmail || !email}
						>
							{validatingEmail && validatingEmailMethod === 'password'
								? 'Verifying...'
								: 'Continue with Password'}
						</button>
					)}

					{availableMethods.includes('emailOTP') && (
						<button
							type="button"
							onClick={() => handleMethodClick('emailOTP')}
							className="btn preset-tonal w-full"
							disabled={submitting || validatingEmail || !email}
						>
							{validatingEmail && validatingEmailMethod === 'emailOTP'
								? 'Sending...'
								: 'Continue with Email OTP'}
						</button>
					)}

					{availableMethods.includes('magicLink') && (
						<button
							type="button"
							onClick={() => handleMethodClick('magicLink')}
							className="btn preset-tonal w-full"
							disabled={submitting || validatingEmail || !email}
						>
							{validatingEmail && validatingEmailMethod === 'magicLink'
								? 'Sending...'
								: 'Continue with Magic Link'}
						</button>
					)}
				</div>
			)}
		</div>
	);
};
