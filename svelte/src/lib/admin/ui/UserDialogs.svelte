<script lang="ts">
	// Primitives
	import * as Dialog from '#lib/primitives/ui/dialog/index.js';
	import * as Password from '#lib/primitives/ui/password/index.js';
	// Icons
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	// API
	import { useConvexClient } from 'convex-svelte';
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	import { toast } from 'svelte-sonner';
	// Types
	import type { AdminUser, UserDialog } from '#lib/admin/types.js';

	let {
		user,
		dialog = $bindable(null),
		onDeleted
	}: {
		/** The user the open dialog acts on */
		user: AdminUser | null;
		/** The open dialog, if any */
		dialog: UserDialog | null;
		/** Called after the user is deleted */
		onDeleted?: () => void;
	} = $props();

	const { api } = getAuthContext();
	const client = useConvexClient();
	// The users table and a profile each render these dialogs, so their form ids differ per instance
	const formId = $props.id();

	const banDurations = [
		{ label: 'Permanent', value: '' },
		{ label: '1 hour', value: String(60 * 60) },
		{ label: '1 day', value: String(60 * 60 * 24) },
		{ label: '7 days', value: String(60 * 60 * 24 * 7) },
		{ label: '30 days', value: String(60 * 60 * 24 * 30) }
	];

	let banReason = $state('');
	let banExpiresIn = $state('');
	let newPassword = $state('');
	let submitting = $state(false);

	// Each dialog opens with empty fields
	$effect(() => {
		if (dialog) {
			banReason = '';
			banExpiresIn = '';
			newPassword = '';
		}
	});

	function rootProps(name: UserDialog) {
		return {
			// Mounted only while open, so the hidden users table doesn't keep a set behind a profile
			lazyMount: true,
			unmountOnExit: true,
			open: dialog === name,
			onOpenChange: (details: { open: boolean }) => {
				if (!details.open && dialog === name) dialog = null;
			}
		};
	}

	async function submit(action: () => Promise<unknown>, success: string, failure: string) {
		submitting = true;
		try {
			await action();
			toast.success(success);
			return true;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : failure);
			return false;
		} finally {
			submitting = false;
		}
	}

	async function handleBanSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!user) return;
		const { id, name } = user;
		const done = await submit(
			() =>
				client.mutation(api.admin.mutations.banUser, {
					userId: id,
					banReason: banReason.trim() || undefined,
					banExpiresIn: banExpiresIn ? Number(banExpiresIn) : undefined
				}),
			`Banned ${name}`,
			'Failed to ban user'
		);
		if (done) dialog = null;
	}

	async function handlePasswordSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!user) return;
		const { id, name } = user;
		const done = await submit(
			() => client.mutation(api.admin.mutations.setUserPassword, { userId: id, newPassword }),
			`Updated the password of ${name}`,
			'Failed to set password'
		);
		if (done) dialog = null;
	}

	async function handleMakeAdmin() {
		if (!user) return;
		const { id, name } = user;
		const done = await submit(
			() => client.mutation(api.admin.mutations.setRole, { userId: id, role: 'admin' }),
			`${name} is now an admin`,
			'Failed to make admin'
		);
		if (done) dialog = null;
	}

	async function handleDelete() {
		if (!user) return;
		const { id, name } = user;
		const done = await submit(
			() => client.mutation(api.admin.mutations.removeUser, { userId: id }),
			`Deleted ${name}`,
			'Failed to delete user'
		);
		if (done) {
			dialog = null;
			onDeleted?.();
		}
	}
</script>

