<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { LogOut, Plus } from 'lucide-svelte';
	import SignOutButton from './SignOutButton.svelte';
	import { Popover } from '@skeletonlabs/skeleton-svelte';
	import type { User } from '$lib/db/schema/types/custom';
	import type { Document } from '$lib/db/schema/types/system';

	import { page } from '$app/state';

	let user: Document<User> | null = $derived(page.data.user ? JSON.parse(page.data.user) : null);

	const userAccounts = $state([
		{
			firstName: 'Cameron',
			lastName: 'Walker',
			email: 'cameron@work.com',
			avatar: 'https://via.placeholder.com/40'
		},
		{
			firstName: 'Cameron',
			lastName: 'Walker',
			email: 'walker@personal.com',
			avatar: 'https://via.placeholder.com/40'
		}
	]);

	let openState = $state(false);
</script>

{#if user}
	<Popover
		bind:open={openState}
		positioning={{ placement: 'bottom-end' }}
		triggerBase="btn"
		contentBase="card bg-surface-200-800 max-w-[320px]"
	>
		{#snippet trigger()}<Avatar
				src={user.image}
				name={user.firstName + ' ' + user.lastName}
			/>{/snippet}
		{#snippet content()}
			<ul role="list" class="space-y-1">
				<li>
					<div class="flex gap-x-3 rounded-md p-4 text-sm/6 font-semibold text-surface-700-300">
						<Avatar
							src={user.image}
							name={user.firstName + ' ' + user.lastName}
							size="size-10"
						/>
						<div class="flex flex-col gap-3">
							<div class="flex-1">
								<p class="font-medium">{user.firstName + ' ' + user.lastName}</p>
								<p class="text-sm">{user.email}</p>
							</div>
							<div class="flex space-x-2">
								<button class="btn preset-outlined-surface-500"> Manage account </button>
								<SignOutButton class="btn preset-outlined-surface-500" />
							</div>
						</div>
					</div>
				</li>

				{#each userAccounts as account}
					<li>
						<a
							href="#"
							class="group flex gap-x-3 rounded-md p-4 text-sm/6 font-semibold text-surface-700-300 hover:bg-gray-50 hover:text-primary-600-400"
						>
							<Avatar
								src={account.avatar}
								name={account.firstName + ' ' + account.lastName}
								size="size-10"
							/>
							<div class="flex flex-col gap-3">
								<div class="flex-1">
									<p class="font-medium">{account.firstName + ' ' + account.lastName}</p>
									<p class="text-sm">{account.email}</p>
								</div>
							</div>
						</a>
					</li>
				{/each}
				<a
					href="/sign-in"
					class="flex items-center gap-x-5 rounded-md p-4 pl-6 text-sm/6 font-semibold text-surface-700-300 hover:bg-gray-50 hover:text-primary-600-400"
				>
					<Plus class="rounded-full bg-surface-700-300 text-surface-300-700" /> Add account
				</a>
				<!-- TODO: Call signOutAll + we need to add in local storage or as session which accounts are used, 
			  so if the user clicks on this account, the tokens get checked and if not valid, he is redirected to sign in 
			  (although he has already an active session) -->
				{#if userAccounts.length > 1}
					<button
						class="flex items-center w-full gap-x-6 rounded-md p-4 pl-7 text-sm/6 font-semibold text-surface-700-300 hover:bg-gray-50 hover:text-primary-600-400"
					>
						<LogOut class="size-4" /> Sign out from all accounts
					</button>
				{/if}
			</ul>
		{/snippet}
	</Popover>
{:else}
	<a href="/sign-in" class="btn preset-filled-primary-500 "> Sign in </a>
{/if}
