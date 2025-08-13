<script lang="ts">
	import { goto } from '$app/navigation';
	// Primitives
	import * as Dialog from '$lib/primitives/ui/dialog';
	import { toast } from 'svelte-sonner';

	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { useRoles } from '$lib/organizations/api/roles.svelte';
	const roles = useRoles();
	const client = useConvexClient();

	// Types
	import type { FunctionReturnType } from 'convex/server';
	type ActiveOrganizationResponse = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;
	type ActiveUserResponse = FunctionReturnType<typeof api.users.queries.getActiveUser>;

	// Props
	let {
		initialData
	}: {
		initialData?: {
			activeOrganization?: ActiveOrganizationResponse;
			activeUser?: ActiveUserResponse;
		};
	} = $props();

	// Queries
	const activeUserResponse = useQuery(
		api.users.queries.getActiveUser,
		{},
		{ initialData: initialData?.activeUser }
	);
	const activeOrganizationResponse = useQuery(
		api.organizations.queries.getActiveOrganization,
		{},
		{ initialData: initialData?.activeOrganization }
	);

	// State
	let isOpen: boolean = $state(false);
	let selectedSuccessor: string | null = $state(null);

	// Derived data
	const activeUser = $derived(activeUserResponse.data);
	const activeOrganization = $derived(activeOrganizationResponse.data);
	const members = $derived(activeOrganization?.members);

	// Organization members excluding current user for successor selection
	const organizationMembers = $derived(
		members?.filter(
			(member) =>
				// Don't include the current user
				member.id !== activeUser?.id
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

		if (!activeOrganization?.id) {
			toast.error('No active organization found.');
			return;
		}

		try {
			await client.mutation(api.organizations.members.mutations.leaveOrganization, {
				// Only send successorMemberId if the user is an owner and a successor is selected
				...(roles.hasOwnerRole && selectedSuccessor ? { successorMemberId: selectedSuccessor } : {})
			});

			isOpen = false;

			// Navigate to home page after leaving
			goto('/');
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to leave organization. Please try again.'
			);
			console.error(err);
		}
	}
</script>

{#if activeOrganization && members && members.length > 1}
	<Dialog.Root bind:open={isOpen}>
		<Dialog.Trigger
			class="btn btn-sm preset-faded-surface-50-950 text-surface-600-400 hover:bg-error-300-700 hover:text-error-950-50 w-fit justify-between gap-1 text-sm"
		>
			Leave organization
		</Dialog.Trigger>

		<Dialog.Content class="md:max-w-108">
			<Dialog.Header>
				<Dialog.Title>Leave organization</Dialog.Title>
			</Dialog.Header>

			<Dialog.Description class="flex flex-col gap-2">
				<span> If you leave organization you'll lose access to all projects and resources. </span>
				{#if roles.hasOwnerRole}
					<span class="my-2">As the owner, you must assign a new owner before leaving.</span>
				{/if}
			</Dialog.Description>

			{#if roles.hasOwnerRole}
				<div class="space-y-2">
					<label for="successor" class="label"> New owner: </label>
					<select
						id="successor"
						bind:value={selectedSuccessor}
						class="select w-full cursor-pointer"
						required={roles.hasOwnerRole}
					>
						<option value="" disabled> Choose a successor </option>
						<!-- TODO: Filter out the current user by email as the id is inconsistent between Convex and Better Auth. Replace with id once fixed -->
						{#each organizationMembers.filter((member) => member.user.email !== activeUser?.email) as member (member.id)}
							<option value={member.id}>
								{member.user.name} ({member.user.email})
							</option>
						{/each}
					</select>
				</div>
			{/if}

			<Dialog.Footer>
				<button class="btn preset-tonal" onclick={() => (isOpen = false)}> Cancel </button>
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
