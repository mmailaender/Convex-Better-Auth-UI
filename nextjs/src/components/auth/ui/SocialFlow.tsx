'use client';

import { useMemo, useState } from 'react';
import {
	SiApple,
	SiAtlassian,
	SiDiscord,
	SiDropbox,
	SiFacebook,
	SiFigma,
	SiGithub,
	SiGitlab,
	SiGoogle,
	SiHuggingface,
	SiKakao,
	SiKick,
	SiLine,
	SiLinear,
	SiNaver,
	SiNotion,
	SiPaypal,
	SiReddit,
	SiRoblox,
	SiSpotify,
	SiTiktok,
	SiTwitch,
	SiVk,
	SiX,
	SiZoom
} from '@icons-pack/react-simple-icons';
import { SiSalesforce, SiSlack } from '@/components/primitives/ui/brand-icons';
import { toast } from 'sonner';

import { AUTH_CONSTANTS } from '@/convex/auth.constants';
import { authClient } from '@/lib/auth/api/auth-client';
import { cn } from '@/lib/utils';

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

type ProviderConfig = {
	id: Provider;
	label: string;
	Icon: React.ComponentType<{ className?: string; size?: number }>;
};

type SocialFlowProps = {
	onSuccess?: () => void;
	onSubmittingChange?: (value: boolean) => void;
	callbackURL?: string;
	show?: boolean;
	dividerAfter?: boolean;
	className?: string;
};

const providerConfigs: ProviderConfig[] = [
	{ id: 'github', label: 'Sign in with GitHub', Icon: SiGithub },
	{ id: 'google', label: 'Sign in with Google', Icon: SiGoogle },
	{ id: 'facebook', label: 'Sign in with Facebook', Icon: SiFacebook },
	{ id: 'apple', label: 'Sign in with Apple', Icon: SiApple },
	{ id: 'atlassian', label: 'Sign in with Atlassian', Icon: SiAtlassian },
	{ id: 'discord', label: 'Sign in with Discord', Icon: SiDiscord },
	{ id: 'figma', label: 'Sign in with Figma', Icon: SiFigma },
	{ id: 'line', label: 'Sign in with Line', Icon: SiLine },
	{ id: 'huggingface', label: 'Sign in with Hugging Face', Icon: SiHuggingface },
	{ id: 'kakao', label: 'Sign in with Kakao', Icon: SiKakao },
	{ id: 'kick', label: 'Sign in with Kick', Icon: SiKick },
	{ id: 'paypal', label: 'Sign in with PayPal', Icon: SiPaypal },
	{ id: 'salesforce', label: 'Sign in with Salesforce', Icon: SiSalesforce },
	{ id: 'slack', label: 'Sign in with Slack', Icon: SiSlack },
	{ id: 'notion', label: 'Sign in with Notion', Icon: SiNotion },
	{ id: 'naver', label: 'Sign in with Naver', Icon: SiNaver },
	{ id: 'tiktok', label: 'Sign in with TikTok', Icon: SiTiktok },
	{ id: 'twitch', label: 'Sign in with Twitch', Icon: SiTwitch },
	{ id: 'twitter', label: 'Sign in with X', Icon: SiX },
	{ id: 'dropbox', label: 'Sign in with Dropbox', Icon: SiDropbox },
	{ id: 'linear', label: 'Sign in with Linear', Icon: SiLinear },
	{ id: 'gitlab', label: 'Sign in with GitLab', Icon: SiGitlab },
	{ id: 'reddit', label: 'Sign in with Reddit', Icon: SiReddit },
	{ id: 'roblox', label: 'Sign in with Roblox', Icon: SiRoblox },
	{ id: 'spotify', label: 'Sign in with Spotify', Icon: SiSpotify },
	{ id: 'vk', label: 'Sign in with VK', Icon: SiVk },
	{ id: 'zoom', label: 'Sign in with Zoom', Icon: SiZoom }
];

export function SocialFlow({
	onSuccess,
	onSubmittingChange,
	callbackURL,
	show = true,
	dividerAfter = false,
	className
}: SocialFlowProps) {
	const [submittingProvider, setSubmittingProvider] = useState<Provider | null>(null);

	const activeProviders = useMemo(() => {
		return providerConfigs.filter((provider) => {
			if (provider.id === 'twitter') return AUTH_CONSTANTS.providers.x;
			return (
				AUTH_CONSTANTS.providers[provider.id as keyof typeof AUTH_CONSTANTS.providers] === true
			);
		});
	}, []);

	async function handleSocialSignIn(provider: Provider) {
		setSubmittingProvider(provider);
		onSubmittingChange?.(true);

		try {
			await authClient.signIn.social(
				{ provider, callbackURL },
				{
					onSuccess: () => {
						onSuccess?.();
					},
					onError: (ctx) => {
						console.error('Social sign in error:', ctx.error);
						toast.error(ctx.error.message || 'Social sign in failed. Please try again.');
						setSubmittingProvider(null);
						onSubmittingChange?.(false);
					}
				}
			);
		} catch (error) {
			console.error('Social sign in error:', error);
			toast.error('Social sign in failed. Please try again.');
			setSubmittingProvider(null);
			onSubmittingChange?.(false);
		}
	}

	if (!show || activeProviders.length === 0) return null;

	return (
		<div className={cn('flex flex-col gap-3', className)}>
			{activeProviders.map(({ id, label, Icon }) => (
				<button
					key={id}
					type="button"
					className="btn preset-outlined-surface-400-600 hover:border-surface-600-400 w-full"
					onClick={() => void handleSocialSignIn(id)}
					disabled={submittingProvider !== null}
					aria-busy={submittingProvider === id}
				>
					{submittingProvider === id ? (
						<div className="flex items-center gap-2">
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
							Signing in...
						</div>
					) : (
						<>
							<Icon className="size-4" size={16} />
							{label}
						</>
					)}
				</button>
			))}

			{dividerAfter ? (
				<div className="relative flex items-center px-1">
					<div className="border-surface-600-400/30 flex-1 border-t" />
					<span className="text-surface-500 px-2 text-xs">or</span>
					<div className="border-surface-600-400/30 flex-1 border-t" />
				</div>
			) : null}
		</div>
	);
}
