<script lang="ts">
	// Primitives
	import * as Avatar from '#lib/primitives/ui/avatar/index.js';
	import * as Dialog from '#lib/primitives/ui/dialog/index.js';
	import * as Select from '#lib/primitives/ui/select/index.js';
	import { CopyButton } from '#lib/primitives/ui/copy-button/index.js';
	import { Portal } from '@ark-ui/svelte/portal';
	import { createListCollection } from '@ark-ui/svelte/select';
	// Icons
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';
	// Components
	import OrganizationSelect from '#lib/admin/ui/OrganizationSelect.svelte';
	import UserActionsMenu from '#lib/admin/ui/UserActionsMenu.svelte';
	import UserDialogs from '#lib/admin/ui/UserDialogs.svelte';
	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	import { toast } from 'svelte-sonner';
	// Utils
	import { describeUserAgent } from '#lib/admin/utils/userAgent.js';
	// Types
	import type {
		AdminMembership,
		AdminOrganization,
		OrganizationRole,
		UserDialog
	} from '#lib/admin/types.js';

	let {
		userId,
		onBack
	}: {
		userId: string;
		/** Returns to the users table */
		onBack: () => void;
	} = $props();

	const { api, authConstants } = getAuthContext();
	const client = useConvexClient();
	const auth = useAuth();
	const organizationsEnabled = Boolean(authConstants.organizations);

	const roleCollection = createListCollection({
		items: [
			{ label: 'Member', value: 'member' },
			{ label: 'Admin', value: 'admin' }
		]
	});

	const activeUserResponse = useQuery(api.users.queries.getActiveUser, () =>
		auth.isAuthenticated ? {} : 'skip'
	);
	const detailsQuery = useQuery(api.admin.queries.getUser, () => ({ userId }));
	const details = $derived(detailsQuery.data);
	const user = $derived(details?.user ?? null);
	const sessionsQuery = useQuery(api.admin.queries.listUserSessions, () =>
		user ? { userId: user.id } : 'skip'
	);

	const isSelf = $derived(user?.id === activeUserResponse?.data?._id);
	// Changing the profile or the sessions of another admin needs their admin role removed
	// first: see `assertCanManageUser`
	const canManage = $derived(Boolean(user) && (isSelf || !user?.isAppAdmin));

	let dialog = $state<UserDialog | null>(null);

	// Profile form, filled from the user until edited
	let name = $state('');
	let email = $state('');
	let saving = $state(false);
	let loadedUserId = $state<string | null>(null);
	$effect(() => {
		if (user && user.id !== loadedUserId) {
			loadedUserId = user.id;
			name = user.name;
			email = user.email;
		}
	});
	const isDirty = $derived(
		Boolean(user) && (name.trim() !== user?.name || email.trim().toLowerCase() !== user?.email)
	);

	// Add to organization dialog
	let addOpen = $state(false);
	let addOrganization = $state<AdminOrganization | null>(null);
	let addRole = $state<OrganizationRole>('member');
	let adding = $state(false);
	const memberOrganizationIds = $derived(
		details?.memberships.map((membership) => membership.organization._id) ?? []
	);

	function formatDate(epochMs: number): string {
		return new Date(epochMs).toLocaleDateString();
	}

	function formatDateTime(epochMs: number): string {
		return new Date(epochMs).toLocaleString();
	}

	const banDescription = $derived.by(() => {
		if (!user?.banned) return '';
		const until = user.banExpires ? `until ${formatDateTime(user.banExpires)}` : 'permanently';
		return `Banned ${until}${user.banReason ? `: ${user.banReason}` : '.'}`;
	});

	function isOwner(membership: AdminMembership): boolean {
		return membership.role.split(',').some((role) => role.trim() === 'owner');
	}

	async function run(action: () => Promise<unknown>, success: string, failure: string) {
		try {
			await action();
			toast.success(success);
			return true;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : failure);
			return false;
		}
	}

	async function handleSave(event: SubmitEvent) {
		event.preventDefault();
		if (!user) return;
		saving = true;
		const done = await run(
			() => client.mutation(api.admin.mutations.updateUser, { userId: user.id, name, email }),
			'Saved the profile',
			'Failed to save the profile'
		);
		// Show what the server stored, such as the lowercased email
		if (done) loadedUserId = null;
		saving = false;
	}

	function handleRoleChange(membership: AdminMembership, role: OrganizationRole) {
		if (role === membership.role) return;
		void run(
			() =>
				client.mutation(api.admin.mutations.updateMemberRole, {
					memberId: membership._id,
					role
				}),
			`${user?.name} is now ${role === 'admin' ? 'an admin' : 'a member'} of ${membership.organization.name}`,
			'Failed to change the role'
		);
	}

	function handleRemoveMembership(membership: AdminMembership) {
		void run(
			() => client.mutation(api.admin.mutations.removeMember, { memberId: membership._id }),
			`Removed ${user?.name} from ${membership.organization.name}`,
			'Failed to remove the membership'
		);
	}

	function openAddDialog() {
		addOrganization = null;
		addRole = 'member';
		addOpen = true;
	}

	async function handleAdd(event: SubmitEvent) {
		event.preventDefault();
		if (!user || !addOrganization) return;
		const organization = addOrganization;
		adding = true;
		const done = await run(
			() =>
				client.mutation(api.admin.mutations.addMember, {
					userId: user.id,
					organizationId: organization._id,
					role: addRole
				}),
			`Added ${user.name} to ${organization.name}`,
			'Failed to add to the organization'
		);
		adding = false;
		if (done) addOpen = false;
	}

	function handleRevokeSession(sessionId: string) {
		void run(
			() => client.mutation(api.admin.mutations.revokeUserSession, { sessionId }),
			'Signed out the session',
			'Failed to sign out the session'
		);
	}
