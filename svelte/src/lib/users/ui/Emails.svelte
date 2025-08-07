<script lang="ts">
	// API
	import { api } from '$convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { authClient } from '$lib/auth/api/auth-client';

	// Icons
	import { Pencil } from '@lucide/svelte';
	// Primitives
	import { toast } from 'svelte-sonner';
	import * as Drawer from '$lib/primitives/ui/drawer';
	import * as Dialog from '$lib/primitives/ui/dialog';

	// Types
	import type { FunctionReturnType } from 'convex/server';
	type UserResponse = FunctionReturnType<typeof api.users.queries.getActiveUser>;

	// Props
	let { initialData }: { initialData?: UserResponse } = $props();

	// Query
	const activeUserResponse = useQuery(api.users.queries.getActiveUser, {}, { initialData });
	// Derived state
	const activeUser = $derived(activeUserResponse.data);

	// State
	let isDialogOpen: boolean = $state(false);
	let isDrawerOpen: boolean = $state(false);
	let newEmail: string = $state('');
	let isSubmitting: boolean = $state(false);

	// Reset form when dialog/drawer closes
	$effect(() => {
		if (!isDialogOpen && !isDrawerOpen) {
			newEmail = '';
			isSubmitting = false;
		}
	});

	// Handle form submission to change email
	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (!newEmail.trim()) {
			toast.error('Please enter a valid email address');
			return;
		}

		if (newEmail === activeUser?.email) {
			toast.error('New email must be different from current email');
			return;
		}

		try {
			isSubmitting = true;
			await authClient.changeEmail({
				newEmail,
				callbackURL: '/'
			});
			isDialogOpen = false;
			isDrawerOpen = false;
			toast.success('Verification email sent to your new email address');
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to change email: ${errorMsg}`);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	{#if !activeUser}
		<div class="bg-success-200-800 rounded-base h-16 w-full animate-pulse"></div>
	{:else}
		<!-- Email Display Section -->
		<div class="rounded-base flex flex-col pt-6 pl-0.5">
			<span class="text-surface-600-400 text-xs">Email Address</span>
			<div class="flex items-center gap-2">
				<span class="text-surface-800-200 font-medium">{activeUser.email}</span>
				{#if activeUser.emailVerified}
					<span class="badge preset-filled-success-100-900 text-xs">Verified</span>
				{:else}
					<span class="badge preset-filled-warning-100-900 text-xs">Not verified</span>
				{/if}
			</div>
		</div>

		<!-- Desktop Dialog - hidden on mobile, shown on desktop -->
		<Dialog.Root bind:open={isDialogOpen}>
			<Dialog.Trigger
				class="border-surface-300-700 hover:bg-surface-50-950 hover:border-surface-50-950 rounded-container hidden w-full flex-row content-center items-center border py-2 pr-3 pl-4 duration-300 ease-in-out md:flex"
				onclick={() => (isDialogOpen = true)}
			>
				<div class="flex w-full flex-col gap-1 text-left">
					<span class="text-surface-600-400 text-xs">Change Email Address</span>
					<span class="text-surface-800-200 font-medium">Update your email address</span>
				</div>
				<div class="btn-icon preset-filled-surface-200-800">
					<Pencil class="size-4" />
				</div>
			</Dialog.Trigger>

			<Dialog.Content class="w-full max-w-md">
				<Dialog.Header>
					<Dialog.Title>Change Email Address</Dialog.Title>
					<Dialog.Description>
						Enter your new email address. You'll need to verify it before the change takes effect.
					</Dialog.Description>
				</Dialog.Header>
				<form onsubmit={handleSubmit} class="w-full">
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<span class="text-surface-600-400 text-sm">Current Email</span>
							<span class="text-surface-800-200 font-medium">{activeUser.email}</span>
						</div>
						<label class="flex flex-col">
							<span class="label">New Email Address</span>
							<input
								type="email"
								class="input w-full"
								bind:value={newEmail}
								placeholder="Enter new email address"
								required
								disabled={isSubmitting}
							/>
						</label>
						<Dialog.Footer>
							<Dialog.Close class="btn preset-tonal w-full md:w-fit" disabled={isSubmitting}
								>Cancel</Dialog.Close
							>
							<button
								type="submit"
								class="btn preset-filled-primary-500 w-full md:w-fit"
								disabled={isSubmitting}
							>
								{isSubmitting ? 'Sending...' : 'Send Verification Email'}
							</button>
						</Dialog.Footer>
					</div>
				</form>
			</Dialog.Content>
		</Dialog.Root>

		<!-- Mobile Drawer - shown on mobile, hidden on desktop -->
		<Drawer.Root bind:open={isDrawerOpen}>
			<Drawer.Trigger
				onclick={() => (isDrawerOpen = true)}
				class="border-surface-300-700 rounded-base flex w-full flex-row content-center items-center border py-2 pr-3 pl-4 md:hidden"
			>
				<div class="flex w-full flex-col gap-1 text-left">
					<span class="text-surface-600-400 text-xs">Change Email Address</span>
					<span class="text-surface-800-200 font-medium">Update your email address</span>
				</div>
				<div class="btn-icon preset-faded-surface-50-950">
					<Pencil class="size-4" />
				</div>
			</Drawer.Trigger>
			<Drawer.Content>
				<Drawer.Header>
					<Drawer.Title>Change Email Address</Drawer.Title>
					<Drawer.Description class="text-surface-600-400">
						Enter your new email address. You'll need to verify it before the change takes effect.
					</Drawer.Description>
				</Drawer.Header>
				<form onsubmit={handleSubmit} class="w-full">
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<span class="text-surface-600-400 text-sm">Current Email</span>
							<span class="text-surface-800-200 font-medium">{activeUser.email}</span>
						</div>
						<label class="flex flex-col">
							<span class="label">New Email Address</span>
							<input
								type="email"
								class="input w-full"
								bind:value={newEmail}
								placeholder="Enter new email address"
								required
								disabled={isSubmitting}
							/>
						</label>
						<Drawer.Footer>
							<Drawer.Close class="btn preset-tonal w-full md:w-fit" disabled={isSubmitting}
								>Cancel</Drawer.Close
							>
							<button
								type="submit"
								class="btn preset-filled-primary-500 w-full md:w-fit"
								disabled={isSubmitting}
							>
								{isSubmitting ? 'Sending...' : 'Send Verification Email'}
							</button>
						</Drawer.Footer>
					</div>
				</form>
				<Drawer.CloseX />
			</Drawer.Content>
		</Drawer.Root>
	{/if}
</div>