{#snippet submitLabel(idle: string, busy: string)}
	{#if submitting}
		<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
		{busy}
	{:else}
		{idle}
	{/if}
{/snippet}

<!-- Make admin dialog -->
<Dialog.Root {...rootProps('make-admin')}>
	<Dialog.Content class="md:max-w-108">
		<Dialog.Header class="pr-8">
			<Dialog.Title>Make {user?.name} an admin?</Dialog.Title>
			<Dialog.Description class="text-surface-700-300">
				Admins can see and change every user and organization, and sign in as any user who isn't an
				admin. You can remove the role again at any time.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Dialog.Close class="btn preset-tonal" disabled={submitting}>Cancel</Dialog.Close>
			<button
				type="button"
				class="btn preset-filled-primary-500"
				onclick={handleMakeAdmin}
				disabled={submitting}
				aria-busy={submitting}
			>
				{@render submitLabel('Make admin', 'Saving...')}
			</button>
		</Dialog.Footer>
		<Dialog.CloseX />
	</Dialog.Content>
</Dialog.Root>

<!-- Ban dialog -->
<Dialog.Root {...rootProps('ban')}>
	<Dialog.Content class="md:max-w-108">
		<Dialog.Header class="pr-8">
			<Dialog.Title>Ban {user?.name}</Dialog.Title>
			<Dialog.Description class="text-surface-700-300">
				They are signed out everywhere and can't sign in until the ban ends or you lift it.
			</Dialog.Description>
		</Dialog.Header>
		<form id={`${formId}-ban`} class="flex w-full flex-col gap-3" onsubmit={handleBanSubmit}>
			<label class="label">
				<span class="label-text">Reason (optional)</span>
				<input type="text" class="input" bind:value={banReason} placeholder="Violation of terms" />
			</label>
			<label class="label">
				<span class="label-text">Duration</span>
				<select class="select" bind:value={banExpiresIn}>
					{#each banDurations as duration (duration.value)}
						<option value={duration.value}>{duration.label}</option>
					{/each}
				</select>
			</label>
		</form>
		<Dialog.Footer>
			<Dialog.Close class="btn preset-tonal" disabled={submitting}>Cancel</Dialog.Close>
			<button
				type="submit"
				form={`${formId}-ban`}
				class="btn preset-filled-error-500"
				disabled={submitting}
				aria-busy={submitting}
			>
				{@render submitLabel('Ban user', 'Banning...')}
			</button>
		</Dialog.Footer>
		<Dialog.CloseX />
	</Dialog.Content>
</Dialog.Root>

<!-- Set password dialog -->
<Dialog.Root {...rootProps('password')}>
	<Dialog.Content class="md:max-w-108">
		<Dialog.Header class="pr-8">
			<Dialog.Title>Set password for {user?.name}</Dialog.Title>
			<Dialog.Description class="text-surface-700-300">
				If they sign in without a password today, they can also use their email and this password
				from now on. Their existing sessions stay signed in.
			</Dialog.Description>
		</Dialog.Header>
		<form id={`${formId}-password`} class="w-full" onsubmit={handlePasswordSubmit}>
			<label class="label">
				<span class="label-text">New password</span>
				<Password.Root minScore={0}>
					<Password.Input
						bind:value={newPassword}
						autocomplete="new-password"
						minlength={8}
						required
					>
						<Password.ToggleVisibility />
					</Password.Input>
				</Password.Root>
			</label>
		</form>
		<Dialog.Footer>
			<Dialog.Close class="btn preset-tonal" disabled={submitting}>Cancel</Dialog.Close>
			<button
				type="submit"
				form={`${formId}-password`}
				class="btn preset-filled-primary-500"
				disabled={submitting}
				aria-busy={submitting}
			>
				{@render submitLabel('Set password', 'Saving...')}
			</button>
		</Dialog.Footer>
		<Dialog.CloseX />
	</Dialog.Content>
</Dialog.Root>

<!-- Delete dialog -->
<Dialog.Root {...rootProps('delete')}>
	<Dialog.Content class="md:max-w-108">
		<Dialog.Header class="pr-8">
			<Dialog.Title>Delete {user?.name}</Dialog.Title>
			<Dialog.Description class="text-surface-700-300">
				This permanently deletes the account, its sessions and its organization memberships. If they
				own an organization with other members, delete it or make someone else its owner first. This
				can't be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Dialog.Close class="btn preset-tonal" disabled={submitting}>Cancel</Dialog.Close>
			<button
				type="button"
				class="btn preset-filled-error-500"
				onclick={handleDelete}
				disabled={submitting}
				aria-busy={submitting}
			>
				{@render submitLabel('Delete user', 'Deleting...')}
			</button>
		</Dialog.Footer>
		<Dialog.CloseX />
	</Dialog.Content>
</Dialog.Root>
