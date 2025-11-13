<script lang="ts">
	import ProfileInfo from '$lib/users/ui/ProfileInfo.svelte';
	import Emails from '$lib/users/ui/Emails.svelte';
	import DeleteUser from '$lib/users/ui/DeleteUser.svelte';
	import Accounts from './Accounts.svelte';
	import ApiKeys from './ApiKeys.svelte';

	import type { FunctionReturnType } from 'convex/server';
	import type { api } from '$convex/_generated/api';
	type GetActiveUserType = FunctionReturnType<typeof api.users.queries.getActiveUser>;
	type ListAccountsType = FunctionReturnType<typeof api.users.queries.listAccounts>;

	// Constants
	import { AUTH_CONSTANTS } from '$convex/auth.constants';

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
	{#if AUTH_CONSTANTS.apiKeys}
		<ApiKeys />
	{/if}
	<DeleteUser />
</div>
