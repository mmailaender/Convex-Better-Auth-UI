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

	// Context
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	const { authClient, authConstants } = getAuthContext();

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
		| 'twitter'
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
	// NOTE: We reference authConstants directly so bundlers can tree-shake
	// branches and drop unused icon imports at build time.
	const activeProviders: Array<{ id: Provider; label: string; Icon: typeof SiGithub }> = [];
	if (authConstants.providers.github)
		activeProviders.push({ id: 'github', label: 'Sign in with GitHub', Icon: SiGithub });
	if (authConstants.providers.google)
		activeProviders.push({ id: 'google', label: 'Sign in with Google', Icon: SiGoogle });
	if (authConstants.providers.facebook)
		activeProviders.push({ id: 'facebook', label: 'Sign in with Facebook', Icon: SiFacebook });
	if (authConstants.providers.apple)
		activeProviders.push({ id: 'apple', label: 'Sign in with Apple', Icon: SiApple });
	if (authConstants.providers.atlassian)
		activeProviders.push({ id: 'atlassian', label: 'Sign in with Atlassian', Icon: SiAtlassian });
	if (authConstants.providers.discord)
		activeProviders.push({ id: 'discord', label: 'Sign in with Discord', Icon: SiDiscord });
	if (authConstants.providers.figma)
		activeProviders.push({ id: 'figma', label: 'Sign in with Figma', Icon: SiFigma });
	if (authConstants.providers.line)
		activeProviders.push({ id: 'line', label: 'Sign in with Line', Icon: SiLine });
	if (authConstants.providers.huggingface)
		activeProviders.push({
			id: 'huggingface',
			label: 'Sign in with Hugging Face',
			Icon: SiHuggingface
		});
	if (authConstants.providers.kakao)
		activeProviders.push({ id: 'kakao', label: 'Sign in with Kakao', Icon: SiKakao });
	if (authConstants.providers.kick)
		activeProviders.push({ id: 'kick', label: 'Sign in with Kick', Icon: SiKick });
	if (authConstants.providers.paypal)
		activeProviders.push({ id: 'paypal', label: 'Sign in with PayPal', Icon: SiPaypal });
	if (authConstants.providers.salesforce)
		activeProviders.push({
			id: 'salesforce',
			label: 'Sign in with Salesforce',
			Icon: SiSalesforce
		});
	if (authConstants.providers.slack)
		activeProviders.push({ id: 'slack', label: 'Sign in with Slack', Icon: SiSlack });
	if (authConstants.providers.notion)
		activeProviders.push({ id: 'notion', label: 'Sign in with Notion', Icon: SiNotion });
	if (authConstants.providers.naver)
		activeProviders.push({ id: 'naver', label: 'Sign in with Naver', Icon: SiNaver });
	if (authConstants.providers.tiktok)
		activeProviders.push({ id: 'tiktok', label: 'Sign in with TikTok', Icon: SiTiktok });
	if (authConstants.providers.twitch)
		activeProviders.push({ id: 'twitch', label: 'Sign in with Twitch', Icon: SiTwitch });
	if (authConstants.providers.x)
		activeProviders.push({ id: 'twitter', label: 'Sign in with X', Icon: SiX });
	if (authConstants.providers.dropbox)
		activeProviders.push({ id: 'dropbox', label: 'Sign in with Dropbox', Icon: SiDropbox });
	if (authConstants.providers.linear)
		activeProviders.push({ id: 'linear', label: 'Sign in with Linear', Icon: SiLinear });
	if (authConstants.providers.gitlab)
		activeProviders.push({ id: 'gitlab', label: 'Sign in with GitLab', Icon: SiGitlab });
	if (authConstants.providers.reddit)
		activeProviders.push({ id: 'reddit', label: 'Sign in with Reddit', Icon: SiReddit });
	if (authConstants.providers.roblox)
		activeProviders.push({ id: 'roblox', label: 'Sign in with Roblox', Icon: SiRoblox });
	if (authConstants.providers.spotify)
		activeProviders.push({ id: 'spotify', label: 'Sign in with Spotify', Icon: SiSpotify });
	if (authConstants.providers.vk)
		activeProviders.push({ id: 'vk', label: 'Sign in with VK', Icon: SiVk });
	if (authConstants.providers.zoom)
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
