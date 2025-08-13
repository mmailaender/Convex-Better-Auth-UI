<script lang="ts">
	// Svelte
	import { toast } from 'svelte-sonner';

	// API
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '$lib/auth/api/auth-client';

	// Components
	import EmailStep from './EmailStep.svelte';
	import PasswordFlow from './PasswordFlow.svelte';
	import EmailOtpFlow from './EmailOtpFlow.svelte';
	import MagicLinkFlow from './MagicLinkFlow.svelte';

	// Icons
	import { SiGithub } from '@icons-pack/svelte-simple-icons';
	import { Mail } from '@lucide/svelte';

	// Constants
	import { AUTH_CONSTANTS } from '$convex/auth.constants';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// Types
	type AuthStep =
		| 'email'
		| 'password-flow'
		| 'email-otp-flow'
		| 'magic-link-flow'
		| 'verify-email'
		| 'success';
	type AuthMethod = 'password' | 'emailOTP' | 'magicLink';

	interface SignInProps {
		onSignIn?: () => void;
		redirectTo?: string;
	}

	let { onSignIn, redirectTo: redirectParam }: SignInProps = $props();

	// State
	let currentStep = $state<AuthStep>('email');
	let email = $state('');
	let submitting = $state(false);
	let availableMethods = $state<AuthMethod[]>([]);
	let isSigningIn = $state(false);
	let passwordMode = $state<'login' | 'register'>('login');
	let otpMode = $state<'login' | 'register'>('login');
	let verifyContext = $state<'emailVerification' | 'magicLink'>('emailVerification');
	let magicAutoSendPending = $state(false);
	let magicLinkSent = $state(false);

	// Auth state
	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);
	const isLoading = $derived(auth.isLoading);

	// Initialize available methods
	$effect(() => {
		const methods: AuthMethod[] = [];
		if (AUTH_CONSTANTS.providers.password) methods.push('password');
		if (AUTH_CONSTANTS.providers.emailOTP) methods.push('emailOTP');
		if (AUTH_CONSTANTS.providers.magicLink) methods.push('magicLink');
		availableMethods = methods;
	});

	// Monitor authentication state and redirect once Convex auth is synchronized
	$effect(() => {
		if (isSigningIn && isAuthenticated && !isLoading) {
			// User has been signed in and Convex auth state has synchronized
			console.log('Convex auth synchronized, redirecting...');
			onSignIn?.();
			handleRedirect();
			submitting = false;
			isSigningIn = false;
		}
	});

	/**
	 * Gets the redirect URL based on redirectTo or current URL params
	 */
	function getRedirectURL(): string | undefined {
		if (redirectParam) return redirectParam;

		const redirectTo = page.url.searchParams.get('redirectTo');
		if (redirectTo) {
			return redirectTo;
		}

		if (page.url.pathname.includes('/signin')) {
			return '/';
		}
	}

	/**
	 * Handles the redirect after successful authentication
	 */
	function handleRedirect(): void {
		const redirectURL = getRedirectURL();
		if (redirectURL) {
			goto(redirectURL);
		}
	}

	/**
	 * Handles successful authentication
	 */
	function handleAuthSuccess(): void {
		// Set flag to monitor auth state instead of immediate redirect
		isSigningIn = true;
	}

	/**
	 * Resets the flow back to email step
	 */
	function resetToEmailStep(): void {
		currentStep = 'email';
		email = '';
		submitting = false;
		isSigningIn = false;
		passwordMode = 'login';
		verifyContext = 'emailVerification';
		magicAutoSendPending = false;
		magicLinkSent = false;
	}

	/**
	 * Handles method selection from email step
	 */
	function handleMethodSelect(method: AuthMethod): void {
		// Navigate to the appropriate step based on method
		switch (method) {
			case 'password':
				currentStep = 'password-flow';
				break;
			case 'emailOTP':
				currentStep = 'email-otp-flow';
				break;
			case 'magicLink':
				currentStep = 'magic-link-flow';
				break;
		}
	}

	/**
	 * Gets the step title based on current step
	 */
	function getStepTitle(): string {
		switch (currentStep) {
			case 'password-flow':
				return passwordMode === 'register'
					? 'Create account with password'
					: 'Sign in with password';
			case 'email-otp-flow':
				return otpMode === 'register'
					? 'Create account with verification code'
					: 'Sign in with verification code';
			case 'magic-link-flow':
				return 'Sign in with magic link';
			default:
				return 'Self hosted Auth in Minutes';
		}
	}

	/**
	 * Gets the step description based on current step
	 */
	function getStepDescription(): string {
		switch (currentStep) {
			case 'password-flow':
				return passwordMode === 'register'
					? 'Create a password to continue.'
					: 'Enter your password to continue.';
			case 'email-otp-flow':
				return 'Enter the verification code we sent to your email address.';
			case 'magic-link-flow':
				return "We'll send a magic link to your email address.";
			default:
				return 'Plug & Play Auth Widgets for your application.';
		}
	}

	/**
	 * Handles social sign-in
	 */
	async function handleSocialSignIn(provider: 'github'): Promise<void> {
		submitting = true;

		try {
			await authClient.signIn.social(
				{
					provider,
					callbackURL: getRedirectURL()
				},
				{
					onSuccess: () => {
						handleAuthSuccess();
					},
					onError: (ctx) => {
						console.error('Social sign-in error:', ctx.error);
						toast.error(ctx.error.message || 'Social sign-in failed. Please try again.');
						submitting = false;
					}
				}
			);
		} catch (error) {
			console.error('Social sign-in error:', error);
			toast.error('Social sign-in failed. Please try again.');
			submitting = false;
		}
	}
