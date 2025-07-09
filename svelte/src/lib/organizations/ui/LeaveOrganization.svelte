<script lang="ts">
	// Primitives
	import * as Dialog from '$lib/primitives/ui/dialog';
	import { toast } from 'svelte-sonner';

	// API
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { createRoles } from '$lib/organizations/api/roles.svelte';
	import { goto } from '$app/navigation';
	const roles = createRoles();
	const client = useConvexClient();

	// Types
	import type { Id } from '$convex/_generated/dataModel';
	import type { FunctionReturnType } from 'convex/server';
	type ActiveOrganizationResponse = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;
	type MembersResponse = FunctionReturnType<
		typeof api.organizations.members.queries.getOrganizationMembers
	>;
	type UserResponse = FunctionReturnType<typeof api.users.queries.getUser>;

	// Props
	let {
		initialData
	}: {
		initialData?: {
			activeOrganization: ActiveOrganizationResponse;
			members: MembersResponse;
			user: UserResponse;
		};
	} = $props();

	// Queries
	const userResponse = useQuery(api.users.queries.getUser, {}, { initialData: initialData?.user });
	const organizationResponse = useQuery(
		api.organizations.queries.getActiveOrganization,
		{},
		{ initialData: initialData?.activeOrganization }
	);
	const membersResponse = useQuery(
		api.organizations.members.queries.getOrganizationMembers,
		{},
		{ initialData: initialData?.members }
	);

	// State
	let modalOpen: boolean = $state(false);
	let selectedSuccessor: Id<'users'> | null = $state(null);

	// Derived data
	const currentUser = $derived(userResponse.data);
	const activeOrganization = $derived(organizationResponse.data);
	const members = $derived(membersResponse.data);

	// Organization members excluding current user for successor selection
	const organizationMembers = $derived(
		members?.filter(
			(member) =>
				// Don't include the current user
				member.user._id !== currentUser?._id
		) || []
	);

	/**
	 * Validates form input before submission
	 */
	function validateForm(): boolean {
		if (roles.hasOwnerRole && !selectedSuccessor) {
			toast.error('As the organization owner, you must select a successor before leaving.');
			return false;
		}
		return true;
	}

	/**
	 * Handles the leave organization action
	 */
	async function handleLeaveOrganization(): Promise<void> {
		if (!validateForm()) return;

		if (!activeOrganization?._id) {
			toast.error('No active organization found.');
			return;
		}

		try {
			await client.mutation(api.organizations.members.mutations.leaveOrganization, {
				organizationId: activeOrganization._id,
				// Only send successorId if the user is an owner and a successor is selected
				...(roles.hasOwnerRole && selectedSuccessor ? { successorId: selectedSuccessor } : {})
			});

			modalOpen = false;

			// Navigate to home page after leaving
			goto('/');
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to leave organization. Please try again.'
			);
			console.error(err);
		}
	}

	/**
	 * Handles successor selection change
	 */
	function handleSuccessorChange(e: Event): void {
		const select = e.target as HTMLSelectElement;
		selectedSuccessor = select.value ? (select.value as Id<'users'>) : null;
	}
</script>

{#if activeOrganization && members && members.length > 1}
	<Dialog.Root open={modalOpen} onOpenChange={(open) => (modalOpen = open)}>
		<Dialog.Trigger
			class="btn btn-sm preset-faded-surface-50-950 text-surface-600-400 hover:bg-error-300-700 hover:text-error-950-50 w-fit justify-between gap-1 text-sm"
		>
			Leave organization
		</Dialog.Trigger>

		<Dialog.Content class="md:max-w-108">
			<Dialog.Header>
				<Dialog.Title>Leave organization</Dialog.Title>
			</Dialog.Header>

			<Dialog.Description>
				<p>If you leave organization you'll lose access to all projects and resources.</p>
				{#if roles.hasOwnerRole}
					<p class="my-6">As the owner, you must assign a new owner before leaving.</p>
				{/if}
			</Dialog.Description>

			{#if roles.hasOwnerRole}
				<div class="space-y-2">
					<label for="successor" class="label"> New owner: </label>
					<select
						id="successor"
						value={selectedSuccessor?.toString() || ''}
						onchange={handleSuccessorChange}
						class="select w-full cursor-pointer"
						required={roles.hasOwnerRole}
					>
						<option value="" disabled> Choose a successor </option>
						{#each organizationMembers as member (member.user._id)}
							<option value={member.user._id.toString()}>
								{member.user.name} ({member.user.email})
							</option>
						{/each}
					</select>
				</div>
			{/if}

			<Dialog.Footer>
				<button class="btn preset-tonal" onclick={() => (modalOpen = false)}> Cancel </button>
				<button
					type="button"
					class="btn bg-error-500 hover:bg-error-600 text-white"
					onclick={handleLeaveOrganization}
					disabled={roles.hasOwnerRole && !selectedSuccessor}
				>
					Confirm
				</button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
