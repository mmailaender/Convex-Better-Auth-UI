<script lang="ts">
	// Svelte
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';

	// Constants
	import { AUTH_CONSTANTS } from '$convex/auth.constants';

	// UI Components
	// Primitives
	import * as Select from '$lib/primitives/ui/select';
	import { createListCollection } from '@ark-ui/svelte/select';
	import * as Dialog from '$lib/primitives/ui/dialog';
	import * as Drawer from '$lib/primitives/ui/drawer';
	import * as Password from '$lib/primitives/ui/password';
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
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import LockIcon from '@lucide/svelte/icons/lock';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	// Utils
	import { useMobileState } from '$lib/primitives/utils/mobileState.svelte';
	const mobileState = useMobileState();
	import { isEditableElement, scheduleScrollIntoView } from '$lib/primitives/utils/focusScroll';

	// API
	import { api } from '$convex/_generated/api';
	import { authClient } from '$lib/auth/api/auth-client';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { ConvexError } from 'convex/values';
	const client = useConvexClient();

	// Types
	import type { FunctionReturnType } from 'convex/server';
	type ListAccountsType = FunctionReturnType<typeof api.users.queries.listAccounts>;

	let { initialData }: { initialData?: { accountList?: ListAccountsType } } = $props();

	// Auth
	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);

	let accountListResponse = $derived(
		isAuthenticated
			? useQuery(api.users.queries.listAccounts, {}, { initialData: initialData?.accountList })
			: undefined
	);
	let accountList = $derived(accountListResponse?.data ?? initialData?.accountList);

	// State for linking accounts
	let isLinking = $state(false);
	let unlinkingAccountId = $state<string | null>(null);

	// State for password dialog/drawer
	let isPasswordDialogOpen = $state(false);
	let isPasswordDrawerOpen = $state(false);
	let password = $state('');
	let isSettingPassword = $state(false);

	// State for change password (inline editing)
	let isEditingPasswordInline: boolean = $state(false);
	let currentPassword = $state('');
	let newPassword = $state('');
	let isChangingPassword = $state(false);
	let currentPasswordInputEl: HTMLInputElement | null = $state(null);
	let isMobile = $derived(mobileState.isMobile);

	// Auto-scroll inline Update Password form into view on mobile when opened
	$effect(() => {
		if (isMobile && isEditingPasswordInline && currentPasswordInputEl) {
			// Let layout settle then scroll; scheduleScrollIntoView is keyboard-aware
			requestAnimationFrame(() =>
				scheduleScrollIntoView(currentPasswordInputEl as HTMLElement, { block: 'center' })
			);
		}
	});

	// Get available providers (only enabled ones, exclude emailOTP and magicLink)
	const allProviders = Object.keys(AUTH_CONSTANTS.providers).filter(
		(provider) =>
			provider !== 'emailOTP' &&
			provider !== 'magicLink' &&
			AUTH_CONSTANTS.providers[provider as keyof typeof AUTH_CONSTANTS.providers] === true
	);

	// Get providers that can be linked (not already linked)
	let availableProviders = $derived.by(() => {
		if (!accountList) return [];
		const linkedProviders = accountList.map((account) => account.providerId);
		return allProviders.filter((provider) => {
			// Handle the special case where 'password' in allProviders matches 'credential' in linkedProviders
			if (provider === 'password') {
				return !linkedProviders.includes('credential');
			}
			return !linkedProviders.includes(provider);
		});
	});

	// Build a map of provider IDs to icons for enabled providers
	// NOTE: We reference AUTH_CONSTANTS directly so bundlers can tree-shake
	// branches and drop unused icon imports at build time.
	const providerIconMap: Record<string, any> = {
		credential: KeyRoundIcon
	};
	if (AUTH_CONSTANTS.providers.github) providerIconMap.github = SiGithub;
	if (AUTH_CONSTANTS.providers.google) providerIconMap.google = SiGoogle;
	if (AUTH_CONSTANTS.providers.facebook) providerIconMap.facebook = SiFacebook;
	if (AUTH_CONSTANTS.providers.apple) providerIconMap.apple = SiApple;
	if (AUTH_CONSTANTS.providers.atlassian) providerIconMap.atlassian = SiAtlassian;
	if (AUTH_CONSTANTS.providers.discord) providerIconMap.discord = SiDiscord;
	if (AUTH_CONSTANTS.providers.figma) providerIconMap.figma = SiFigma;
	if (AUTH_CONSTANTS.providers.line) providerIconMap.line = SiLine;
	if (AUTH_CONSTANTS.providers.huggingface) providerIconMap.huggingface = SiHuggingface;
	if (AUTH_CONSTANTS.providers.kakao) providerIconMap.kakao = SiKakao;
	if (AUTH_CONSTANTS.providers.kick) providerIconMap.kick = SiKick;
	if (AUTH_CONSTANTS.providers.paypal) providerIconMap.paypal = SiPaypal;
	if (AUTH_CONSTANTS.providers.salesforce) providerIconMap.salesforce = SiSalesforce;
	if (AUTH_CONSTANTS.providers.slack) providerIconMap.slack = SiSlack;
	if (AUTH_CONSTANTS.providers.notion) providerIconMap.notion = SiNotion;
	if (AUTH_CONSTANTS.providers.naver) providerIconMap.naver = SiNaver;
	if (AUTH_CONSTANTS.providers.tiktok) providerIconMap.tiktok = SiTiktok;
	if (AUTH_CONSTANTS.providers.twitch) providerIconMap.twitch = SiTwitch;
	if (AUTH_CONSTANTS.providers.x) providerIconMap.x = SiX;
	if (AUTH_CONSTANTS.providers.dropbox) providerIconMap.dropbox = SiDropbox;
	if (AUTH_CONSTANTS.providers.linear) providerIconMap.linear = SiLinear;
	if (AUTH_CONSTANTS.providers.gitlab) providerIconMap.gitlab = SiGitlab;
	if (AUTH_CONSTANTS.providers.reddit) providerIconMap.reddit = SiReddit;
	if (AUTH_CONSTANTS.providers.roblox) providerIconMap.roblox = SiRoblox;
	if (AUTH_CONSTANTS.providers.spotify) providerIconMap.spotify = SiSpotify;
	if (AUTH_CONSTANTS.providers.vk) providerIconMap.vk = SiVk;
	if (AUTH_CONSTANTS.providers.zoom) providerIconMap.zoom = SiZoom;

	const getProviderIcon = (provider: string) => {
		return providerIconMap[provider] ?? LockIcon;
	};

	// Providers select collection (derived from available providers)
	const providersCollection = $derived(
		createListCollection({
			items: availableProviders.map((provider) => ({
				label: getProviderLabel(provider),
				value: provider
			}))
		})
	);

	const getProviderLabel = (provider: string) => {
		switch (provider) {
			case 'credential':
				return 'Password';
			case 'huggingface':
				return 'Hugging Face';
			case 'x':
				return 'X';
			case 'github':
				return 'GitHub';
			case 'gitlab':
				return 'GitLab';
			case 'tiktok':
				return 'TikTok';
			case 'paypal':
				return 'PayPal';
			default:
				return provider.charAt(0).toUpperCase() + provider.slice(1);
		}
	};

	// OAuth callback handling guard (prevents duplicate toasts)
	let handledCallbackKey: string | null = $state(null);

	function mapLinkErrorMessage(code: string): string {
		switch (code) {
			case 'account_already_linked_to_different_user':
				return 'This account is already linked to another user.';
			case 'account_already_linked':
				return 'This account is already linked.';
			case 'account_linking_disabled':
				return 'Linking accounts is disabled. Please contact support.';
			default:
				return 'Failed to link account. Please try again.';
		}
	}

	// Handle Better Auth OAuth callbacks
	$effect(() => {
		const errorCode = page.url.searchParams.get('error');
		const success = page.url.searchParams.get('success');
		const key = errorCode ? `e:${errorCode}` : success ? `s:${success}` : null;
		if (!key || handledCallbackKey === key) return;
		handledCallbackKey = key;

		if (errorCode) {
			toast.error(mapLinkErrorMessage(errorCode));
		} else if (success) {
			toast.success(success);
		}

		// Sanitize current URL in-place: keep dialog, remove success/error
		const url = new URL(page.url);
		url.searchParams.set('dialog', 'user-profile');
		url.searchParams.delete('success');
		url.searchParams.delete('error');
		const path = `${url.pathname}${url.search}${url.hash}`;
		void goto(path, { replaceState: true, noScroll: true, keepFocus: true, invalidateAll: false });
	});

	const linkAccount = async (provider: string) => {
		console.log('Linking account:', provider);
		if (isLinking) return;
		isLinking = true;

		if (provider === 'password') {
			// For credential, open dialog/drawer for input
			password = '';
			if (isMobile) {
				isPasswordDrawerOpen = true;
			} else {
				isPasswordDialogOpen = true;
			}
			isLinking = false; // Reset linking state, will be set again in handlePasswordSubmit
			return;
		} else {
			// For social providers
			const baseUrl = new URL(page.url);
			// Ensure callback keeps the dialog open on return
			baseUrl.searchParams.set('dialog', 'user-profile');
			// Success URL carries a friendly message
			const successMsg = `${getProviderLabel(provider)} account linked successfully`;
			const successUrl = new URL(baseUrl);
			successUrl.searchParams.set('success', successMsg);
			// Error URL must NOT contain success param
			const errorUrl = new URL(baseUrl);
			errorUrl.searchParams.delete('success');

			// Pre-purge the current open-dialog entry from history without triggering navigation
			// This removes entry #2 (/?dialog=user-profile) so Back from callback goes to '/'
			try {
				if (typeof window !== 'undefined') {
					const preUrl = new URL(window.location.href);
					preUrl.searchParams.delete('dialog');
					const cleaned = `${preUrl.pathname}${preUrl.search}${preUrl.hash}`;
					window.history.replaceState(window.history.state, '', cleaned);
				}
			} catch (e) {
				// no-op
			}

			await authClient.linkSocial({
				provider: provider,
				callbackURL: successUrl.toString(),
				errorCallbackURL: errorUrl.toString()
			});
			// Don't toast here. Success/failure will be handled after redirect via the effect above.
		}
		isLinking = false;
	};

	const handlePasswordSubmit = async (event: SubmitEvent) => {
		event.preventDefault();

		const form = event.currentTarget as HTMLFormElement;
		form.dataset.submitted = 'true';
		if (!form.checkValidity()) {
			form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
			return;
		}

		isSettingPassword = true;
		try {
			const success = await setPassword(password);
			if (success) {
				isPasswordDialogOpen = false;
				isPasswordDrawerOpen = false;
				password = '';
			}
		} catch (error) {
			// No-op, errors are handled in setPassword
		} finally {
			isSettingPassword = false;
		}
	};

	const unlinkAccount = async (accountId: string, provider: string) => {
		if (!accountList || accountList.length <= 1) {
			toast.error('You must have at least one account linked');
			return;
		}

		if (unlinkingAccountId) return;
		unlinkingAccountId = accountId;

		// try {
		const { error } = await authClient.unlinkAccount({
			providerId: provider,
			accountId
		});
		if (error) {
			if (error.message) {
				toast.error(error.message);
			} else {
				toast.error(error.statusText);
			}
		} else {
			toast.success(`${getProviderLabel(provider)} account unlinked successfully`);
		}
		unlinkingAccountId = null;
	};

	const setPassword = async (password: string): Promise<boolean> => {
		try {
			await client.mutation(api.users.mutations.setPassword, { password });
			toast.success('Password set successfully');
			return true;
		} catch (error) {
			if (error instanceof ConvexError) {
				toast.error(error.data);
			} else if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('Failed to set password');
			}
			return false;
		}
	};

	const handleChangePasswordSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		form.dataset.submitted = 'true';
		if (!form.checkValidity()) {
			form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
			return;
		}
		if (!currentPassword.trim() || !newPassword.trim()) {
			toast.error('Please fill in both fields');
			return;
		}

		isChangingPassword = true;
		try {
			const { error } = await authClient.changePassword({
				newPassword,
				currentPassword
			});

			if (error) {
				if (error.message) {
					toast.error(error.message);
				} else {
					toast.error(error.statusText ?? 'Failed to change password');
				}
				return;
			}

			toast.success('Password changed successfully');
			// Close inline editor and reset fields
			isEditingPasswordInline = false;
			currentPassword = '';
			newPassword = '';
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('Failed to change password');
			}
		} finally {
			isChangingPassword = false;
		}
	};