</script>

<div class="flex flex-col gap-6 py-4">
	<button type="button" class="btn hover:preset-tonal w-fit gap-2 px-2 text-sm" onclick={onBack}>
		<ArrowLeftIcon class="size-4" aria-hidden="true" />
		Users
	</button>

	{#if detailsQuery.error}
		<div class="text-error-600-400 text-sm">{detailsQuery.error.message}</div>
	{:else if details === undefined}
		<div class="text-surface-600-400 flex items-center gap-2 text-sm" role="status">
			<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
			Loading user...
		</div>
	{:else if !details || !user}
		<div class="text-surface-600-400 text-sm">This user doesn't exist anymore.</div>
	{:else}
		<!-- Header -->
		<header class="flex items-start gap-4">
			<Avatar.Root class="size-16 shrink-0">
				<Avatar.Image src={user.image ?? undefined} alt={user.name} />
				<Avatar.Fallback>
					<Avatar.Marble name={user.name} />
				</Avatar.Fallback>
			</Avatar.Root>
			<div class="flex min-w-0 flex-1 flex-col gap-1">
				<div class="flex flex-wrap items-center gap-2">
					<h2 class="h4 truncate">{user.name}</h2>
					{#if isSelf}
						<span class="badge preset-tonal">You</span>
					{/if}
					{#if user.isAppAdmin}
						<span
							class="badge preset-filled-warning-50-950 border-warning-200-800 border"
							title={user.isBootstrapAdmin
								? 'Admin through the ADMIN_USER_IDS environment variable'
								: undefined}
						>
							Admin
						</span>
					{/if}
					{#if user.banned}
						<span class="badge preset-filled-error-50-950 border-error-200-800 border">Banned</span>
					{/if}
				</div>
				<p class="text-surface-600-400 truncate text-sm">{user.email}</p>
				<div class="text-surface-600-400 flex items-center gap-1 text-xs">
					<span class="shrink-0">User ID</span>
					<code class="truncate">{user.id}</code>
					<CopyButton text={user.id} class="size-6" aria-label="Copy user ID" />
				</div>
			</div>
			<UserActionsMenu {user} {isSelf} onDialog={(next) => (dialog = next)} />
		</header>

		{#if user.banned}
			<div class="card preset-tonal-error border-error-200-800 border p-4 text-sm">
				{banDescription}
			</div>
		{/if}

		<!-- Profile -->
		<section class="card border-surface-300-700 flex flex-col gap-4 border p-4">
			<h3 class="h6">Profile</h3>
			<form class="flex flex-col gap-3" onsubmit={handleSave}>
				<fieldset class="grid gap-3 sm:grid-cols-2" disabled={!canManage || saving}>
					<label class="label">
						<span class="label-text">Name</span>
						<input type="text" class="input" bind:value={name} autocomplete="off" required />
					</label>
					<label class="label">
						<span class="label-text">Email</span>
						<input type="email" class="input" bind:value={email} autocomplete="off" required />
					</label>
				</fieldset>
				<div class="flex flex-wrap items-center justify-between gap-3">
					<p class="text-surface-600-400 text-xs">
						{#if canManage}
							A new email counts as verified, and they sign in with it from now on.
						{:else}
							Remove their admin role to change their profile.
						{/if}
					</p>
					{#if canManage}
						<button
							type="submit"
							class="btn preset-filled-primary-500"
							disabled={!isDirty || saving}
							aria-busy={saving}
						>
							{#if saving}
								<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
								Saving...
							{:else}
								Save
							{/if}
						</button>
					{/if}
				</div>
			</form>
			<dl class="border-surface-300-700 grid gap-3 border-t pt-4 text-sm sm:grid-cols-3">
				<div>
					<dt class="text-surface-600-400 text-xs">Joined</dt>
					<dd>{formatDate(user.createdAt)}</dd>
				</div>
				<div>
					<dt class="text-surface-600-400 text-xs">Email</dt>
					<dd>{user.emailVerified ? 'Verified' : 'Not verified'}</dd>
				</div>
				<div>
					<dt class="text-surface-600-400 text-xs">Role</dt>
					<dd>
						{#if user.isBootstrapAdmin}
							Admin (ADMIN_USER_IDS)
						{:else}
							{user.isAppAdmin ? 'Admin' : 'User'}
						{/if}
					</dd>
				</div>
			</dl>
		</section>

		<!-- Organizations -->
		{#if organizationsEnabled}
			<section class="card border-surface-300-700 flex flex-col gap-3 border p-4">
				<div class="flex items-center justify-between gap-3">
					<h3 class="h6">Organizations</h3>
					<button type="button" class="btn btn-sm preset-tonal gap-2" onclick={openAddDialog}>
						<PlusIcon class="size-4" aria-hidden="true" />
						Add to organization
					</button>
				</div>
				{#if details.memberships.length === 0}
					<p class="text-surface-600-400 text-sm">Not a member of any organization.</p>
				{:else}
					<ul class="flex flex-col">
						{#each details.memberships as membership (membership._id)}
							<li
								class="border-surface-300-700 flex items-center gap-3 border-t py-3 first:border-t-0"
							>
								<Avatar.Root class="size-8 shrink-0">
									<Avatar.Image
										src={membership.organization.logo ?? undefined}
										alt={membership.organization.name}
									/>
									<Avatar.Fallback>
										<Avatar.Marble name={membership.organization.name} />
									</Avatar.Fallback>
								</Avatar.Root>
								<div class="flex min-w-0 flex-1 flex-col">
									<span class="truncate text-sm">{membership.organization.name}</span>
									<span class="text-surface-600-400 truncate text-xs">
										{membership.organization.slug}
									</span>
								</div>
								{#if isOwner(membership)}
									<span
										class="badge preset-filled-primary-50-950 border-primary-200-800 border"
										title="The owner keeps their role and can't be removed"
									>
										Owner
									</span>
									<!-- Keeps the role column aligned with the rows that have a remove button -->
									<span class="size-8 shrink-0" aria-hidden="true"></span>
								{:else}
									<div class="w-32 shrink-0">
										<Select.Root
											collection={roleCollection}
											value={[membership.role]}
											onSelect={(details) =>
												handleRoleChange(membership, details.value as OrganizationRole)}
										>
											<Select.Trigger
												class="w-full text-sm"
												aria-label={`Role in ${membership.organization.name}`}
											/>
											<Portal>
												<Select.Content>
													{#each roleCollection.items as item (item.value)}
														<Select.Item {item}>
															<Select.ItemText>{item.label}</Select.ItemText>
															<Select.ItemIndicator>✓</Select.ItemIndicator>
														</Select.Item>
													{/each}
												</Select.Content>
											</Portal>
										</Select.Root>
									</div>
									<button
										type="button"
										class="btn-icon hover:preset-tonal size-8 shrink-0"
										aria-label={`Remove from ${membership.organization.name}`}
										title={`Remove from ${membership.organization.name}`}
										onclick={() => handleRemoveMembership(membership)}
									>
										<XIcon class="size-4" aria-hidden="true" />
									</button>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/if}

		<!-- Sessions -->
		<section class="card border-surface-300-700 flex flex-col gap-3 border p-4">
			<h3 class="h6">Active sessions</h3>
			{#if sessionsQuery.error}
				<p class="text-error-600-400 text-sm">{sessionsQuery.error.message}</p>
			{:else if !sessionsQuery.data}
				<p class="text-surface-600-400 flex items-center gap-2 text-sm" role="status">
					<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
					Loading sessions...
				</p>
			{:else if sessionsQuery.data.length === 0}
				<p class="text-surface-600-400 text-sm">Not signed in anywhere.</p>
			{:else}
				<ul class="flex flex-col">
					{#each sessionsQuery.data as session (session.id)}
						<li
							class="border-surface-300-700 flex items-center gap-3 border-t py-3 first:border-t-0"
						>
							<div class="flex min-w-0 flex-1 flex-col">
								<div class="flex items-center gap-2">
									<span class="truncate text-sm">{describeUserAgent(session.userAgent)}</span>
									{#if session.impersonatedBy}
										<span class="badge preset-tonal shrink-0">Impersonation</span>
									{/if}
								</div>
								<span class="text-surface-600-400 truncate text-xs">
									{session.ipAddress ? `${session.ipAddress} · ` : ''}Signed in {formatDateTime(
										session.createdAt
									)}
								</span>
							</div>
							{#if canManage}
								<button
									type="button"
									class="btn btn-sm hover:preset-tonal shrink-0 gap-2"
									onclick={() => handleRevokeSession(session.id)}
								>
									<LogOutIcon class="size-4" aria-hidden="true" />
									Sign out
								</button>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}

	<UserDialogs {user} bind:dialog onDeleted={onBack} />

	<!-- Add to organization dialog -->
	<Dialog.Root bind:open={addOpen}>
		<Dialog.Content class="md:max-w-108">
			<Dialog.Header>
				<Dialog.Title>Add {user?.name} to an organization</Dialog.Title>
				<Dialog.Description class="text-surface-700-300">
					They become a member right away, without an invitation.
				</Dialog.Description>
			</Dialog.Header>
			<form id="admin-add-membership" class="flex w-full flex-col gap-3" onsubmit={handleAdd}>
				<div class="label">
					<label class="label-text" for="admin-add-membership-organization">Organization</label>
					<OrganizationSelect
						id="admin-add-membership-organization"
						bind:value={addOrganization}
						excludeIds={memberOrganizationIds}
					/>
				</div>
				<label class="label">
					<span class="label-text">Role</span>
					<select class="select" bind:value={addRole}>
						<option value="member">Member</option>
						<option value="admin">Admin</option>
					</select>
				</label>
			</form>
			<Dialog.Footer>
				<Dialog.Close class="btn preset-tonal" disabled={adding}>Cancel</Dialog.Close>
				<button
					type="submit"
					form="admin-add-membership"
					class="btn preset-filled-primary-500"
					disabled={adding || !addOrganization}
					aria-busy={adding}
				>
					{#if adding}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Adding...
					{:else}
						Add
					{/if}
				</button>
			</Dialog.Footer>
			<Dialog.CloseX />
		</Dialog.Content>
	</Dialog.Root>
</div>
