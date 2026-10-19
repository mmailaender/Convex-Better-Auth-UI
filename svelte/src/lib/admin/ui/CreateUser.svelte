<script lang="ts">
	// Primitives
	import * as Dialog from '#lib/primitives/ui/dialog/index.js';
	import * as Password from '#lib/primitives/ui/password/index.js';
	// Icons
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import XIcon from '@lucide/svelte/icons/x';
	// Components
	import OrganizationSelect from '#lib/admin/ui/OrganizationSelect.svelte';
	// API
	import { useConvexClient } from 'convex-svelte';
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	import { toast } from 'svelte-sonner';
	// Types
	import type { AdminOrganization, OrganizationRole } from '#lib/admin/types.js';

	const { api, authConstants } = getAuthContext();
	const client = useConvexClient();
	const organizationsEnabled = Boolean(authConstants.organizations);

	let open = $state(false);
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let organization = $state<AdminOrganization | null>(null);
	let organizationRole = $state<OrganizationRole>('member');
	let submitting = $state(false);

	function reset() {
		name = '';
		email = '';
		password = '';
		organization = null;
		organizationRole = 'member';
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		try {
			await client.mutation(api.admin.mutations.createUser, {
				name: name.trim(),
				email: email.trim(),
				password,
				organizationId: organization?._id,
				organizationRole: organization ? organizationRole : undefined
			});
			toast.success(`Created ${name.trim()}`);
			open = false;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create user');
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={(details) => details.open && reset()}>
	<Dialog.Trigger class="btn preset-filled-primary-500 shrink-0 gap-2" aria-label="New user">
		<PlusIcon class="size-4" aria-hidden="true" />
		<span class="hidden sm:inline">New user</span>
	</Dialog.Trigger>
	<Dialog.Content class="md:max-w-108">
		<Dialog.Header>
			<Dialog.Title>Create user</Dialog.Title>
			<Dialog.Description class="text-surface-700-300">
				The user can sign in with this email and password right away.
			</Dialog.Description>
		</Dialog.Header>
		<form id="admin-create-user" class="flex w-full flex-col gap-3" onsubmit={handleSubmit}>
			<label class="label">
				<span class="label-text">Name</span>
				<input type="text" class="input" bind:value={name} autocomplete="off" required />
			</label>
			<label class="label">
				<span class="label-text">Email</span>
				<input type="email" class="input" bind:value={email} autocomplete="off" required />
			</label>
			<label class="label">
				<span class="label-text">Password</span>
				<Password.Root minScore={0}>
					<Password.Input bind:value={password} autocomplete="new-password" minlength={8} required>
						<Password.ToggleVisibility />
					</Password.Input>
				</Password.Root>
			</label>
			{#if organizationsEnabled}
				<div class="border-surface-300-700 mt-2 flex flex-col gap-3 border-t pt-4">
					<div class="label">
						<div class="flex items-center justify-between">
							<label class="label-text" for="admin-create-user-organization">
								Add to organization
							</label>
							{#if organization}
								<button
									type="button"
									class="btn btn-sm hover:preset-tonal gap-1 px-2 text-xs"
									onclick={() => (organization = null)}
								>
									<XIcon class="size-3" aria-hidden="true" />
									Clear
								</button>
							{:else}
								<span class="badge preset-tonal text-xs">Optional</span>
							{/if}
						</div>
						<OrganizationSelect id="admin-create-user-organization" bind:value={organization} />
					</div>
					{#if organization}
						<label class="label">
							<span class="label-text">Role in {organization.name}</span>
							<select class="select" bind:value={organizationRole}>
								<option value="member">Member</option>
								<option value="admin">Admin</option>
							</select>
						</label>
					{/if}
				</div>
			{/if}
		</form>
		<Dialog.Footer>
			<Dialog.Close class="btn preset-tonal" disabled={submitting}>Cancel</Dialog.Close>
			<button
				type="submit"
				form="admin-create-user"
				class="btn preset-filled-primary-500"
				disabled={submitting}
				aria-busy={submitting}
			>
				{#if submitting}
					<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
					Creating...
				{:else}
					Create user
				{/if}
			</button>
		</Dialog.Footer>
		<Dialog.CloseX />
	</Dialog.Content>
</Dialog.Root>