</script>

<div class="flex w-full flex-col gap-3 pb-6">
	<!-- Current Accounts -->
	<div>
		<span class="text-surface-600-400 text-xs">Linked Accounts</span>
		{#if accountList && accountList.length > 0}
			<div class="flex flex-col gap-3 pt-3">
				{#each accountList as account}
					{@const ProviderIcon = getProviderIcon(account.providerId)}

					<div class="border-surface-300-700 rounded-container flex w-full flex-col border p-3">
						<div class="flex w-full flex-row items-center justify-between">
							<div class="flex items-center gap-3 pl-1">
								<ProviderIcon size={16} />
								<div class="text-sm font-medium">
									{getProviderLabel(account.providerId)}
								</div>
							</div>
							<div class="flex items-center">
								{#if account.providerId === 'credential'}
									<button
										class="btn btn-sm preset-tonal mr-2"
										onclick={async () => {
											isEditingPasswordInline = true;
											currentPassword = '';
											newPassword = '';
											await tick();
											currentPasswordInputEl?.focus();
										}}
									>
										Update
									</button>
								{/if}
								<button
									class="btn-icon preset-faded-surface-50-950 hover:bg-error-300-700 hover:text-error-950-50"
									disabled={accountList.length <= 1 || unlinkingAccountId === account.id}
									onclick={() => unlinkAccount(account.accountId, account.providerId)}
								>
									{#if unlinkingAccountId === account.id}
										Unlinking...
									{:else}
										<Trash2Icon class="size-4" />
									{/if}
								</button>
							</div>
						</div>
						{#if account.providerId === 'credential'}
							<div
								class={[
									'grid transition-[grid-template-rows] duration-200 ease-in-out',
									isEditingPasswordInline ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
									''
								]}
								aria-hidden={!isEditingPasswordInline}
								inert={!isEditingPasswordInline}
							>
								<!-- Pass inputs and actions -->
								<div class="overflow-hidden">
									<form
										onsubmit={handleChangePasswordSubmit}
										class="flex w-full flex-col gap-3 pt-4"
									>
										<input
											bind:this={currentPasswordInputEl}
											type="password"
											class="input w-full"
											bind:value={currentPassword}
											placeholder="Enter your current password"
											autocomplete="current-password"
											required
											disabled={isChangingPassword}
										/>
										<Password.Root>
											<Password.Input
												bind:value={newPassword}
												placeholder="Enter your new password"
												autocomplete="new-password"
												required
												disabled={isChangingPassword}
											>
												<Password.ToggleVisibility />
											</Password.Input>
											<Password.Error />
											<Password.Strength />
										</Password.Root>
										<div class="flex gap-1.5">
											<button
												type="button"
												class="btn btn-sm preset-tonal w-full"
												onclick={() => {
													currentPassword = '';
													newPassword = '';
													isEditingPasswordInline = false;
												}}
												disabled={isChangingPassword}
											>
												Cancel
											</button>
											<button
												type="submit"
												class="btn btn-sm preset-filled-primary-500 w-full"
												disabled={isChangingPassword || !currentPassword || !newPassword}
											>
												{isChangingPassword ? 'Changing...' : 'Change Password'}
											</button>
										</div>
									</form>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-surface-600-400 mt-2 text-sm">No accounts found</div>
		{/if}
	</div>

	<!-- Link New Account -->
	{#if availableProviders.length > 0}
		<div>
			<Select.Root collection={providersCollection} onSelect={(e) => linkAccount(e.value)}>
				<Select.Trigger class="w-full" placeholder="Link new account" />
				<Select.Content>
					{#each providersCollection.items as item (item.value)}
						{@const ProviderIcon = getProviderIcon(item.value)}
						<Select.Item {item}>
							<ProviderIcon size={16} />
							<Select.ItemText>{item.label}</Select.ItemText>
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			{#if isLinking}
				<p class="text-surface-600-400 mt-2 text-sm">Linking account...</p>
			{/if}
		</div>
	{/if}
</div>

<!-- Password Dialog - Desktop -->
<Dialog.Root bind:open={isPasswordDialogOpen}>
	<Dialog.Content class="w-full max-w-md">
		<div
			class="flex max-h-[100dvh] w-full flex-col gap-4 overflow-auto overscroll-contain"
			onfocusin={(e) => {
				const el = e.target as HTMLElement | null;
				if (!el) return;
				if (!isEditableElement(el)) return;
				scheduleScrollIntoView(el);
			}}
		>
			<Dialog.Header>
				<Dialog.Title>Set Password</Dialog.Title>
			</Dialog.Header>
			<form onsubmit={handlePasswordSubmit} class="w-full">
				<div class="flex flex-col">
					<label class="flex flex-col gap-2">
						<span class="text-sm font-medium">Password</span>
						<Password.Root>
							<Password.Input bind:value={password} placeholder="Enter your password" required>
								<Password.ToggleVisibility />
							</Password.Input>
							<Password.Error />
							<Password.Strength />
						</Password.Root>
					</label>
					<Dialog.Footer>
						<Dialog.Close class="btn preset-tonal w-full md:w-fit">Cancel</Dialog.Close>
						<button
							type="submit"
							class="btn preset-filled-primary-500 w-full md:w-fit"
							disabled={isSettingPassword}
						>
							{#if isSettingPassword}
								Setting...
							{:else}
								Set Password
							{/if}
						</button>
					</Dialog.Footer>
				</div>
			</form>
			<Dialog.CloseX />
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Password Drawer - Mobile -->
<Drawer.Root bind:open={isPasswordDrawerOpen}>
	<Drawer.Content>
		<div
			class="max-h-[100dvh] overflow-auto overscroll-contain"
			onfocusin={(e) => {
				const el = e.target as HTMLElement | null;
				if (!el) return;
				if (!isEditableElement(el)) return;
				scheduleScrollIntoView(el);
			}}
		>
			<Drawer.Header>
				<Drawer.Title>Set Password</Drawer.Title>
			</Drawer.Header>
			<form onsubmit={handlePasswordSubmit} class="w-full">
				<div class="flex flex-col gap-4">
					<label class="flex flex-col gap-2">
						<span class="text-sm font-medium">Password</span>
						<Password.Root>
							<Password.Input bind:value={password} placeholder="Enter your password" required>
								<Password.ToggleVisibility />
							</Password.Input>
							<Password.Error />
							<Password.Strength />
						</Password.Root>
					</label>
					<Drawer.Footer>
						<Drawer.Close class="btn preset-tonal w-full md:w-fit">Cancel</Drawer.Close>
						<button
							type="submit"
							class="btn preset-filled-primary-500 w-full md:w-fit"
							disabled={isSettingPassword}
						>
							{#if isSettingPassword}
								Setting...
							{:else}
								Set Password
							{/if}
						</button>
					</Drawer.Footer>
				</div>
			</form>
			<Drawer.CloseX />
		</div>
	</Drawer.Content>
</Drawer.Root>
