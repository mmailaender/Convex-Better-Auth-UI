'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { useSearchParams } from 'next/navigation';
import React from 'react';

export default function Login(): React.ReactElement {
	const { signIn } = useAuthActions();
	const searchParams = useSearchParams();

	const handleSignIn = (): void => {
		const redirectTo = searchParams.get('redirectTo');
		if (redirectTo) {
			void signIn('github', { redirectTo });
		} else {
			void signIn('github');
		}
	};

	return (
		<div className="flex w-full flex-col items-stretch gap-2 min-[460px]:flex-row">
			<button className="btn preset-filled-primary-500" onClick={handleSignIn}>
				Sign in with GitHub
			</button>
		</div>
	);
}
