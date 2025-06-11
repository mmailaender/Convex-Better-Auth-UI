<script lang="ts">
	/** UI **/
	// Primitives
	import * as Tabs from '$lib/primitives/ui/tabs';
	// Icons
	import { Bolt, ChevronLeft, ChevronRight, UserIcon, Wallet } from '@lucide/svelte';
	// Components
	import OrganizationInfo from '$lib/organizations/ui/OrganizationInfo.svelte';
	import DeleteOrganization from '$lib/organizations/ui/DeleteOrganization.svelte';
	import MembersAndInvitations from '$lib/organizations/ui/MembersAndInvitations.svelte';
	import LeaveOrganization from '$lib/organizations/ui/LeaveOrganization.svelte';

	// API
	import { createRoles } from '$lib/organizations/api/roles.svelte';
	const roles = createRoles();

	// Types
	type OrganizationProfileProps = {
		/**
		 * Optional callback that will be called when an organization is successfully deleted
		 */
		onSuccessfulDelete?: (() => void) | undefined;
	};

	const { onSuccessfulDelete }: OrganizationProfileProps = $props();

	// State
	let currentTab: string = $state('general');
	let mobileTab: string = $state('');

	function handleTabChange(value: string) {
		// slight delay to allow tab state to update before closing
		setTimeout(() => (mobileTab = value), 10);
	}
</script>

