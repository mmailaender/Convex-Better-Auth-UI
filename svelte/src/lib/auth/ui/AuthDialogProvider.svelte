<script lang="ts">
	// Components
	import UserProfileHost from '$lib/users/ui/UserProfileHost.svelte';
	import OrganizationProfileHost from '$lib/organizations/ui/OrganizationProfileHost.svelte';

	// API
	import { api } from '$convex/_generated/api';

	// Types
	import type { FunctionReturnType } from 'convex/server';
	import type { authClient as authClientType } from '$lib/auth/api/auth-client';

	// Constants
	import { AUTH_CONSTANTS } from '$convex/auth.constants';

	type GetActiveUserType = FunctionReturnType<typeof api.users.queries.getActiveUser>;
	type ListAccountsType = FunctionReturnType<typeof api.users.queries.listAccounts>;
	type GetActiveOrganizationType = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;
	type ListOrganizationsType = FunctionReturnType<
		typeof api.organizations.queries.listOrganizations
	>;
	type ListInvitationType = FunctionReturnType<
		typeof api.organizations.invitations.queries.listInvitations
	>;
	type Role = typeof authClientType.$Infer.Member.role;

	type AuthProviderProps = {
		/** Initial data for SSR hydration */
		initialData?: {
			activeUser?: GetActiveUserType;
			accountList?: ListAccountsType;
			activeOrganization?: GetActiveOrganizationType;
			organizationList?: ListOrganizationsType;
			invitationList?: ListInvitationType;
			role?: Role;
		};
		/** Child content to render */
		children?: import('svelte').Snippet;
	};

	let { initialData, children }: AuthProviderProps = $props();
</script>

<!-- Render child content -->
{#if children}
	{@render children()}
{/if}

<!-- Global auth-related dialogs -->
<UserProfileHost {initialData} />

{#if AUTH_CONSTANTS.organizations}
	<OrganizationProfileHost {initialData} />
{/if}
