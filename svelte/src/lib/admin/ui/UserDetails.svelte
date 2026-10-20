<script lang="ts">
	// Svelte
	import { untrack } from 'svelte';
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
	import LockOpenIcon from '@lucide/svelte/icons/lock-open';
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
		backLabel = 'Users',
		onBack,
		onViewOrganization
	}: {
		userId: string;
		/** Label of the back button, naming where it returns to */
		backLabel?: string;
		/** Returns to where the admin came from */
		onBack: () => void;
		/** Opens the page of an organization */
		onViewOrganization: (organizationId: string) => void;
	} = $props();

	const { api, authConstants } = getAuthContext();
	const client = useConvexClient();
	const auth = useAuth();
	const organizationsEnabled = Boolean(authConstants.organizations);
	const formId = $props.id();

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
	let unbanning = $state(false);

	// The newest sessions, until the admin asks for all of them
	const SESSIONS_SHOWN = 5;
	let showAllSessions = $state(false);
	const sessions = $derived(
		showAllSessions ? sessionsQuery.data : sessionsQuery.data?.slice(0, SESSIONS_SHOWN)
	);

	// Profile form. Fields the admin hasn't edited follow the user as it changes elsewhere
	let name = $state('');
	let email = $state('');
	let saving = $state(false);
	let loaded: { id: string; name: string; email: string } | null = null;
	$effect(() => {
		if (!user) return;
		const next = { id: user.id, name: user.name, email: user.email };
		untrack(() => {
			const otherUser = loaded?.id !== next.id;
			if (otherUser || name === loaded?.name) name = next.name;
			if (otherUser || email === loaded?.email) email = next.email;
			loaded = next;
		});
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

	/** A member's roles, which Better Auth stores comma-separated. */
	function rolesOf(membership: AdminMembership): string[] {
		return membership.role.split(',').map((role) => role.trim());
	}

	function isOwner(membership: AdminMembership): boolean {
		return rolesOf(membership).includes('owner');
	}

	/** The role the role select shows: a member with several roles shows the highest. */
	function roleOf(membership: AdminMembership): OrganizationRole {
		return rolesOf(membership).includes('admin') ? 'admin' : 'member';
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
		// Only the edited fields, so a change made elsewhere meanwhile isn't overwritten
		const done = await run(
			() =>
				client.mutation(api.admin.mutations.updateUser, {
					userId: user.id,
					name: name.trim() !== user.name ? name : undefined,
					email: email.trim().toLowerCase() !== user.email ? email : undefined
				}),
			'Saved the profile',
			'Failed to save the profile'
		);
		// Show what the server stored, such as the lowercased email
		if (done && user) {
			name = user.name;
			email = user.email;
			loaded = { id: user.id, name: user.name, email: user.email };
		}
		saving = false;
	}

	function handleRoleChange(membership: AdminMembership, role: OrganizationRole) {
		if (role === membership.role) return;
		// Selecting what a member with several roles already shows makes that their only role
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

	async function handleUnban() {
		if (!user) return;
		const { id, name } = user;
		unbanning = true;
		await run(
			() => client.mutation(api.admin.mutations.unbanUser, { userId: id }),
			`Unbanned ${name}`,
			'Failed to unban user'
		);
		unbanning = false;
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
		{backLabel}
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
			<div
				class="card preset-tonal-error border-error-200-800 flex flex-wrap items-center justify-between gap-3 border p-4 text-sm"
			>
				<p class="min-w-0">{banDescription}</p>
				{#if !isSelf}
					<button
						type="button"
						class="btn btn-sm preset-filled-surface-50-950 shrink-0 gap-2"
						onclick={handleUnban}
						disabled={unbanning}
						aria-busy={unbanning}
					>
						{#if unbanning}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						{:else}
							<LockOpenIcon class="size-4" aria-hidden="true" />
						{/if}
						Lift ban
					</button>
				{/if}
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
					{#if canManage}
						<button type="button" class="btn btn-sm preset-tonal gap-2" onclick={openAddDialog}>
							<PlusIcon class="size-4" aria-hidden="true" />
							Add to organization
						</button>
					{/if}
				</div>
				{#if !canManage}
					<p class="text-surface-600-400 text-xs">
						Remove their admin role to change their organizations.
					</p>
				{/if}
				{#if details.memberships.length === 0}
					<p class="text-surface-600-400 text-sm">Not a member of any organization.</p>
				{:else}
					<ul class="flex flex-col">
						{#each details.memberships as membership (membership._id)}
							<li
								class="border-surface-300-700 flex items-center gap-3 border-t py-3 first:border-t-0"
							>
								<Avatar.Root class="rounded-container size-8 shrink-0">
									<Avatar.Image
										src={membership.organization.logo ?? undefined}
										alt={membership.organization.name}
									/>
									<Avatar.Fallback class="rounded-container">
										<Avatar.Marble name={membership.organization.name} />
									</Avatar.Fallback>
								</Avatar.Root>
								<div class="flex min-w-0 flex-1 flex-col items-start">
									<button
										type="button"
										class="max-w-full truncate text-left text-sm hover:underline"
										onclick={() => onViewOrganization(membership.organization._id)}
									>
										{membership.organization.name}
									</button>
									<span class="text-surface-600-400 max-w-full truncate text-xs">
										{membership.organization.slug}
									</span>
								</div>
								{#if isOwner(membership)}
									<span
										class="badge preset-filled-primary-50-950 border-primary-200-800 border"
										title="Hand over the ownership on the organization's page to change their role or remove them"
									>
										Owner
									</span>
									<!-- Keeps the role column aligned with the rows that have a remove button -->
									<span class="size-8 shrink-0" aria-hidden="true"></span>
								{:else if !canManage}
									<span class="badge preset-tonal capitalize">{roleOf(membership)}</span>
									<span class="size-8 shrink-0" aria-hidden="true"></span>
								{:else}
									<div class="w-32 shrink-0">
										<Select.Root
											collection={roleCollection}
											value={[roleOf(membership)]}
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
			<h3 class="h6">
				Active sessions
				{#if sessionsQuery.data?.length}
					<span class="text-surface-600-400 font-normal">({sessionsQuery.data.length})</span>
				{/if}
			</h3>
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
					{#each sessions ?? [] as session (session.id)}
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
				{#if sessionsQuery.data.length > SESSIONS_SHOWN}
					<button
						type="button"
						class="btn btn-sm hover:preset-tonal w-fit"
						onclick={() => (showAllSessions = !showAllSessions)}
					>
						{showAllSessions ? 'Show fewer' : `Show all ${sessionsQuery.data.length} sessions`}
					</button>
				{/if}
			{/if}
		</section>
	{/if}

	<UserDialogs {user} bind:dialog onDeleted={onBack} />

	<!-- Add to organization dialog -->
	<Dialog.Root bind:open={addOpen} lazyMount unmountOnExit>
		<Dialog.Content class="md:max-w-108">
			<Dialog.Header class="pr-8">
				<Dialog.Title>Add {user?.name} to an organization</Dialog.Title>
				<Dialog.Description class="text-surface-700-300">
					They become a member right away, without an invitation.
				</Dialog.Description>
			</Dialog.Header>
			<form id={`${formId}-add`} class="flex w-full flex-col gap-3" onsubmit={handleAdd}>
				<div class="label">
					<label class="label-text" for={`${formId}-add-organization`}>Organization</label>
					<OrganizationSelect
						id={`${formId}-add-organization`}
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
					form={`${formId}-add`}
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
