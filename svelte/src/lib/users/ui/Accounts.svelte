<script lang="ts">
	// API
	import { api } from '$convex/_generated/api';
	import { authClient } from '$lib/auth/api/auth-client';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { ConvexError } from 'convex/values';
	const client = useConvexClient();

	// Constants
	import { AUTH_CONSTANTS } from '$convex/auth.constants';

	// UI Components
	import * as Combobox from '$lib/primitives/ui/combobox';
	import { Portal } from '@ark-ui/svelte/portal';
	import { useListCollection } from '@ark-ui/svelte/combobox';
	import { useFilter } from '@ark-ui/svelte/locale';
	import * as Dialog from '$lib/primitives/ui/dialog';
	import * as Drawer from '$lib/primitives/ui/drawer';

	// Icons
	import { SiGithub } from '@icons-pack/svelte-simple-icons';
	import { KeyRound, Lock, Plus, Trash2, ChevronDown } from '@lucide/svelte';

	import { toast } from 'svelte-sonner';
	import { page } from '$app/state';

	let { initialData }: { initialData?: any } = $props();

	let accountListResponse = useQuery(api.users.queries.listAccounts, {}, { initialData });
	let accountList = $derived(accountListResponse.data);

	// State for linking accounts
	let isLinking = $state(false);
	let unlinkingAccountId = $state<string | null>(null);

	// State for password dialog/drawer
	let isPasswordDialogOpen = $state(false);
	let isPasswordDrawerOpen = $state(false);
	let password = $state('');
	let isSettingPassword = $state(false);

	// State for change password dialog/drawer
	let isChangePasswordDialogOpen = $state(false);
	let isChangePasswordDrawerOpen = $state(false);
	let currentPassword = $state('');
	let newPassword = $state('');
	let isChangingPassword = $state(false);
	let isMobile = $derived(window.innerWidth < 768);

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
		const linkedProviders = accountList.map((account) => account.provider);
		return allProviders.filter((provider) => {
			// Handle the special case where 'password' in allProviders matches 'credential' in linkedProviders
			if (provider === 'password') {
				return !linkedProviders.includes('credential');
			}
			return !linkedProviders.includes(provider);
		});
	});

	// Combobox setup
	const filters = useFilter({ sensitivity: 'base' });
	const comboboxCollection = useListCollection({
		initialItems: [] as string[],
		filter(itemString, filterText) {
			return filters().contains(itemString, filterText);
		}
	});

	// Update collection when available providers change
	$effect(() => {
		comboboxCollection.set(availableProviders);
	});

	const handleInputChange = (details: any) => {
		comboboxCollection.filter(details.inputValue);
	};

	const getProviderIcon = (provider: string) => {
		switch (provider) {
			case 'github':
				return SiGithub;
			case 'credential':
				return KeyRound;
			default:
				return Lock;
		}
	};

	const getProviderLabel = (provider: string) => {
		if (provider === 'credential') return 'Password';
		return provider.charAt(0).toUpperCase() + provider.slice(1);
	};

	const linkAccount = async (provider: string) => {
		if (isLinking) return;
		isLinking = true;

		try {
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
				const currentUrl = new URL(page.url);
				if (
					!currentUrl.searchParams.has('dialog') ||
					currentUrl.searchParams.get('dialog') !== 'profile'
				) {
					currentUrl.searchParams.set('dialog', 'profile');
				}

				await authClient.linkSocial({
					provider: provider,
					callbackURL: currentUrl.toString()
				});
				toast.success(`${getProviderLabel(provider)} account linked successfully`);
			}
		} catch (error) {
			if (error instanceof ConvexError) {
				toast.error(error.data);
			} else if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error(`Failed to link ${getProviderLabel(provider)} account`);
			}
		} finally {
			isLinking = false;
		}
	};

	const handlePasswordSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		if (!password.trim()) {
			toast.error('Password cannot be empty');
			return;
		}

		isSettingPassword = true;
		try {
			await setPassword(password);
			isPasswordDialogOpen = false;
			isPasswordDrawerOpen = false;
			password = '';
		} catch (error) {
			// Error handling is already done in setPassword function
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

	const setPassword = async (password: string) => {
		try {
			await client.mutation(api.users.mutations.setPassword, { password });
			toast.success('Password set successfully');
		} catch (error) {
			if (error instanceof ConvexError) {
				toast.error(error.data);
			} else if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('Failed to set password');
			}
		}
	};

	const handleChangePasswordSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
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
			// Close dialogs/drawers and reset fields
			isChangePasswordDialogOpen = false;
			isChangePasswordDrawerOpen = false;
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

