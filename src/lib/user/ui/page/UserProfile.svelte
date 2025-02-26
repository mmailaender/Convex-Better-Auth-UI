<script lang="ts">
	import { page } from '$app/state';

	import Sidebar from '$lib/primitives/ui/Sidebar.svelte';
	import ProfileInfo from '$lib/user/ui/widget/ProfileInfo.svelte';
	import EmailAddresses from '$lib/email/ui/widget/EmailAddresses.svelte';
	import VerificationFlow from '$lib/email/ui/widget/EmailVerification.svelte';
	import ConnectedAccounts from '$lib/account/ui/widget/ConnectedAccounts.svelte';
	import DeleteUser from '$lib/user/ui/widget/DeleteUser.svelte';

	import type { User } from '$lib/db/schema/types/custom';

	let user: User = $state(JSON.parse(page.data.user));
</script>

<div
	class="rounded-container bg-surface-100-900 mx-auto flex w-full max-w-4xl flex-col shadow-lg md:flex-row"
>
	<Sidebar currentSection="Profile" />
	<div class="w-full p-6 md:w-3/4">
		<h2 class="text-surface-800-200 mb-6 text-lg font-bold">Profile details</h2>
		<ProfileInfo bind:user />
		<EmailAddresses bind:user />
		<VerificationFlow bind:user />
		<ConnectedAccounts bind:user />
		<div class="flex justify-end">
			<DeleteUser userId={user.id} />
		</div>
	</div>
</div>