<Tabs.Root value="general" orientation="vertical" class="relative h-full overflow-hidden">
	<!-- Desktop layout -->
	<div class="hidden h-full w-full md:flex">
		<div class="w-56">
			<div class="bg-surface-50 dark:bg-surface-900 sm:bg-surface-300-700 h-full w-full p-2">
				<div class="px-3 py-4 text-2xl font-medium md:text-xl">Organization</div>
				<Tabs.List class="flex flex-col pt-8 md:pt-0">
					<Tabs.Trigger
						value="general"
						onclick={() => handleTabChange('general')}
						class="sm:data-[state=active]:bg-surface-400-600/50 gap-3 data-[state=active]:bg-transparent data-[state=active]:text-inherit md:gap-2 md:px-2"
					>
						<div
							class="bg-surface-300-700 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-6 md:w-6 md:bg-transparent"
						>
							<Bolt />
						</div>
						<span class="w-full">General</span>
						<ChevronRight class="flex md:hidden" />
					</Tabs.Trigger>

					<div class="flex h-2 w-full items-center justify-center px-3 md:hidden">
						<hr class="border-0.5 border-surface-200-800 w-full" />
					</div>

					{#if roles.isOwnerOrAdmin}
						<Tabs.Trigger
							value="members"
							onclick={() => handleTabChange('members')}
							class="sm:data-[state=active]:bg-surface-400-600/50 gap-3 data-[state=active]:bg-transparent data-[state=active]:text-inherit md:gap-2 md:px-2"
						>
							<div
								class="bg-surface-300-700 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-6 md:w-6 md:bg-transparent"
							>
								<UserIcon />
							</div>
							<span class="w-full">Members</span>
							<ChevronRight class="flex md:hidden" />
						</Tabs.Trigger>

						<div class="flex h-2 w-full items-center justify-center px-3 md:hidden">
							<hr class="border-0.5 border-surface-200-800 w-full" />
						</div>

						<Tabs.Trigger
							value="billing"
							onclick={() => handleTabChange('billing')}
							class="sm:data-[state=active]:bg-surface-400-600/50 gap-3 data-[state=active]:bg-transparent data-[state=active]:text-inherit md:gap-2 md:px-2"
						>
							<div
								class="bg-surface-300-700 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-6 md:w-6 md:bg-transparent"
							>
								<Wallet />
							</div>
							<span class="w-full">Billing</span>
							<ChevronRight class="flex md:hidden" />
						</Tabs.Trigger>
					{/if}
				</Tabs.List>
			</div>
		</div>
		<div class="flex-1">
			<Tabs.Content value="general" class="flex h-full flex-col">
				<OrganizationInfo />
				<div class="pt-16">
					<LeaveOrganization />
					<DeleteOrganization {onSuccessfulDelete} />
				</div>
			</Tabs.Content>
			{#if roles.isOwnerOrAdmin}
				<Tabs.Content value="members">
					<MembersAndInvitations />
				</Tabs.Content>
				<Tabs.Content value="billing">
					<h6
						class="border-surface-300-700 text-surface-700-300 w-full border-b pb-6 text-center text-sm font-medium sm:text-left"
					>
						Billing
					</h6>
				</Tabs.Content>
			{/if}
		</div>
	</div>

	<!-- Mobile layout -->
	<div class="relative h-full w-full md:hidden">
		<div
			class="bg-surface-50 dark:bg-surface-900 sm:bg-surface-300-700 h-full w-full transform p-2 transition-transform duration-300 {mobileTab
				? '-translate-x-full'
				: 'translate-x-0'} md:translate-x-0"
		>
			<div class="px-3 py-4 text-2xl font-medium md:text-xl">Organization</div>
			<Tabs.List class="flex flex-col pt-8 md:pt-0">
				<Tabs.Trigger
					value="general"
					onclick={() => handleTabChange('general')}
					class="sm:data-[state=active]:bg-surface-400-600/50 gap-3 data-[state=active]:bg-transparent data-[state=active]:text-inherit md:gap-2 md:px-2"
				>
					<div
						class="bg-surface-300-700 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-6 md:w-6 md:bg-transparent"
					>
						<Bolt />
					</div>
					<span class="w-full">General</span>
					<ChevronRight class="flex md:hidden" />
				</Tabs.Trigger>

				<div class="flex h-2 w-full items-center justify-center px-3 md:hidden">
					<hr class="border-0.5 border-surface-200-800 w-full" />
				</div>

				{#if roles.isOwnerOrAdmin}
					<Tabs.Trigger
						value="members"
						onclick={() => handleTabChange('members')}
						class="sm:data-[state=active]:bg-surface-400-600/50 gap-3 data-[state=active]:bg-transparent data-[state=active]:text-inherit md:gap-2 md:px-2"
					>
						<div
							class="bg-surface-300-700 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-6 md:w-6 md:bg-transparent"
						>
							<UserIcon />
						</div>
						<span class="w-full">Members</span>
						<ChevronRight class="flex md:hidden" />
					</Tabs.Trigger>

					<div class="flex h-2 w-full items-center justify-center px-3 md:hidden">
						<hr class="border-0.5 border-surface-200-800 w-full" />
					</div>

					<Tabs.Trigger
						value="billing"
						onclick={() => handleTabChange('billing')}
						class="sm:data-[state=active]:bg-surface-400-600/50 gap-3 data-[state=active]:bg-transparent data-[state=active]:text-inherit md:gap-2 md:px-2"
					>
						<div
							class="bg-surface-300-700 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-6 md:w-6 md:bg-transparent"
						>
							<Wallet />
						</div>
						<span class="w-full">Billing</span>
						<ChevronRight class="flex md:hidden" />
					</Tabs.Trigger>
				{/if}
			</Tabs.List>
		</div>

		{#if mobileTab}
			<div
				class="flex transform flex-col gap-4 px-4 py-6 transition-transform duration-300 {mobileTab
					? 'translate-x-0'
					: 'translate-x-full'} bg-surface-100-900 absolute inset-0 md:translate-x-full"
			>
				<button
					class="ring-offset-background focus:ring-ring hover:bg-surface-300-700 absolute top-5 left-4 rounded-lg p-2 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
					onclick={() => (mobileTab = '')}
				>
					<ChevronLeft />
				</button>

				{#if mobileTab === 'general'}
					<OrganizationInfo />
					<DeleteOrganization {onSuccessfulDelete} />
					<LeaveOrganization />
				{:else if mobileTab === 'members'}
					<MembersAndInvitations />
				{:else if mobileTab === 'billing'}
					<h6
						class="border-surface-300-700 text-surface-700-300 border-b pb-6 text-center text-sm font-medium sm:text-left"
					>
						Billing
					</h6>
				{/if}
			</div>
		{/if}
	</div>
</Tabs.Root>
