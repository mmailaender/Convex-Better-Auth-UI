<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import type { User } from '$lib/db/schema/types/custom';
	import type { Document } from '$lib/db/schema/types/system';
    import socialIcons, { type SocialIcons } from './social/icons';

	import { page } from '$app/state';

	let getSocialIcon = ({ name }: { name: keyof SocialIcons }) => socialIcons[name];

	let user: Document<User> | null = $derived(page.data.user ? JSON.parse(page.data.user) : null);
</script>

{#if user}
	<div
		class="mx-auto flex w-full max-w-4xl flex-col rounded-container shadow-lg bg-surface-100-900 md:flex-row"
	>
		<!-- Sidebar -->
		<aside class="w-full border-r p-6 bg-surface-200-800 border-surface-400-600 md:w-1/4">
			<ul>
				<li class="mb-4 font-semibold text-surface-800-200">Account</li>
				<li class="text-surface-600-400">Profile</li>
				<li class="mt-4 text-surface-800-200">Security</li>
			</ul>
		</aside>

		<!-- Profile Content -->
		<div class="w-full p-6 md:w-3/4">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-lg font-bold text-surface-800-200">Profile details</h2>
				<button class="btn text-sm text-primary-500 hover:underline">Update profile</button>
			</div>

			<!-- Profile Info -->
			<div class="mb-6 flex items-center gap-4">
				<Avatar src={user.avatar} name={user.firstName + ' ' + user.lastName} size="size-16" />
				<div>
					<p class="font-medium text-surface-800-200">{user.firstName + ' ' + user.lastName}</p>
				</div>
			</div>

			<!-- Email Addresses -->
			<div class="mb-6">
				<h3 class="mb-4 font-bold text-surface-800-200">Email address</h3>
				<ul>
					<li class="mb-2 flex items-center justify-between">
						<span class="text-surface-800-200">{user.email}</span>
					</li>
				</ul>
				<button class="mt-2 text-primary-500 hover:underline">Update email address</button>
			</div>

			<!-- Connected Accounts -->
			<div>
				<h3 class="mb-4 font-bold text-surface-800-200">Connected accounts</h3>
				<ul>
					{#each user.accounts as account}
						{#if account.socialProvider}
							<li class="mb-2 flex items-center justify-between">
								<span class="flex items-center text-surface-800-200">
                                    {getSocialIcon(account.socialProvider.name)}
									{account.socialProvider.name} • {account.socialProvider.email}
								</span>
							</li>
						{/if}
					{/each}
				</ul>
				<button class="mt-2 text-primary-500 hover:underline">+ Connect account</button>
			</div>
		</div>
	</div>
{/if}
