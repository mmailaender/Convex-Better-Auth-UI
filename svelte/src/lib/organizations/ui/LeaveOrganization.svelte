<script lang="ts">
	import { goto } from '$app/navigation';
	// Primitives
	import * as Dialog from '$lib/primitives/ui/dialog';
	import { toast } from 'svelte-sonner';
	import * as Select from '$lib/primitives/ui/select';
	import { createListCollection } from '@ark-ui/svelte/select';

	// Icons
	import Loader2Icon from '@lucide/svelte/icons/loader-2';

	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { useRoles } from '$lib/organizations/api/roles.svelte';
	import { ConvexError } from 'convex/values';
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
	let isLeaving: boolean = $state(false);

	// Derived data
	const activeUser = $derived(activeUserResponse.data);
	const activeOrganization = $derived(activeOrganizationResponse.data);
	const members = $derived(activeOrganization?.members);

	// Organization members excluding current user for successor selection
	const organizationMembers = $derived(
		members?.filter(
			(member) =>
				// Don't include the current user
				member.userId !== activeUser?._id
		) || []
	);

	// Successor select
	let selectedSuccessor = $state<string[]>([]);
	const successorCollection = $derived(
		createListCollection({
			items: organizationMembers.map((member) => ({
				label: `${member.user.name} (${member.user.email})`,
				value: member.id
			}))
		})
	);

	/**
	 * Validates form input before submission
	 */
	function validateForm(): boolean {
		if (roles.hasOwnerRole && selectedSuccessor.length === 0) {
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

		isLeaving = true;

		try {
			await client.mutation(api.organizations.members.mutations.leaveOrganization, {
				// Only send successorMemberId if the user is an owner and a successor is selected
				...(roles.hasOwnerRole && selectedSuccessor.length > 0
					? { successorMemberId: selectedSuccessor[0] }
					: {})
			});

			isOpen = false;

			toast.success('Successfully left the organization.');
			// Navigate to home page after leaving
			goto('/');
		} catch (err) {
			if (err instanceof ConvexError) {
				toast.error(err.data);
			} else {
				toast.error(
					err instanceof Error ? err.message : 'Failed to leave organization. Please try again.'
				);
			}
			console.error(err);
		} finally {
			isLeaving = false;
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
				<div class="w-full space-y-2">
					<label for="successor" class="label"> New owner: </label>
					<Select.Root collection={successorCollection} bind:value={selectedSuccessor}>
						<Select.Trigger class="w-full" placeholder="Choose a successor" />
						<Select.Content>
							{#each successorCollection.items as item (item.value)}
								<Select.Item {item}>
									<Select.ItemText>{item.label}</Select.ItemText>
									<Select.ItemIndicator>✓</Select.ItemIndicator>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}

			<Dialog.Footer>
				<button class="btn preset-tonal" onclick={() => (isOpen = false)} disabled={isLeaving}>
					Cancel
				</button>
				<button
					type="button"
					class="btn bg-error-500 hover:bg-error-600 text-white"
					onclick={handleLeaveOrganization}
					disabled={isLeaving || (roles.hasOwnerRole && !selectedSuccessor)}
					aria-busy={isLeaving}
				>
					{#if isLeaving}
						<Loader2Icon class="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
						Leaving...
					{:else}
						Confirm
					{/if}
				</button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
