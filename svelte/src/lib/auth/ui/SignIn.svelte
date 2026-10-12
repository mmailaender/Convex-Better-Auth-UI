<script lang="ts">
	// Sveltekit
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	// Svelte
	import { toast } from 'svelte-sonner';

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
	import { cn } from '#lib/primitives/utils.js';
	import { safeRedirect } from '#lib/auth/utils/safeRedirect.js';
	import {
		resolveSignInCallbackURL,
		resolveSignInRedirect
	} from '#lib/auth/utils/signInRedirect.js';

	// Context
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	const { authConstants, authClient } = getAuthContext();

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
	let redirectInProgress = $state(false);
	let passwordMode = $state<'login' | 'register'>('login');
	let otpMode = $state<'login' | 'register'>('login');
	let verifyContext = $state<'emailVerification' | 'magicLink'>('emailVerification');
	let magicLinkSent = $state(false);
	let emailExistsRef = $state(false);

	// Auth state
	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);
	const isLoading = $derived(auth.isLoading);

	// Initialize available methods
	$effect(() => {
		const methods: EmailAuthMethod[] = [];
		if (authConstants.providers.password) methods.push('password');
		if (authConstants.providers.emailOTP && authConstants.sendEmails) methods.push('emailOTP');
		if (authConstants.providers.magicLink && authConstants.sendEmails) methods.push('magicLink');
		availableEmailMethods = methods;
	});

	// Legal links (handle empty/null/undefined gracefully)
	const termsUrl = $derived((authConstants.terms ?? '').trim());
	const privacyUrl = $derived((authConstants.privacy ?? '').trim());
	const showTerms = $derived(Boolean(termsUrl));
	const showPrivacy = $derived(Boolean(privacyUrl));
	const showLegal = $derived(showTerms || showPrivacy);
	const brandName = $derived((authConstants.brandName ?? 'self hosted Auth').trim());
	const brandTagline = $derived(
		(authConstants.brandTagline ?? 'Plug & Play Auth Widgets for your application.').trim()
	);

	// Monitor authentication state and redirect once Convex auth is synchronized
	$effect(() => {
		if (isAuthenticated && !isLoading && isSigningIn && !redirectInProgress) {
			redirectInProgress = true;
			// Always close the dialog when authenticated
			onSignIn?.();
			console.log('Convex auth synchronized, redirecting...');
			void finalizeSignIn();
		}
	});

	/**
	 * Gets the redirect URL based on redirectTo or current URL params
	 */
	function getRedirectURL(): string | undefined {
		return resolveSignInRedirect(redirectParam, page.url);
	}

	/**
	 * Absolute same-origin callback URL for Better Auth flows that leave the page
	 */
	function getCallbackURL(): string {
		return (
			page.url.origin +
			safeRedirect(resolveSignInCallbackURL(redirectParam, page.url), '/', page.url.origin)
		);
	}

	/**
	 * Handles the redirect after successful authentication; a target on another host goes home
	 */
	async function handleRedirect(): Promise<void> {
		const redirectURL = getRedirectURL();
		if (!redirectURL) return;

		// eslint-disable-next-line svelte/no-navigation-without-resolve -- safeRedirect returns a same-origin path; resolve() would read [name] in its query as a route parameter and collapse // in its hash
		await goto(safeRedirect(redirectURL, '/', page.url.origin), { invalidateAll: true });
	}

	/**
	 * Completes sign-in by keeping the loading UI active until navigation fully settles
	 */
	async function finalizeSignIn(): Promise<void> {
		try {
			await handleRedirect();
		} catch (error) {
			console.error('Sign-in redirect failed:', error);
		} finally {
			submitting = false;
			isSigningIn = false;
			redirectInProgress = false;
		}
	}

	/**
	 * Handles successful authentication
	 */
	function handleAuthSuccess(): void {
		// Set flag to monitor auth state instead of immediate redirect
		submitting = true;
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
		redirectInProgress = false;
		passwordMode = 'login';
		otpMode = 'login';
		verifyContext = 'emailVerification';
		magicLinkSent = false;
		emailExistsRef = false;
	}

	/**
	 * Handles method selection from email step
	 */
	async function handleMethodSelect(method: EmailAuthMethod, emailExists: boolean): Promise<void> {
		emailExistsRef = emailExists;

		// Existing user + magic link: send directly, skip MagicLinkFlow UI
		if (method === 'magicLink' && emailExists) {
			await authClient.signIn.magicLink(
				{
					email,
					callbackURL: getCallbackURL(),
					errorCallbackURL: '/signin?error=magic-link-failed'
				},
				{
					onSuccess: () => {
						verifyContext = 'magicLink';
						magicLinkSent = true;
						isSigningIn = true;
						toast.success('Magic link sent to your email!');
					},
					onError: (ctx) => {
						console.error('Magic link send error:', ctx.error);
						toast.error(ctx.error.message || 'Failed to send magic link. Please try again.');
					}
				}
			);
			return;
		}

		// Email OTP: send OTP directly while EmailStep button shows "Sending..."
		if (method === 'emailOTP') {
			let otpSendSuccess = false;
			await authClient.emailOtp.sendVerificationOtp(
				{ email, type: 'sign-in' },
				{
					onSuccess: () => {
						otpSendSuccess = true;
						toast.success('Verification code sent to your email!');
					},
					onError: (ctx) => {
						console.error('OTP send error:', ctx.error);
						toast.error(ctx.error.message || 'Failed to send verification code. Please try again.');
					}
				}
			);
			if (otpSendSuccess) {
				otpMode = emailExists ? 'login' : 'register';
				currentStep = 'email-otp-flow';
			}
			return;
		}

		// Navigate to the appropriate step based on method
		switch (method) {
			case 'password':
				passwordMode = emailExists ? 'login' : 'register';
				currentStep = 'password-flow';
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
				return `Sign in into ${brandName}`;
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
				return brandTagline;
		}
	}

	// Reset function that an external component can call
	export function reset() {
		resetToEmailStep();
	}

	// If the current step is no longer valid for the current config,
	// snap back to the email step so the UI always has something to render
	$effect(() => {
		const set = new Set(availableEmailMethods);

		const isPassword = currentStep === 'password-flow';
		const isOtp = currentStep === 'email-otp-flow';
		const isMagic = currentStep === 'magic-link-flow';
		const isVerifyEmail = currentStep === 'verify-email';

		// no email sending → no verify/magic/otp screens
		if (!authConstants.sendEmails && (isVerifyEmail || isMagic || isOtp)) {
			resetToEmailStep();
			return;
		}

		// step-specific availability checks
		if (isPassword && !set.has('password')) resetToEmailStep();
		if (isOtp && !set.has('emailOTP')) resetToEmailStep();
		if (isMagic && !set.has('magicLink')) resetToEmailStep();
	});
