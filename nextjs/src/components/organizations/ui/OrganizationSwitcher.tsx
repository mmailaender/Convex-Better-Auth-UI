'use client';

import { ComponentProps, useState } from 'react';
import { useRouter } from 'next/navigation';

// Primitives
import * as Popover from '@/components/primitives/ui/popover';
import * as Dialog from '@/components/primitives/ui/dialog';
import { Avatar } from '@skeletonlabs/skeleton-react';
// Icons
import { ChevronsUpDown, Plus, Settings } from 'lucide-react';
// Components
import CreateOrganization from '@/components/organizations/ui/CreateOrganization';
import OrganizationProfile from '@/components/organizations/ui/OrganizationProfile';
import LeaveOrganization from '@/components/organizations/ui/LeaveOrganization';

// API
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

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
	const organizations = useQuery(api.organizations.getUserOrganizations);
	const activeOrganization = useQuery(api.organizations.getActiveOrganization);
	const setActiveOrg = useMutation(api.organizations.setActiveOrganization);

	// State
	const [openSwitcher, setOpenSwitcher] = useState<boolean>(false);
	const [openCreateOrganization, setOpenCreateOrganization] = useState<boolean>(false);
	const [openOrganizationProfile, setOpenOrganizationProfile] = useState<boolean>(false);

	/**
	 * Updates the active organization
	 */
	const updateActiveOrg = async (organizationId: Id<'organizations'>) => {
		try {
			await setActiveOrg({ organizationId });

			// Close popover and refresh
			setOpenSwitcher(false);
			router.refresh();
		} catch (err) {
			console.error(err);
		}
	};

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
				<Dialog.Content>
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
					className="hover:bg-surface-200-800 border-surface-200-800 flex w-40 flex-row items-center justify-between rounded-lg border p-1 pr-2 duration-200 ease-in-out"
				>
					<div className="flex w-full max-w-64 items-center gap-3 overflow-hidden">
						<Avatar
							src={activeOrganization?.logo || ''}
							name={activeOrganization?.name || ''}
							size="size-8 shrink-0 rounded-md"
						/>
						<span className="text-surface-700-300 truncate text-sm">
							{activeOrganization?.name}
						</span>
					</div>
					<ChevronsUpDown className="size-4 opacity-40" />
				</Popover.Trigger>

				<Popover.Content side={popoverSide} align={popoverAlign}>
					<div className="flex flex-col gap-1">
						<div role="list" className="bg-surface-50-950 rounded-base flex flex-col">
							<div className="text-surface-700-300 border-surface-200-800 flex max-w-80 items-center gap-3 border-b p-3 text-sm/6">
								<Avatar
									src={activeOrganization?.logo || ''}
									name={activeOrganization?.name || ''}
									size="size-8 shrink-0 rounded-lg"
								/>
								<span className="text-surface-700-300 text-medium w-full truncate text-base">
									{activeOrganization?.name}
								</span>
								{activeOrganization?.role === 'role_organization_owner' ||
								activeOrganization?.role === 'role_organization_admin' ? (
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
								.filter((org) => org && org._id !== activeOrganization?._id)
								.map(
									(org) =>
										org && (
											<div key={org._id}>
												<button
													onClick={() => updateActiveOrg(org._id)}
													className="group hover:bg-surface-100-900/50 flex w-full max-w-80 items-center gap-3 p-3"
												>
													<Avatar
														src={org.logo || ''}
														name={org.name}
														size="size-8 rounded-lg shrink-0"
													/>
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
				<Dialog.Content className="max-w-xl">
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
