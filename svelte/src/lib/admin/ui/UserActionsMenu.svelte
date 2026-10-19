<script lang="ts">
	// SvelteKit
	import { resolve } from '$app/paths';
	// Primitives
	import * as Menu from '#lib/primitives/ui/menu/index.js';
	import { Portal } from '@ark-ui/svelte/portal';
	// Icons
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CircleUserIcon from '@lucide/svelte/icons/circle-user';
	import VenetianMaskIcon from '@lucide/svelte/icons/venetian-mask';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import ShieldOffIcon from '@lucide/svelte/icons/shield-off';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import BanIcon from '@lucide/svelte/icons/ban';
	import LockOpenIcon from '@lucide/svelte/icons/lock-open';
	import TrashIcon from '@lucide/svelte/icons/trash';
	// API
	import { useConvexClient } from 'convex-svelte';
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	import { toast } from 'svelte-sonner';
	// Types
	import type { AdminUser, UserDialog } from '#lib/admin/types.js';

	let {
		user,
		isSelf,
		onDialog,
		onViewProfile
	}: {
		user: AdminUser;
		/** Whether `user` is the signed-in admin, who can't act on their own account here */
		isSelf: boolean;
		/** Opens one of the dialogs of `UserDialogs` */
		onDialog: (dialog: UserDialog) => void;
		/** Shows "View profile" when set */
		onViewProfile?: () => void;
	} = $props();

	const { api, authClient } = getAuthContext();
	const client = useConvexClient();

	// The server refuses the rest for these users too: see `assertCanManageUser`
	const canManage = $derived(!isSelf && !user.isBootstrapAdmin);

	async function run(action: () => Promise<unknown>, success: string, failure: string) {
		try {
			await action();
			toast.success(success);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : failure);
		}
	}

	function copyUserId() {
		void run(() => navigator.clipboard.writeText(user.id), 'Copied the user ID', "Couldn't copy");
	}

	async function impersonate() {
		const { error } = await authClient.admin.impersonateUser({ userId: user.id });
		if (error) {
			toast.error(error.message ?? 'Failed to impersonate user');
			return;
		}
		// Refresh the Convex JWT cookie the server renders with, then reload so every query
		// runs as the impersonated user
		await authClient.getSession();
		window.location.assign(resolve('/'));
	}
</script>

<Menu.Root>
	<Menu.Trigger class="btn-icon hover:preset-tonal" aria-label={`Actions for ${user.name}`}>
		<EllipsisVerticalIcon class="size-4" aria-hidden="true" />
	</Menu.Trigger>
	<!-- Portaled so the table's scroll container doesn't clip the menu -->
	<Portal>
		<Menu.Content class="bg-surface-50-950 min-w-52">
			<Menu.Item value="copy-id" onclick={copyUserId}>
				<CopyIcon aria-hidden="true" />
				Copy user ID
			</Menu.Item>
			{#if onViewProfile}
				<Menu.Item value="profile" onclick={onViewProfile}>
					<CircleUserIcon aria-hidden="true" />
					View profile
				</Menu.Item>
			{/if}
			{#if canManage && user.isAppAdmin}
				<Menu.Separator />
				<Menu.Item
					value="remove-admin"
					onclick={() =>
						run(
							() => client.mutation(api.admin.mutations.setRole, { userId: user.id, role: 'user' }),
							`${user.name} is no longer an admin`,
							'Failed to remove the admin role'
						)}
				>
					<ShieldOffIcon aria-hidden="true" />
					Remove admin
				</Menu.Item>
			{:else if canManage}
				{#if !user.banned}
					<Menu.Item value="impersonate" onclick={impersonate}>
						<VenetianMaskIcon aria-hidden="true" />
						Impersonate
					</Menu.Item>
				{/if}
				<Menu.Separator />
				<Menu.Item value="make-admin" onclick={() => onDialog('make-admin')}>
					<ShieldCheckIcon aria-hidden="true" />
					Make admin
				</Menu.Item>
				<Menu.Item value="password" onclick={() => onDialog('password')}>
					<KeyRoundIcon aria-hidden="true" />
					Set password
				</Menu.Item>
				<Menu.Item
					value="revoke"
					onclick={() =>
						run(
							() => client.mutation(api.admin.mutations.revokeUserSessions, { userId: user.id }),
							`Signed ${user.name} out everywhere`,
							'Failed to revoke sessions'
						)}
				>
					<LogOutIcon aria-hidden="true" />
					Sign out everywhere
				</Menu.Item>
				<Menu.Separator />
				{#if user.banned}
					<Menu.Item
						value="unban"
						onclick={() =>
							run(
								() => client.mutation(api.admin.mutations.unbanUser, { userId: user.id }),
								`Unbanned ${user.name}`,
								'Failed to unban user'
							)}
					>
						<LockOpenIcon aria-hidden="true" />
						Unban
					</Menu.Item>
				{:else}
					<Menu.Item value="ban" variant="destructive" onclick={() => onDialog('ban')}>
						<BanIcon aria-hidden="true" />
						Ban
					</Menu.Item>
				{/if}
				<Menu.Item value="delete" variant="destructive" onclick={() => onDialog('delete')}>
					<TrashIcon aria-hidden="true" />
					Delete user
				</Menu.Item>
			{/if}
		</Menu.Content>
	</Portal>
</Menu.Root>
