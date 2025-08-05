<script lang="ts">
	// Svelte
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// Primitives
	import { toast } from 'svelte-sonner';

	// Constants
	import { AUTH_CONSTANTS } from '$convex/auth.constants';

	// API Auth
	import { useConvexClient } from 'convex-svelte';
	const client = useConvexClient();
	import { authClient } from '$lib/auth/api/auth-client';
	import { api } from '$convex/_generated/api';

	let { redirectTo: redirectParam, onSignIn }: { redirectTo?: string; onSignIn?: () => void } =
		$props();

	type AuthStep = 'email' | 'login' | 'register' | 'verify-email';

	let currentStep: AuthStep = $state('email');
	let email = $state('');
	let submitting = $state(false);
	let verifyingEmail = $state(false);
	let userEmail = $state('');

	/**
	 * Creates redirect URL and redirects based on priority conditions
	 */
	function handleRedirect(): void {
		// First check for redirectParam
		if (redirectParam) {
			goto(redirectParam);
			return;
		}

		// Second check for searchParams redirectTo
		const redirectTo = page.url.searchParams.get('redirectTo');
		if (redirectTo) {
			goto(redirectTo);
			return;
		}

		// Third check if we're on signin page, redirect to '/'
		if (page.url.pathname.includes('/signin')) {
			goto('/');
			return;
		}

		// If none of the above conditions are true, don't redirect
	}

	/**
	 * Handles successful authentication and redirects
	 */
	function handleAuthSuccess(): void {
		console.log('Sign in successful, waiting for Convex auth sync...');
		toast.success('Signed in successfully!');
		onSignIn?.();
		handleRedirect();
		submitting = false;
	}

	/**
	 * Verifies if email exists and determines the appropriate flow
	 */
	async function validateEmail(emailValue: string): Promise<void> {
		verifyingEmail = true;

		try {
			const data = await client.action(api.users.actions.checkEmailAvailabilityAndValidity, {
				email: emailValue
			});

			if (data.exists) {
				currentStep = 'login';
			} else if (data.valid) {
				currentStep = 'register';
			} else {
				toast.error('Invalid email. Please try again.');
			}
		} catch (error) {
			toast.error('Failed to validate email. Please try again.');
			console.error('Email validation error:', error);
		} finally {
			verifyingEmail = false;
		}
	}

	/**
	 * Handles email form submission
	 */
	function handleEmailSubmit(event: Event): void {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const emailValue = formData.get('email') as string;

		if (emailValue) {
			email = emailValue;
			void validateEmail(emailValue);
		}
	}

	/**
	 * Handles sign in with the specified provider
	 */
	const handleSocialSignIn = async (provider: string): Promise<void> => {
		await authClient.signIn.social(
			{ provider },
			{
				onSuccess: handleAuthSuccess,
				onError: (ctx) => {
					console.error('Social sign in error:', ctx.error);
					toast.error('Failed to sign in with GitHub. Please try again.');
				}
			}
		);
	};

	/**
	 * Handles authentication form submission (login or register)
	 */
	async function handlePasswordSignIn(event: Event): Promise<void> {
		event.preventDefault();
		submitting = true;

		const formData = new FormData(event.target as HTMLFormElement);

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
								errorMessage = 'Email not found. Please check your email address.';
							}
						}

						toast.error(errorMessage);
						submitting = false;
					}
				}
			);
		} else {
			// Register flow
			await authClient.signUp.email(
				{
					email,
					password: formData.get('password') as string,
					name: formData.get('name') as string
				},
				{
					onSuccess: () => {
						console.log('Registration successful, showing verify email step');
						userEmail = email;
						currentStep = 'verify-email';
						submitting = false;
					},
					onError: (ctx) => {
						console.error('Registration error:', ctx.error);
						let errorMessage = 'Could not create account. Please try again.';

						if (ctx.error.message) {
							if (ctx.error.message.includes('already exists')) {
								errorMessage = 'An account with this email already exists.';
							} else if (ctx.error.message.includes('password')) {
								errorMessage = 'Password does not meet requirements.';
							} else if (ctx.error.message.includes('email')) {
								errorMessage = 'Invalid email address.';
							}
						}

						toast.error(errorMessage);
						submitting = false;
					}
				}
			);
		}
	}

	/**
	 * Resets the flow back to email entry
	 */
	function resetFlow(): void {
		currentStep = 'email';
		email = '';
	}
</script>

