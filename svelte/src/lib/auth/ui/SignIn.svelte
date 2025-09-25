<script lang="ts">
	// API
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// Components
	import EmailStep from './EmailStep.svelte';
	import PasswordFlow from './PasswordFlow.svelte';
	import EmailOtpFlow from './EmailOtpFlow.svelte';
	import MagicLinkFlow from './MagicLinkFlow.svelte';
	import SocialFlow from './SocialFlow.svelte';
	// Icons
	import MailIcon from '@lucide/svelte/icons/mail';

	// Utils
	import { cn } from '$lib/primitives/utils';

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
	type EmailAuthMethod = 'password' | 'emailOTP' | 'magicLink';

	interface SignInProps {
		onSignIn?: () => void;
		redirectTo?: string;
		class?: string;
	}

	let { onSignIn, redirectTo: redirectParam, class: className }: SignInProps = $props();

	// State
	let currentStep = $state<AuthStep>('email');
	let email = $state('');
	let submitting = $state(false);
	let availableEmailMethods = $state<EmailAuthMethod[]>([]);
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
		const methods: EmailAuthMethod[] = [];
		if (AUTH_CONSTANTS.providers.password) methods.push('password');
		if (AUTH_CONSTANTS.providers.emailOTP && AUTH_CONSTANTS.sendEmails) methods.push('emailOTP');
		if (AUTH_CONSTANTS.providers.magicLink && AUTH_CONSTANTS.sendEmails) methods.push('magicLink');
		availableEmailMethods = methods;
	});

	// Legal links (handle empty/null/undefined gracefully)
	const termsUrl = $derived((AUTH_CONSTANTS.terms ?? '').trim());
	const privacyUrl = $derived((AUTH_CONSTANTS.privacy ?? '').trim());
	const showTerms = $derived(Boolean(termsUrl));
	const showPrivacy = $derived(Boolean(privacyUrl));
	const showLegal = $derived(showTerms || showPrivacy);

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
	function handleMethodSelect(method: EmailAuthMethod): void {
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
				return 'Sign in into self hosted Auth';
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
</script>

<div class={cn('mx-auto flex h-full w-full max-w-md flex-col justify-center p-4 pb-8', className)}>
	{#if currentStep === 'verify-email' || (verifyContext === 'magicLink' && (magicAutoSendPending || magicLinkSent))}
		<div class="flex flex-col">
			<!-- Circle -->
			<div class="mb-4 flex">
				<div class="bg-surface-200-800 flex h-16 w-16 items-center justify-center rounded-full">
					<MailIcon class="text-surface-600-400 size-8" />
				</div>
			</div>

			<!-- Info -->
			<h3 class="h5 w-full text-left leading-8">Check your email</h3>
			<p class="text-surface-600-400 mt-2 text-sm">
				{#if verifyContext === 'magicLink'}
					We've sent a magic link to <strong>{email}</strong>.
				{:else}
					We've sent a verification link to <strong>{email}</strong>.
				{/if}
			</p>
			<p class="text-surface-600-400 pb-8 text-sm">
				{#if verifyContext === 'magicLink'}
					Click the link in your email to sign in instantly.
				{:else}
					Click the link to verify your email. You'll be signed in automatically after verification.
				{/if}
			</p>

			<!-- Action -->
			<button type="button" class="btn preset-filled-surface-300-700" onclick={resetToEmailStep}>
				Use a different email
			</button>
		</div>
	{:else}
		<h5 class="h5 w-full text-left leading-8">{getStepTitle()}</h5>
		<p class="text-surface-600-400 mt-2 max-w-96 pb-16 text-left text-sm sm:pb-12">
			{getStepDescription()}
		</p>

		<div class="flex h-full w-full flex-col gap-6">
			<!-- Social Sign In -->
			<SocialFlow
				show={currentStep === 'email'}
				onSuccess={handleAuthSuccess}
				onSubmittingChange={(value) => (submitting = value)}
				callbackURL={getRedirectURL() || '/'}
				dividerAfter={availableEmailMethods.length > 0}
			/>

			<!-- Email-based Auth Methods -->
			{#if availableEmailMethods.length > 0}
				{#if currentStep === 'email'}
					<EmailStep
						{email}
						onEmailChange={(newEmail) => (email = newEmail)}
						onMethodSelect={handleMethodSelect}
						{submitting}
						availableMethods={availableEmailMethods}
					/>
				{:else if currentStep === 'password-flow'}
					<PasswordFlow
						{email}
						onSuccess={handleAuthSuccess}
						onBack={resetToEmailStep}
						{submitting}
						onSubmittingChange={(value) => (submitting = value)}
						onModeChange={(m) => (passwordMode = m)}
						callbackURL={getRedirectURL() || '/'}
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

		{#if showLegal}
			<div>
				<p class="text-surface-600-400 mt-10 text-xs">
					By continuing, you agree to our
					{#if showTerms}
						<a href={termsUrl} class="anchor text-surface-950-50">Terms</a>
					{/if}
					{#if showTerms && showPrivacy}
						and
					{/if}
					{#if showPrivacy}
						<a href={privacyUrl} class="anchor text-surface-950-50">Privacy Policies</a>
					{/if}
				</p>
			</div>
		{/if}
	{/if}
</div>
