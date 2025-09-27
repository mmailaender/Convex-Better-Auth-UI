<script lang="ts">
	// UI
	import { toast } from 'svelte-sonner';

	// Icons
	import {
		SiGithub,
		SiGoogle,
		SiFacebook,
		SiApple,
		SiAtlassian,
		SiDiscord,
		SiFigma,
		SiLine,
		SiHuggingface,
		SiKakao,
		SiKick,
		SiPaypal,
		SiSalesforce,
		SiSlack,
		SiNotion,
		SiNaver,
		SiTiktok,
		SiTwitch,
		SiX,
		SiDropbox,
		SiLinear,
		SiGitlab,
		SiReddit,
		SiRoblox,
		SiSpotify,
		SiVk,
		SiZoom
	} from '@icons-pack/svelte-simple-icons';

	// API
	import { authClient } from '$lib/auth/api/auth-client';

	// Constants
	import { AUTH_CONSTANTS } from '$convex/auth.constants';

	type Provider =
		| 'github'
		| 'google'
		| 'facebook'
		| 'apple'
		| 'atlassian'
		| 'discord'
		| 'figma'
		| 'line'
		| 'huggingface'
		| 'kakao'
		| 'kick'
		| 'paypal'
		| 'salesforce'
		| 'slack'
		| 'notion'
		| 'naver'
		| 'tiktok'
		| 'twitch'
		| 'x'
		| 'dropbox'
		| 'linear'
		| 'gitlab'
		| 'reddit'
		| 'roblox'
		| 'spotify'
		| 'vk'
		| 'zoom';

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
	let submittingProvider: Provider | null = $state(null);

	// Build a normalized list of active providers with icon and label
	// NOTE: We reference AUTH_CONSTANTS directly so bundlers can tree-shake
	// branches and drop unused icon imports at build time.
	const activeProviders: Array<{ id: Provider; label: string; Icon: typeof SiGithub }> = [];
	if (AUTH_CONSTANTS.providers.github)
		activeProviders.push({ id: 'github', label: 'Sign in with GitHub', Icon: SiGithub });
	if (AUTH_CONSTANTS.providers.google)
		activeProviders.push({ id: 'google', label: 'Sign in with Google', Icon: SiGoogle });
	if (AUTH_CONSTANTS.providers.facebook)
		activeProviders.push({ id: 'facebook', label: 'Sign in with Facebook', Icon: SiFacebook });
	if (AUTH_CONSTANTS.providers.apple)
		activeProviders.push({ id: 'apple', label: 'Sign in with Apple', Icon: SiApple });
	if (AUTH_CONSTANTS.providers.atlassian)
		activeProviders.push({ id: 'atlassian', label: 'Sign in with Atlassian', Icon: SiAtlassian });
	if (AUTH_CONSTANTS.providers.discord)
		activeProviders.push({ id: 'discord', label: 'Sign in with Discord', Icon: SiDiscord });
	if (AUTH_CONSTANTS.providers.figma)
		activeProviders.push({ id: 'figma', label: 'Sign in with Figma', Icon: SiFigma });
	if (AUTH_CONSTANTS.providers.line)
		activeProviders.push({ id: 'line', label: 'Sign in with Line', Icon: SiLine });
	if (AUTH_CONSTANTS.providers.huggingface)
		activeProviders.push({
			id: 'huggingface',
			label: 'Sign in with Hugging Face',
			Icon: SiHuggingface
		});
	if (AUTH_CONSTANTS.providers.kakao)
		activeProviders.push({ id: 'kakao', label: 'Sign in with Kakao', Icon: SiKakao });
	if (AUTH_CONSTANTS.providers.kick)
		activeProviders.push({ id: 'kick', label: 'Sign in with Kick', Icon: SiKick });
	if (AUTH_CONSTANTS.providers.paypal)
		activeProviders.push({ id: 'paypal', label: 'Sign in with PayPal', Icon: SiPaypal });
	if (AUTH_CONSTANTS.providers.salesforce)
		activeProviders.push({
			id: 'salesforce',
			label: 'Sign in with Salesforce',
			Icon: SiSalesforce
		});
	if (AUTH_CONSTANTS.providers.slack)
		activeProviders.push({ id: 'slack', label: 'Sign in with Slack', Icon: SiSlack });
	if (AUTH_CONSTANTS.providers.notion)
		activeProviders.push({ id: 'notion', label: 'Sign in with Notion', Icon: SiNotion });
	if (AUTH_CONSTANTS.providers.naver)
		activeProviders.push({ id: 'naver', label: 'Sign in with Naver', Icon: SiNaver });
	if (AUTH_CONSTANTS.providers.tiktok)
		activeProviders.push({ id: 'tiktok', label: 'Sign in with TikTok', Icon: SiTiktok });
	if (AUTH_CONSTANTS.providers.twitch)
		activeProviders.push({ id: 'twitch', label: 'Sign in with Twitch', Icon: SiTwitch });
	if (AUTH_CONSTANTS.providers.x)
		activeProviders.push({ id: 'x', label: 'Sign in with X', Icon: SiX });
	if (AUTH_CONSTANTS.providers.dropbox)
		activeProviders.push({ id: 'dropbox', label: 'Sign in with Dropbox', Icon: SiDropbox });
	if (AUTH_CONSTANTS.providers.linear)
		activeProviders.push({ id: 'linear', label: 'Sign in with Linear', Icon: SiLinear });
	if (AUTH_CONSTANTS.providers.gitlab)
		activeProviders.push({ id: 'gitlab', label: 'Sign in with GitLab', Icon: SiGitlab });
	if (AUTH_CONSTANTS.providers.reddit)
		activeProviders.push({ id: 'reddit', label: 'Sign in with Reddit', Icon: SiReddit });
	if (AUTH_CONSTANTS.providers.roblox)
		activeProviders.push({ id: 'roblox', label: 'Sign in with Roblox', Icon: SiRoblox });
	if (AUTH_CONSTANTS.providers.spotify)
		activeProviders.push({ id: 'spotify', label: 'Sign in with Spotify', Icon: SiSpotify });
	if (AUTH_CONSTANTS.providers.vk)
		activeProviders.push({ id: 'vk', label: 'Sign in with VK', Icon: SiVk });
	if (AUTH_CONSTANTS.providers.zoom)
		activeProviders.push({ id: 'zoom', label: 'Sign in with Zoom', Icon: SiZoom });

	const hasAnyProvider = activeProviders.length > 0;

	async function handleSocialSignIn(provider: Provider): Promise<void> {
		submittingProvider = provider;
		onSubmittingChange?.(true);

		try {
			await authClient.signIn.social(
				{ provider, callbackURL },
				{
					onSuccess: () => {
						onSuccess?.();
					},
					onError: (ctx) => {
						console.error('Social sign-in error:', ctx.error);
						toast.error(ctx.error.message || 'Social sign-in failed. Please try again.');
						submittingProvider = null;
						onSubmittingChange?.(false);
					}
				}
			);
		} catch (error) {
			console.error('Social sign-in error:', error);
			toast.error('Social sign-in failed. Please try again.');
			submittingProvider = null;
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
				disabled={!!submittingProvider}
				aria-busy={submittingProvider === p.id}
			>
				{#if submittingProvider === p.id}
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
