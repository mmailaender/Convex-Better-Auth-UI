<script lang="ts">
	// UI
	import { toast } from 'svelte-sonner';

	// Icons
	import { SiGithub, SiGoogle, SiFacebook, SiApple } from '@icons-pack/svelte-simple-icons';

	// API
	import { authClient } from '$lib/auth/api/auth-client';

	// Constants
	import { AUTH_CONSTANTS } from '$convex/auth.constants';

	type Provider = 'github' | 'google' | 'facebook' | 'apple';

	interface SocialFlowProps {
		onSuccess?: () => void;
		onSubmittingChange?: (value: boolean) => void;
		callbackURL?: string;
		// Whether to render the section (typically only on the email step)
		show?: boolean;
		// If true, render an "or" divider after the buttons (when at least one provider is shown)
		dividerAfter?: boolean;
		class?: string;
	}

	let {
		onSuccess,
		onSubmittingChange,
		callbackURL,
		show = true,
		dividerAfter = false,
		class: className
	}: SocialFlowProps = $props();

	// Local submitting state (kept in sync with parent via onSubmittingChange)
	let submitting = $state(false);

	const enabledProviders = $derived({
		github: Boolean(AUTH_CONSTANTS.providers.github),
		google: Boolean(AUTH_CONSTANTS.providers.google),
		facebook: Boolean(AUTH_CONSTANTS.providers.facebook),
		apple: Boolean(AUTH_CONSTANTS.providers.apple)
	});

	// Build a normalized list of active providers with icon and label
	const activeProviders = $derived.by(() => {
		const list: Array<{ id: Provider; label: string; Icon: typeof SiGithub }> = [];
		if (enabledProviders.github)
			list.push({ id: 'github', label: 'Sign in with GitHub', Icon: SiGithub });
		if (enabledProviders.google)
			list.push({ id: 'google', label: 'Sign in with Google', Icon: SiGoogle });
		if (enabledProviders.facebook)
			list.push({ id: 'facebook', label: 'Sign in with Facebook', Icon: SiFacebook });
		if (enabledProviders.apple)
			list.push({ id: 'apple', label: 'Sign in with Apple', Icon: SiApple });
		return list;
	});

	const hasAnyProvider = $derived(activeProviders.length > 0);

	async function handleSocialSignIn(provider: Provider): Promise<void> {
		submitting = true;
		onSubmittingChange?.(true);

		try {
			await authClient.signIn.social(
				{
					provider,
					callbackURL
				},
				{
					onSuccess: () => {
						onSuccess?.();
					},
					onError: (ctx) => {
						console.error('Social sign-in error:', ctx.error);
						toast.error(ctx.error.message || 'Social sign-in failed. Please try again.');
						submitting = false;
						onSubmittingChange?.(false);
					}
				}
			);
		} catch (error) {
			console.error('Social sign-in error:', error);
			toast.error('Social sign-in failed. Please try again.');
			submitting = false;
			onSubmittingChange?.(false);
		}
	}
</script>

{#if show && hasAnyProvider}
	<div class={'flex flex-col gap-3 ' + (className ?? '')}>
		{#each activeProviders as p (p.id)}
			<button
				class="btn preset-outlined-surface-400-600 hover:border-surface-600-400 w-full"
				onclick={() => handleSocialSignIn(p.id)}
				disabled={submitting}
			>
				{#if submitting}
					<div class="flex items-center gap-2">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						></div>
						Signing in...
					</div>
				{:else}
					<p.Icon size={16} />
					{p.label}
				{/if}
			</button>
		{/each}

		{#if dividerAfter}
			<div class="relative flex items-center px-1">
				<div class="border-surface-600-400/30 flex-1 border-t"></div>
				<span class="text-surface-500 px-2 text-xs">or</span>
				<div class="border-surface-600-400/30 flex-1 border-t"></div>
			</div>
		{/if}
	</div>
{/if}
