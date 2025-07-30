'use client';

import { ComponentProps, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Primitives
import * as Popover from '@/components/primitives/ui/popover';
import * as Dialog from '@/components/primitives/ui/dialog';
import * as Avatar from '@/components/primitives/ui/avatar';
// Icons
import { Building2, ChevronsUpDown, Plus, Settings } from 'lucide-react';
// Components
import CreateOrganization from '@/components/organizations/ui/CreateOrganization';
import OrganizationProfile from '@/components/organizations/ui/OrganizationProfile';
import LeaveOrganization from '@/components/organizations/ui/LeaveOrganization';

// API
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Types
type PopoverProps = ComponentProps<typeof Popover.Content>;

/**
 * Organization switcher component that allows switching between organizations,
 * creating new organizations, and accessing organization settings.
 */
export default function OrganizationSwitcher({
	popoverSide = 'bottom',
	popoverAlign = 'end'
}: {
	/** Side the popover appears on relative to the trigger */
	popoverSide?: PopoverProps['side'];
	/** Alignment of the popover relative to the trigger */
	popoverAlign?: PopoverProps['align'];
}) {
	const router = useRouter();
	const { isLoading, isAuthenticated } = useConvexAuth();

	// Queries and mutations
	const organizations = useQuery(api.organizations.queries.listOrganizations);
	const activeOrganization = useQuery(api.organizations.queries.getActiveOrganization);
	const role = useQuery(api.organizations.queries.getActiveOrganizationRole);
	const setActiveOrganization = useMutation(api.organizations.mutations.setActiveOrganization);

	// State
	const [openSwitcher, setOpenSwitcher] = useState<boolean>(false);
	const [openCreateOrganization, setOpenCreateOrganization] = useState<boolean>(false);
	const [openOrganizationProfile, setOpenOrganizationProfile] = useState<boolean>(false);

	/**
	 * Updates the active organization and replaces URL slug if needed
	 */
	const setActiveOrg = useCallback(
		async (organizationId?: string) => {
			try {
				// Get current active organization slug before mutation
				const currentActiveOrgSlug = activeOrganization?.slug;
				const currentPathname = window.location.pathname;

				// Check if current URL contains the active organization slug
				const urlContainsCurrentSlug =
					currentActiveOrgSlug &&
					(currentPathname.includes(`/${currentActiveOrgSlug}/`) ||
						currentPathname.includes(`/${currentActiveOrgSlug}`));

				// Execute the mutation to set new active organization
				await setActiveOrganization({ organizationId });

				// Get the new active organization data
				const newActiveOrgSlug = activeOrganization?.slug;

				// If URL contained old slug and we have a new slug, replace it
				if (
					urlContainsCurrentSlug &&
					currentActiveOrgSlug &&
					newActiveOrgSlug &&
					currentActiveOrgSlug !== newActiveOrgSlug
				) {
					// Replace the old slug with the new slug in the URL
					const newPathname = currentPathname.replace(
						new RegExp(`/${currentActiveOrgSlug}(?=/|$)`, 'g'),
						`/${newActiveOrgSlug}`
					);

					// Navigate to the new URL
					router.push(newPathname);
				} else {
					// No slug replacement needed, just refresh current page
					router.refresh();
				}

				// Close popover
				setOpenSwitcher(false);
			} catch (err) {
				console.error('Error updating active organization:', err);
			}
		},
		[activeOrganization, setActiveOrganization, router, setOpenSwitcher]
	);

	// check on mount if there is an active organization and if not, use the first organization from listOrganization and call with that setActiveOrg
	useEffect(() => {
		if (organizations && organizations.length > 0 && !activeOrganization) {
			setActiveOrg();
		}
	}, [organizations, activeOrganization, setActiveOrg]);

	// Not authenticated - don't show anything
	if (!isAuthenticated) {
		return null;
	}

	// Loading state
	if (isLoading || !organizations) {
		return <div className="placeholder h-8 w-40 animate-pulse"></div>;
	}

	// No organizations - just show the create button
	if (organizations.length === 0) {
		return (
			<Dialog.Root open={openCreateOrganization} onOpenChange={setOpenCreateOrganization}>
				<Dialog.Trigger className="btn preset-tonal flex items-center gap-2">
					<Plus className="size-4" />
					<span>Create Organization</span>
				</Dialog.Trigger>
				<Dialog.Content className="max-w-lg">
					<Dialog.Header>
						<Dialog.Title>Create Organization</Dialog.Title>
					</Dialog.Header>
					<CreateOrganization onSuccessfulCreate={() => setOpenCreateOrganization(false)} />
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
		);
	}

	// Has organizations - show the switcher
	return (
		<>
			<Popover.Root open={openSwitcher} onOpenChange={setOpenSwitcher}>
				<Popover.Trigger
					onClick={() => setOpenSwitcher(!openSwitcher)}
					className="hover:bg-surface-200-800 border-surface-200-800 rounded-container flex w-40 flex-row items-center justify-between border p-1 pr-2 duration-200 ease-in-out"
				>
					<div className="flex w-full max-w-64 items-center gap-3 overflow-hidden">
						<Avatar.Root className="rounded-container size-8 shrink-0">
							<Avatar.Image
								src={activeOrganization?.logo || ''}
								alt={activeOrganization?.name || ''}
							/>
							<Avatar.Fallback>
								<Building2 className="size-5" />
							</Avatar.Fallback>
						</Avatar.Root>
						<span className="text-surface-700-300 truncate text-sm">
							{activeOrganization?.name}
						</span>
					</div>
					<ChevronsUpDown className="size-4 opacity-40" />
				</Popover.Trigger>

				<Popover.Content side={popoverSide} align={popoverAlign}>
					<div className="flex flex-col gap-1">
						<div role="list" className="bg-surface-50-950 rounded-container flex flex-col">
							<div className="text-surface-700-300 border-surface-200-800 flex max-w-80 items-center gap-3 border-b p-3 text-sm/6">
								<Avatar.Root className="rounded-container size-8 shrink-0">
									<Avatar.Image
										src={activeOrganization?.logo || ''}
										alt={activeOrganization?.name || ''}
									/>
									<Avatar.Fallback>
										<Building2 className="size-5" />
									</Avatar.Fallback>
								</Avatar.Root>
								<span className="text-surface-700-300 text-medium w-full truncate text-base">
									{activeOrganization?.name}
								</span>
								{role === 'owner' || role === 'admin' ? (
									<button
										onClick={() => {
											setOpenOrganizationProfile(true);
											setOpenSwitcher(false);
										}}
										className="btn-icon preset-faded-surface-50-950 hover:preset-filled-surface-300-700 flex gap-2"
									>
										<Settings className="size-4" />
									</button>
								) : (
									activeOrganization && <LeaveOrganization />
								)}
							</div>

							{organizations
								.filter((org) => org && org.id !== activeOrganization?.id)
								.map(
									(org) =>
										org && (
											<div key={org.id}>
												<button
													onClick={() => setActiveOrg(org.id)}
													className="group hover:bg-surface-100-900/50 flex w-full max-w-80 items-center gap-3 p-3"
												>
													<Avatar.Root className="rounded-container size-8 shrink-0">
														<Avatar.Image src={org.logo || ''} alt={org.name || ''} />
														<Avatar.Fallback>
															<Building2 className="size-5" />
														</Avatar.Fallback>
													</Avatar.Root>
													<span className="text-surface-700-300 truncate text-base">
														{org.name}
													</span>
												</button>
											</div>
										)
								)}
						</div>
						<button
							onClick={() => {
								setOpenCreateOrganization(true);
								setOpenSwitcher(false);
							}}
							className="btn hover:bg-surface-50-950/50 flex w-full items-center justify-start gap-3 bg-transparent p-3"
						>
							<div className="bg-surface-200-800 border-surface-300-700 rounded-base flex size-8 shrink-0 items-center justify-center border border-dashed">
								<Plus className="size-4" />
							</div>
							<span className="text-surface-700-300 text-sm">Create Organization</span>
						</button>
					</div>
				</Popover.Content>
			</Popover.Root>

			{/* Create Organization Modal */}
			<Dialog.Root open={openCreateOrganization} onOpenChange={setOpenCreateOrganization}>
				<Dialog.Content className="max-w-lg">
					<Dialog.Header>
						<Dialog.Title>Create Organization</Dialog.Title>
					</Dialog.Header>
					<CreateOrganization onSuccessfulCreate={() => setOpenCreateOrganization(false)} />
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>

			{/* Organization Profile Modal */}
			<Dialog.Root open={openOrganizationProfile} onOpenChange={setOpenOrganizationProfile}>
				<Dialog.Content className="md:rounded-container h-[100dvh] max-h-[100dvh] w-[100dvw] rounded-none p-0 md:h-[70vh] md:w-4xl">
					<Dialog.Header className="hidden">
						<Dialog.Title></Dialog.Title>
					</Dialog.Header>
					<OrganizationProfile onSuccessfulDelete={() => setOpenOrganizationProfile(false)} />
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
		</>
	);
}
