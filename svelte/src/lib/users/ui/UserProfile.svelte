<script lang="ts">
	import ProfileInfo from '$lib/users/ui/ProfileInfo.svelte';
	import Emails from '$lib/users/ui/Emails.svelte';
	import DeleteUser from '$lib/users/ui/DeleteUser.svelte';
	import Accounts from './Accounts.svelte';

	import type { FunctionReturnType } from 'convex/server';
	import type { api } from '$convex/_generated/api';
	type GetActiveUserType = FunctionReturnType<typeof api.users.queries.getActiveUser>;
	type ListAccountsType = FunctionReturnType<typeof api.users.queries.listAccounts>;
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

	<div class="flex h-full flex-col">
		<Accounts {initialData} />
	</div>
	<div>
		<DeleteUser />
	</div>
</div>
