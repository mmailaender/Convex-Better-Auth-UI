<script lang="ts">
	// Svelte
	import { page } from '$app/state';
	// API
	import { api } from '$convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { authClient } from '$lib/auth/api/auth-client';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// Icons
	import PencilIcon from '@lucide/svelte/icons/pencil';
	// Primitives
	import { toast } from 'svelte-sonner';
	import { tick } from 'svelte';

	// Types
	import type { FunctionReturnType } from 'convex/server';
	type GetActiveUserType = FunctionReturnType<typeof api.users.queries.getActiveUser>;

	// Props
	let { initialData }: { initialData?: { activeUser?: GetActiveUserType } } = $props();

	// Auth
	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);

	// Query
	const activeUserResponse = $derived(
		useQuery(api.users.queries.getActiveUser, isAuthenticated ? {} : 'skip', {
			initialData: initialData?.activeUser
		})
	);
	// Derived state
	const activeUser = $derived(activeUserResponse?.data ?? initialData?.activeUser);

	// State
	let isEditingEmail: boolean = $state(false);
	let newEmail: string = $state('');
	let isSubmitting: boolean = $state(false);
	let emailInputEl: HTMLInputElement | null = $state(null);

	// Initialize form value when user data is available and not editing
	$effect(() => {
		if (activeUser && !isEditingEmail) {
			newEmail = activeUser.email;
		}
	});

	// Handle form submission to change email
	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (!newEmail.trim()) {
			toast.error('Please enter a valid email address');
			return;
		}

		if (newEmail === activeUser?.email) {
			toast.error('New email must be different from current email');
			return;
		}

		try {
			isSubmitting = true;

			const currentUrl = new URL(page.url);
			if (
				!currentUrl.searchParams.has('dialog') ||
				currentUrl.searchParams.get('dialog') !== 'profile'
			) {
				currentUrl.searchParams.set('dialog', 'profile');
			}
			await authClient.changeEmail({
				newEmail,
				callbackURL: currentUrl.toString()
			});
			isEditingEmail = false;
			toast.success('Verification email sent to your new email address');
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to change email: ${errorMsg}`);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	{#if !activeUser}
		<div class="placeholder h-16 w-full animate-pulse"></div>
	{:else}
		<!-- Inline editable email (matches ProfileInfo.svelte UX) -->
		<div
			class={[
				'border-surface-300-700 rounded-container relative w-full border px-3.5 py-2 transition-all duration-200 ease-in-out',
				{
					'cursor-pointer': !isEditingEmail,
					'hover:bg-surface-200-800': !isEditingEmail,
					'hover:border-surface-200-800': !isEditingEmail
				}
			]}
		>
			<div class="flex items-center justify-between gap-3 transition-all duration-200 ease-in-out">
				<div class="flex w-full flex-col">
					<span class="text-surface-600-400 text-xs">Email Address</span>
					<!-- View mode (collapses when editing) -->
					<div
						class={[
							'grid transition-[grid-template-rows] duration-200 ease-in-out',
							isEditingEmail ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
							{ 'mt-1': !isEditingEmail }
						]}
						aria-hidden={isEditingEmail}
						inert={isEditingEmail}
					>
						<div class="overflow-hidden">
							<div class="flex items-center gap-2">
								<span class="truncate text-sm">{activeUser.email}</span>
								{#if activeUser.emailVerified}
									<span class="badge preset-filled-success-100-900 text-xs">Verified</span>
								{:else}
									<span class="badge preset-filled-warning-100-900 text-xs">Not verified</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- Edit mode (expands when editing) -->
					<div
						class={[
							'grid transition-[grid-template-rows] duration-200 ease-in-out',
							isEditingEmail ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
							{ 'mt-1': isEditingEmail }
						]}
						aria-hidden={!isEditingEmail}
						inert={!isEditingEmail}
					>
						<div class="overflow-hidden">
							<form onsubmit={handleSubmit} class="flex flex-col gap-3">
								<input
									bind:this={emailInputEl}
									type="email"
									class="input w-full"
									bind:value={newEmail}
									placeholder="Enter new email address"
									required
									disabled={isSubmitting}
								/>
								<div class="mb-1 flex gap-1.5">
									<button
										type="button"
										class="btn btn-sm preset-tonal w-full"
										onclick={() => {
											newEmail = activeUser.email;
											isEditingEmail = false;
										}}
										disabled={isSubmitting}
									>
										Cancel
									</button>
									<button
										type="submit"
										class="btn btn-sm preset-filled-primary-500 w-full"
										disabled={isSubmitting ||
											!newEmail ||
											newEmail.trim() === '' ||
											newEmail === activeUser.email}
									>
										{isSubmitting ? 'Sending...' : 'Verify Email'}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
				<!-- Edit affordance and full-area overlay button in view mode -->
				{#if !isEditingEmail}
					<div class="shrink-0">
						<span class=" btn-icon preset-filled-surface-50-950 pointer-events-none p-2">
							<PencilIcon class="size-4" />
						</span>
					</div>
					<button
						class="absolute inset-0 h-full w-full"
						aria-label="Change email"
						type="button"
						onclick={async () => {
							isEditingEmail = true;
							newEmail = activeUser.email;
							await tick();
							emailInputEl?.focus();
							emailInputEl?.select();
						}}
					></button>
				{/if}
			</div>
		</div>
	{/if}
</div>