<div class="flex flex-col gap-6">
	<!-- Current Accounts -->
	<div>
		<span class="text-surface-600-400 text-xs">Linked Accounts</span>
		{#if accountList && accountList.length > 0}
			<div class="mt-2 space-y-2.5">
				{#each accountList as account}
					{@const ProviderIcon = getProviderIcon(account.provider)}
					<div
						class="border-surface-300-700 rounded-base flex w-full flex-row content-center items-center border py-2 pr-3 pl-4"
					>
						<div class="flex items-center gap-3">
							<ProviderIcon size={20} class="text-muted-foreground" />
							<div class="font-medium">
								{getProviderLabel(account.provider)}
							</div>
						</div>
						{#if account.provider === 'credential'}
							<button
								class="btn preset-tonal mr-2 ml-auto"
								onclick={() => {
									if (isMobile) {
										isChangePasswordDrawerOpen = true;
									} else {
										isChangePasswordDialogOpen = true;
									}
								}}
							>
								Change Password
							</button>
						{/if}
						<button
							class="btn-icon preset-faded-surface-50-950 hover:bg-error-300-700 hover:text-error-950-50"
							disabled={accountList.length <= 1 || unlinkingAccountId === account.id}
							onclick={() => unlinkAccount(account.accountId, account.provider)}
						>
							{#if unlinkingAccountId === account.id}
								Unlinking...
							{:else}
								<Trash2 class="size-4" />
							{/if}
						</button>
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
			<Combobox.Root
				collection={comboboxCollection.collection()}
				onInputValueChange={handleInputChange}
				openOnClick={true}
				class="w-full max-w-sm"
			>
				<Combobox.Label class="label">Link New Account</Combobox.Label>
				<Combobox.Control class="relative">
					<Combobox.Input
						class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 pr-10 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						placeholder="Select account type..."
					/>
					<Combobox.Trigger class="absolute top-1/2 right-3 -translate-y-1/2">
						<ChevronDown size={16} class="text-muted-foreground" />
					</Combobox.Trigger>
				</Combobox.Control>
				<Portal>
					<Combobox.Positioner class="z-50">
						<Combobox.Content
							class="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md"
						>
							<Combobox.ItemGroup>
								{#each comboboxCollection.collection().items as provider (provider)}
									{@const ProviderIcon = getProviderIcon(provider)}
									<Combobox.Item
										item={provider}
										class="data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
										onclick={() => linkAccount(provider)}
									>
										<ProviderIcon size={16} class="mr-2" />
										<Combobox.ItemText>{getProviderLabel(provider)}</Combobox.ItemText>
										<Combobox.ItemIndicator class="ml-auto">
											<Plus size={16} />
										</Combobox.ItemIndicator>
									</Combobox.Item>
								{/each}
							</Combobox.ItemGroup>
						</Combobox.Content>
					</Combobox.Positioner>
				</Portal>
			</Combobox.Root>
			{#if isLinking}
				<p class="text-surface-600-400 mt-2 text-sm">Linking account...</p>
			{/if}
		</div>
	{/if}
</div>

<!-- Password Dialog - Desktop -->
<Dialog.Root bind:open={isPasswordDialogOpen}>
	<Dialog.Content class="w-full max-w-md">
		<Dialog.Header>
			<Dialog.Title>Set Password</Dialog.Title>
		</Dialog.Header>
		<form onsubmit={handlePasswordSubmit} class="w-full">
			<div class="flex flex-col gap-4">
				<label class="flex flex-col gap-2">
					<span class="text-sm font-medium">Password</span>
					<input
						type="password"
						class="input w-full"
						bind:value={password}
						placeholder="Enter your password"
						required
					/>
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
	</Dialog.Content>
</Dialog.Root>

<!-- Password Drawer - Mobile -->
<Drawer.Root bind:open={isPasswordDrawerOpen}>
	<Drawer.Content>
		<Drawer.Header>
			<Drawer.Title>Set Password</Drawer.Title>
		</Drawer.Header>
		<form onsubmit={handlePasswordSubmit} class="w-full">
			<div class="flex flex-col gap-4">
				<label class="flex flex-col gap-2">
					<span class="text-sm font-medium">Password</span>
					<input
						type="password"
						class="input w-full"
						bind:value={password}
						placeholder="Enter your password"
						required
					/>
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
	</Drawer.Content>
</Drawer.Root>

<!-- Change Password Dialog - Desktop -->
<Dialog.Root bind:open={isChangePasswordDialogOpen}>
	<Dialog.Content class="w-full max-w-md">
		<Dialog.Header>
			<Dialog.Title>Change Password</Dialog.Title>
		</Dialog.Header>
		<form onsubmit={handleChangePasswordSubmit} class="w-full">
			<div class="flex flex-col gap-4">
				<label class="flex flex-col gap-2">
					<span class="text-sm font-medium">Current Password</span>
					<input
						type="password"
						class="input w-full"
						bind:value={currentPassword}
						placeholder="Enter your current password"
						autocomplete="current-password"
						required
					/>
				</label>
				<label class="flex flex-col gap-2">
					<span class="text-sm font-medium">New Password</span>
					<input
						type="password"
						class="input w-full"
						bind:value={newPassword}
						placeholder="Enter your new password"
						autocomplete="new-password"
						required
					/>
				</label>
				<Dialog.Footer>
					<Dialog.Close class="btn preset-tonal w-full md:w-fit">Cancel</Dialog.Close>
					<button
						type="submit"
						class="btn preset-filled-primary-500 w-full md:w-fit"
						disabled={isChangingPassword}
					>
						{#if isChangingPassword}
							Changing...
						{:else}
							Change Password
						{/if}
					</button>
				</Dialog.Footer>
			</div>
		</form>
		<Dialog.CloseX />
	</Dialog.Content>
</Dialog.Root>

<!-- Change Password Drawer - Mobile -->
<Drawer.Root bind:open={isChangePasswordDrawerOpen}>
	<Drawer.Content>
		<Drawer.Header>
			<Drawer.Title>Change Password</Drawer.Title>
		</Drawer.Header>
		<form onsubmit={handleChangePasswordSubmit} class="w-full">
			<div class="flex flex-col gap-4">
				<label class="flex flex-col gap-2">
					<span class="text-sm font-medium">Current Password</span>
					<input
						type="password"
						class="input w-full"
						bind:value={currentPassword}
						placeholder="Enter your current password"
						autocomplete="current-password"
						required
					/>
				</label>
				<label class="flex flex-col gap-2">
					<span class="text-sm font-medium">New Password</span>
					<input
						type="password"
						class="input w-full"
						bind:value={newPassword}
						placeholder="Enter your new password"
						autocomplete="new-password"
						required
					/>
				</label>
				<Drawer.Footer>
					<Drawer.Close class="btn preset-tonal w-full md:w-fit">Cancel</Drawer.Close>
					<button
						type="submit"
						class="btn preset-filled-primary-500 w-full md:w-fit"
						disabled={isChangingPassword}
					>
						{#if isChangingPassword}
							Changing...
						{:else}
							Change Password
						{/if}
					</button>
				</Drawer.Footer>
			</div>
		</form>
		<Drawer.CloseX />
	</Drawer.Content>
</Drawer.Root>
