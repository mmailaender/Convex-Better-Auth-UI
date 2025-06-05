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
		<div className="bg-surface-100-900 flex h-[100vh] w-full flex-col items-center justify-center">
			<div className="mt-40 flex h-full w-full max-w-md flex-col items-start justify-center p-8">
				<h5 className="h4 text-surface-950-50 max-w-96 text-left leading-9 tracking-tighter">
					Build your app 10x faster <br /> with Skeleton Plus
				</h5>
				<p className="text-surface-600-400 mt-3 mb-10 max-w-96 text-left text-sm">
					Pre-built auth, UI kit, theme generator, and guides — everything you need to start fast.
				</p>
				<div className="flex h-full w-full flex-col gap-2">
					<button
						className="btn preset-filled hover:border-surface-600-400 w-full shadow-sm"
						onClick={handleSignIn}
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
				</div>
				<div>
					<p className="text-surface-600-400 mt-10 text-xs">
						By contining, you agree to our <a className="anchor text-surface-950-50">Terms </a>and{' '}
						<a className="anchor text-surface-950-50">Privacy Polices </a>
					</p>
				</div>
			</div>
		</div>
	);
}