</script>

<div class="flex h-full w-full flex-col items-center justify-center">
	<div class="flex h-full w-full max-w-md flex-col p-8">
		{#if currentStep === 'verify-email' || (verifyContext === 'magicLink' && (magicAutoSendPending || magicLinkSent))}
			<div class="flex flex-col items-center gap-4 py-8 text-center">
				<div class="mb-2 flex justify-center">
					<div class="bg-surface-100-900 flex h-16 w-16 items-center justify-center rounded-full">
						<Mail class="text-surface-600-400 size-8" />
					</div>
				</div>
				<h3 class="text-xl font-semibold">Check your email</h3>
				<p class="text-surface-600-400 text-sm">
					{#if verifyContext === 'magicLink'}
						We've sent a magic link to <strong>{email}</strong>.
					{:else}
						We've sent a verification link to <strong>{email}</strong>.
					{/if}
				</p>
				<p class="text-surface-600-400 text-sm">
					{#if verifyContext === 'magicLink'}
						Click the link in your email to sign in instantly.
					{:else}
						Click the link to verify your email. You'll be signed in automatically after
						verification.
					{/if}
				</p>
				<button type="button" class="anchor mt-2 text-center text-sm" onclick={resetToEmailStep}>
					Use a different email
				</button>
			</div>
		{:else}
			<h5 class="h4 max-w-96 text-left leading-9 tracking-tighter">{getStepTitle()}</h5>
			<p class="text-surface-600-400 mt-3 mb-10 max-w-96 text-left text-sm">
				{getStepDescription()}
			</p>

			<div class="flex h-full w-full flex-col gap-8">
				<!-- Social Sign In -->
				{#if AUTH_CONSTANTS.providers.github && currentStep === 'email'}
					<button
						class="btn preset-filled hover:border-surface-600-400 w-full shadow-sm"
						onclick={() => handleSocialSignIn('github')}
						disabled={submitting}
					>
						<SiGithub size={20} />
						Sign in with GitHub
					</button>

					{#if availableMethods.length > 0}
						<div class="relative flex items-center">
							<div class="border-surface-600-400 flex-1 border-t"></div>
							<span class="text-surface-600-400 px-4">OR</span>
							<div class="border-surface-600-400 flex-1 border-t"></div>
						</div>
					{/if}
				{/if}

				<!-- Email-based Auth Methods -->
				{#if availableMethods.length > 0}
					{#if currentStep === 'email'}
						<EmailStep
							{email}
							onEmailChange={(newEmail) => (email = newEmail)}
							onMethodSelect={handleMethodSelect}
							{submitting}
							{availableMethods}
						/>
					{:else if currentStep === 'password-flow'}
						<PasswordFlow
							{email}
							onSuccess={handleAuthSuccess}
							onBack={resetToEmailStep}
							{submitting}
							onSubmittingChange={(value) => (submitting = value)}
							onModeChange={(m) => (passwordMode = m)}
							onVerifyEmail={() => {
								currentStep = 'verify-email';
								verifyContext = 'emailVerification';
								isSigningIn = true;
							}}
						/>
					{:else if currentStep === 'email-otp-flow'}
						<EmailOtpFlow
							{email}
							onSuccess={handleAuthSuccess}
							onBack={resetToEmailStep}
							{submitting}
							onSubmittingChange={(value) => (submitting = value)}
							onModeChange={(m) => (otpMode = m)}
						/>
					{:else if currentStep === 'magic-link-flow'}
						<MagicLinkFlow
							{email}
							onBack={resetToEmailStep}
							{submitting}
							onSubmittingChange={(value) => (submitting = value)}
							callbackURL={getRedirectURL() || '/'}
							onLinkSent={() => {
								verifyContext = 'magicLink';
								magicLinkSent = true;
								isSigningIn = true;
							}}
							onAutoSendChange={(pending) => {
								if (pending) {
									verifyContext = 'magicLink';
									magicAutoSendPending = true;
								} else {
									magicAutoSendPending = false;
								}
							}}
						/>
					{/if}
				{/if}
			</div>

			<div>
				<p class="text-surface-600-400 mt-10 text-xs">
					By continuing, you agree to our
					<a href={AUTH_CONSTANTS.terms} class="anchor text-surface-950-50">Terms</a>
					and
					<a href={AUTH_CONSTANTS.privacy} class="anchor text-surface-950-50">Privacy Policies</a>
				</p>
			</div>
		{/if}
	</div>
</div>
