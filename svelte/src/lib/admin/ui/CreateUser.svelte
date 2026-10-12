<script lang="ts">
	// Primitives
	import * as Dialog from '#lib/primitives/ui/dialog/index.js';
	import * as Password from '#lib/primitives/ui/password/index.js';
	// Icons
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	// API
	import { useConvexClient } from 'convex-svelte';
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	import { toast } from 'svelte-sonner';

	const { api } = getAuthContext();
	const client = useConvexClient();

	let open = $state(false);
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let role = $state<'user' | 'admin'>('user');
	let submitting = $state(false);

	function reset() {
		name = '';
		email = '';
		password = '';
		role = 'user';
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		try {
			await client.mutation(api.admin.mutations.createUser, {
				name: name.trim(),
				email: email.trim(),
				password,
				role
			});
			toast.success(`Created ${name.trim()}`);
			open = false;
			reset();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create user');
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={(details) => !details.open && reset()}>
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
		<form id="admin-create-user" class="flex flex-col gap-3" onsubmit={handleSubmit}>
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
			<label class="label">
				<span class="label-text">Role</span>
				<select class="select" bind:value={role}>
					<option value="user">User</option>
					<option value="admin">Admin</option>
				</select>
			</label>
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
