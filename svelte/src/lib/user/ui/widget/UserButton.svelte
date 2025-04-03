<script lang="ts">
	import { LogOut, Plus } from 'lucide-svelte';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { Popover } from '@skeletonlabs/skeleton-svelte';

	import SignOutButton from '$lib/auth/ui/widget/SignOutButton.svelte';

	import type { User } from '$lib/db/schema/types/custom';

	import { page } from '$app/state';

	let user: User | null = $derived(page.data.user ? JSON.parse(page.data.user) : null);

	let openState = $state(false);
	let showUserProfile = $state(false);

	function toggleUserProfile() {
		openState = false;
		showUserProfile = !showUserProfile;
	}

	function handleSignOut() {
		openState = false;
	}

	function setOpenState(value: boolean) {
		openState = value;
	}
</script>

{#if user}
	<Popover
		open={openState}
		onOpenChange={(e) => (openState = e.open)}
		positioning={{ placement: 'bottom-end' }}
		triggerBase="btn"
		contentBase="card bg-surface-200-800 max-w-100"
	>
		{#snippet trigger()}
			<Avatar src={user.avatar} name={user.firstName + ' ' + user.lastName} size="size-10" />
		{/snippet}
		{#snippet content()}
			<ul role="list" class="space-y-1">
				<li>
					<div
						class="rounded-base text-surface-700-300 border-surface-700-300 flex gap-x-3 p-4 text-sm/6 font-semibold"
					>
						<Avatar src={user.avatar} name={user.firstName + ' ' + user.lastName} size="size-10" />
						<div class="flex max-w-90 flex-col gap-3">
							<div class="flex-1">
								<p class="font-medium">{user.firstName + ' ' + user.lastName}</p>
								<p class="text-sm">{user.primaryEmail}</p>
							</div>
							<div class="flex space-x-2">
								<a
									href="/user-profile"
									class="btn preset-outlined-surface-500"
									onclick={toggleUserProfile}>Manage account</a
								>
								<SignOutButton class="btn preset-outlined-surface-500" onSignOut={handleSignOut} />
							</div>
						</div>
					</div>
				</li>
			</ul>
		{/snippet}
	</Popover>
{:else}
	<a href="/sign-in" class="btn preset-filled-primary-500"> Sign in </a>
{/if}