</script>

<div class={cn('mx-auto flex h-full w-full max-w-md flex-col justify-center p-4 pb-8', className)}>
	{#if authConstants.sendEmails && (currentStep === 'verify-email' || (verifyContext === 'magicLink' && magicLinkSent))}
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
				callbackURL={getCallbackURL()}
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
						emailExists={emailExistsRef}
						onSuccess={handleAuthSuccess}
						onBack={resetToEmailStep}
						{submitting}
						onSubmittingChange={(value) => (submitting = value)}
						callbackURL={getCallbackURL()}
						onVerifyEmail={() => {
							currentStep = 'verify-email';
							verifyContext = 'emailVerification';
							isSigningIn = true;
						}}
					/>
				{:else if currentStep === 'email-otp-flow'}
					<EmailOtpFlow
						{email}
						emailExists={emailExistsRef}
						onSuccess={handleAuthSuccess}
						onBack={resetToEmailStep}
						{submitting}
						onSubmittingChange={(value) => (submitting = value)}
					/>
				{:else if currentStep === 'magic-link-flow'}
					<MagicLinkFlow
						{email}
						onBack={resetToEmailStep}
						{submitting}
						onSubmittingChange={(value) => (submitting = value)}
						callbackURL={getCallbackURL()}
						onLinkSent={() => {
							verifyContext = 'magicLink';
							magicLinkSent = true;
							isSigningIn = true;
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
						<a href={termsUrl} rel="external noreferrer" class="anchor text-surface-950-50">Terms</a
						>
					{/if}
					{#if showTerms && showPrivacy}
						and
					{/if}
					{#if showPrivacy}
						<a href={privacyUrl} rel="external noreferrer" class="anchor text-surface-950-50"
							>Privacy Policies</a
						>
					{/if}
				</p>
			</div>
		{/if}
	{/if}
</div>
