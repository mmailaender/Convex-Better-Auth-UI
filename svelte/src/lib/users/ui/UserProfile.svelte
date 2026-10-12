<script lang="ts">
	import ProfileInfo from '#lib/users/ui/ProfileInfo.svelte';
	import Emails from '#lib/users/ui/Emails.svelte';
	import DeleteUser from '#lib/users/ui/DeleteUser.svelte';
	import Accounts from './Accounts.svelte';
	import ApiKeys from './ApiKeys.svelte';

	// Context
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	const { authConstants } = getAuthContext();

	// Types
	import type { GetActiveUserType, ListAccountsType } from '#lib/auth/types.js';

	let {
		initialData
	}: {
		initialData?: {
			activeUser?: GetActiveUserType;
			accountList?: ListAccountsType;
		};
	} = $props();
</script>

<div class="w-full">
	<div class="flex flex-col gap-3 pb-8">
		<ProfileInfo {initialData} />
		<Emails {initialData} />
	</div>

	<Accounts {initialData} />
	{#if authConstants.apiKeys}
		<ApiKeys />
	{/if}
	<DeleteUser />
</div>
