'use client';

// React
import { useState } from 'react';

// Primitives
import { toast } from 'sonner';

// API
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

type AuthMethod = 'password' | 'emailOTP' | 'magicLink';

interface EmailStepProps {
	email: string;
	onEmailChange: (email: string) => void;
	onMethodSelect: (method: AuthMethod) => void;
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
	const checkEmailAvailabilityAndValidity = useAction(
		api.users.actions.checkEmailAvailabilityAndValidity
	);

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

		// If only one method is available, go directly to that flow
		if (availableMethods.length === 1) {
			onMethodSelect(availableMethods[0]);
			return;
		}

		// For password flow, we need to validate email first
		if (method === 'password') {
			setValidatingEmail(true);
			try {
				await checkEmailAvailabilityAndValidity({ email });
				// This would typically determine login vs register, but for simplicity
				// we'll just go to password flow
				onMethodSelect('password');
			} catch (error) {
				toast.error('Failed to validate email. Please try again.');
				console.error('Email validation error:', error);
			} finally {
				setValidatingEmail(false);
			}
		} else {
			// For other methods, go directly to the flow
			onMethodSelect(method);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<label className="text-surface-950-50 text-sm font-medium" htmlFor="email">
					Email
				</label>
				<input
					id="email"
					name="email"
					type="email"
					value={email}
					onChange={(e) => onEmailChange(e.target.value)}
					className="input preset-filled-surface-200"
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
					{validatingEmail ? 'Verifying...' : getSingleMethodButtonText()}
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
							{validatingEmail ? 'Verifying...' : 'Continue with Password'}
						</button>
					)}

					{availableMethods.includes('emailOTP') && (
						<button
							type="button"
							onClick={() => handleMethodClick('emailOTP')}
							className="btn preset-tonal w-full"
							disabled={submitting || !email}
						>
							Continue with Email OTP
						</button>
					)}

					{availableMethods.includes('magicLink') && (
						<button
							type="button"
							onClick={() => handleMethodClick('magicLink')}
							className="btn preset-tonal w-full"
							disabled={submitting || !email}
						>
							Continue with Magic Link
						</button>
					)}
				</div>
			)}
		</div>
	);
};
