<script lang="ts">
	// Primitives
	import { toast } from 'svelte-sonner';
	import * as Select from '$lib/primitives/ui/select';
	import { createListCollection } from '@ark-ui/svelte/select';

	// API
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { authClient } from '$lib/auth/api/auth-client';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// Constants
	import { AUTH_CONSTANTS } from '$convex/auth.constants';

	// API Types
	type Role = typeof authClient.$Infer.Member.role;
	import type { FunctionReturnType } from 'convex/server';
	type GetActiveOrganizationType = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;

	// Props
	let {
		onSuccess,
		initialData
	}: {
		onSuccess?: () => void;
		initialData?: {
			activeOrganization?: GetActiveOrganizationType;
			role?: Role;
		};
	} = $props();

	// Auth
	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);

	// Queries
	const activeOrganizationResponse = $derived(
		useQuery(api.organizations.queries.getActiveOrganization, isAuthenticated ? {} : 'skip', {
			initialData: initialData?.activeOrganization
		})
	);
	const activeOrganization = $derived(
		activeOrganizationResponse?.data ?? initialData?.activeOrganization
	);

	// State
	let emailInput: string = $state('');
	let isProcessing: boolean = $state(false);
	let selectedRole = $state<Role[]>(['member']);

	const collection = createListCollection({
		items: [
			{ label: 'Member', value: 'member' },
			{ label: 'Admin', value: 'admin' }
		]
	});

	/**
	 * Handles the submission of the invitation form
	 */
	async function handleInvite(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (isProcessing) return;
		isProcessing = true;

		const emails = emailInput
			.replace(/[,;\s]+/g, ',')
			.split(',')
			.map((email) => email.trim())
			.filter((email) => email.length > 0);

		if (emails.length === 0) {
			toast.error('Please enter at least one email address');
			isProcessing = false;
			return;
		}

		if (!activeOrganization?.id) {
			toast.error('No active organization found');
			isProcessing = false;
			return;
		}

		const results = [];

		// Send invitations one by one
		for (const email of emails) {
			const { data, error } = await authClient.organization.inviteMember({
				email,
				role: selectedRole,
				organizationId: activeOrganization.id,
				resend: true
			});

			results.push({
				email,
				success: !error,
				data,
				error
			});
		}

		const successful = results.filter((r) => r.success);
		const failed = results.filter((r) => !r.success);

		if (successful.length > 0) {
			const msg = `Sent ${successful.length} invitation(s) to: ${successful.map((r) => r.email).join(', ')}`;
			toast.success(msg);
			emailInput = '';
			if (onSuccess) {
				onSuccess();
			}
		}

		if (failed.length > 0) {
			// Group failures by error.code so we can show one toast per error type
			const groups = new Map<string, { message: string; emails: string[] }>();

			for (const r of failed) {
				// Defensive defaults in case the shape changes
				const code = r.error?.code ?? 'UNKNOWN_ERROR';
				const message = r.error?.message ?? 'Unknown error';

				if (!groups.has(code)) {
					groups.set(code, { message, emails: [] });
				}
				groups.get(code)!.emails.push(r.email);
			}

			// Emit a toast per error code with its human message and all affected emails
			for (const [code, { message, emails }] of groups.entries()) {
				toast.error(`${message}: ${emails.join(', ')}`);
			}
		}

		isProcessing = false;
	}
</script>

<form onsubmit={handleInvite} class="flex flex-col gap-4">
	<div class="flex flex-col gap-4">
		<div class="flex flex-col">
			<label>
				<span class="label">Role</span>
				<Select.Root {collection} bind:value={selectedRole}>
					<Select.Trigger class="w-full" placeholder="Select a role" />
					<Select.Content>
						{#each collection.items as item (item.value)}
							<Select.Item {item}>
								<Select.ItemText>{item.label}</Select.ItemText>
								<Select.ItemIndicator>✓</Select.ItemIndicator>
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</label>
		</div>
		<div class="flex flex-col gap-2">
			<label>
				<span class="label">Email(s)</span>
				<textarea
					bind:value={emailInput}
					placeholder="example@email.com, example2@email.com"
					class="textarea min-h-24 grow"
					required
				></textarea>
			</label>
			<p class="text-surface-600-400 px-1 text-xs">
				You can invite multiple people by separating email addresses with commas, semicolons, or
				spaces.
			</p>
		</div>
		<div class="flex justify-end gap-2 pt-6 md:flex-row">
			<button
				type="submit"
				class="btn preset-filled-primary-500"
				disabled={isProcessing || !AUTH_CONSTANTS.sendEmails}
			>
				{isProcessing ? 'Sending...' : 'Send Invitations'}
			</button>
		</div>
		{#if !AUTH_CONSTANTS.sendEmails}
			<div class="text-error-600-400 px-1 text-xs">
				Sending Emails is not enabled. Please enable to send invitations.
			</div>
		{/if}
	</div>
</form>