{#snippet emailStep()}
	<form class="flex flex-col gap-2" onsubmit={handleEmailSubmit}>
		<input
			class="input"
			type="email"
			name="email"
			placeholder="Enter your email"
			required
			disabled={verifyingEmail}
		/>
		<button class="btn preset-filled" type="submit" disabled={verifyingEmail}>
			{verifyingEmail ? 'Verifying...' : 'Continue'}
		</button>
	</form>
{/snippet}

{#snippet loginStep()}
	<form class="flex flex-col gap-2" onsubmit={handlePasswordSignIn}>
		<input class="input" type="email" name="email" value={email} disabled />
		<input
			class="input"
			type="password"
			name="password"
			placeholder="Enter your password"
			required
		/>
		<button class="btn preset-filled" type="submit" disabled={submitting}>
			{submitting ? 'Signing in...' : 'Sign in'}
		</button>
		<button type="button" class="anchor text-center text-sm" onclick={resetFlow}>
			Use a different email
		</button>
	</form>
{/snippet}

{#snippet registerStep()}
	<form class="flex flex-col gap-2" onsubmit={handlePasswordSignIn}>
		<input class="input" type="email" name="email" value={email} disabled />
		<input class="input" type="text" name="name" placeholder="Enter your name" required />
		<input class="input" type="password" name="password" placeholder="Create a password" required />
		<button class="btn preset-filled" type="submit" disabled={submitting}>
			{submitting ? 'Creating account...' : 'Create account'}
		</button>
		<button type="button" class="anchor text-center text-sm" onclick={resetFlow}>
			Use a different email
		</button>
	</form>
{/snippet}

{#snippet verifyEmailStep()}
	<div class="flex flex-col gap-4 text-center">
		<div class="mb-4 flex justify-center">
			<div class="bg-surface-100-900 flex h-16 w-16 items-center justify-center rounded-full">
				<svg
					class="text-surface-600-400 size-8"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
					></path>
				</svg>
			</div>
		</div>
		<h3 class="text-xl font-semibold">Check your email</h3>
		<p class="text-surface-600-400 text-sm">
			We've sent a verification link to <strong>{userEmail}</strong>
		</p>
		<p class="text-surface-600-400 text-sm">
			Please check your email and click the verification link to complete your account setup.
		</p>
		<div class="mt-4 flex flex-col gap-2">
			<button type="button" class="anchor text-center text-sm" onclick={resetFlow}>
				Use a different email
			</button>
		</div>
	</div>
{/snippet}

<!-- Email verification step - clean UI -->
{#if currentStep === 'verify-email'}
	<div class="flex h-full w-full flex-col items-center justify-center">
		<div class="flex h-full w-full max-w-md flex-col justify-center p-8">
			{@render verifyEmailStep()}
		</div>
	</div>
{:else}
	<!-- Default sign-in UI -->
	<div class="flex h-full w-full flex-col items-center justify-center">
		<div class="flex h-full w-full max-w-md flex-col p-8">
			<h5 class="h4 max-w-96 text-left leading-9 tracking-tighter">
				Build your app 10x faster <br /> with Skeleton Plus
			</h5>
			<p class="text-surface-600-400 mt-3 mb-10 max-w-96 text-left text-sm">
				Pre-built auth, UI kit, theme generator, and guides — everything you need to start fast.
			</p>
			<div class="flex h-full w-full flex-col gap-8">
				{#if AUTH_CONSTANTS.providers.github}
					<button
						class="btn preset-filled hover:border-surface-600-400 w-full shadow-sm"
						onclick={() => handleSocialSignIn('github')}
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
				{/if}

				{#if AUTH_CONSTANTS.providers.github && AUTH_CONSTANTS.providers.password}
					<div class="relative flex items-center">
						<div class="border-surface-600-400 flex-1 border-t"></div>
						<span class="text-surface-600-400 px-4">OR</span>
						<div class="border-surface-600-400 flex-1 border-t"></div>
					</div>
				{/if}

				{#if AUTH_CONSTANTS.providers.password}
					<!-- Progressive Email Flow -->
					{#if currentStep === 'email'}
						{@render emailStep()}
					{:else if currentStep === 'login'}
						{@render loginStep()}
					{:else if currentStep === 'register'}
						{@render registerStep()}
					{/if}
				{/if}
			</div>
			<div>
				<p class="text-surface-600-400 mt-10 text-xs">
					By continuing, you agree to our
					<a href={AUTH_CONSTANTS.terms} class="anchor text-surface-950-50">Terms</a> and
					<a href={AUTH_CONSTANTS.privacy} class="anchor text-surface-950-50">Privacy Policies</a>
				</p>
			</div>
		</div>
	</div>
{/if}
