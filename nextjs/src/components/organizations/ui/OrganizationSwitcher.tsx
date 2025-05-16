'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Components
import { Popover, PopoverContent, PopoverTrigger } from '@/components/primitives/ui/popover';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogClose,
	DialogTrigger
} from '@/components/primitives/ui/dialog';
import CreateOrganization from '@/components/organizations/ui/CreateOrganization';
import OrganizationProfile from '@/components/organizations/ui/OrganizationProfile';
import LeaveOrganization from '@/components/organizations/ui/LeaveOrganization';
import { ChevronsUpDown, Plus, Settings } from 'lucide-react';
import { Avatar } from '@skeletonlabs/skeleton-react';

// API
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Organization switcher component that allows switching between organizations,
 * creating new organizations, and accessing organization settings.
 */
export default function OrganizationSwitcher({
	popoverSide = 'bottom',
	popoverAlign = 'end'
}: {
	/** Side the popover appears on relative to the trigger */
	popoverSide?: 'top' | 'right' | 'bottom' | 'left';
	/** Alignment of the popover relative to the trigger */
	popoverAlign?: 'start' | 'end' | 'center';
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
			<Dialog open={openCreateOrganization} onOpenChange={setOpenCreateOrganization}>
				<DialogTrigger className="btn preset-tonal flex items-center gap-2">
					<Plus size={16} />
					<span>Create Organization</span>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Organization</DialogTitle>
					</DialogHeader>
					<CreateOrganization onSuccessfulCreate={() => setOpenCreateOrganization(false)} />
					<DialogClose />
				</DialogContent>
			</Dialog>
		);
	}

	// Has organizations - show the switcher
	return (
		<>
			<Popover open={openSwitcher} onOpenChange={setOpenSwitcher}>
				<PopoverTrigger onClick={() => setOpenSwitcher(!openSwitcher)} className='flex items-center justify-between flex-row p-1 pr-2 hover:bg-surface-200-800 rounded-lg ease-in-out duration-200 border border-surface-200-800 w-40 '>
					<div className="flex items-center gap-3 w-full max-w-64 overflow-hidden">
						<Avatar
							src={activeOrganization?.logo || ''}
							name={activeOrganization?.name || ''}
							size="size-8 shrink-0 rounded-md"
						/>
						<span className="text-surface-700-300 text-sm  truncate">
							{activeOrganization?.name}
						</span>
					
					</div>
					<ChevronsUpDown className="size-4 opacity-40" color='currentColor' />
				</PopoverTrigger>

				<PopoverContent side={popoverSide} align={popoverAlign}>
					<div className='flex flex-col gap-1'>
						<div role="list" className="flex bg-surface-50-950 rounded-base flex-col ">
						
							<div className=" text-surface-700-300 flex items-center gap-3  p-3 text-sm/6  border-b border-surface-200-800 max-w-80">
								<Avatar
									src={activeOrganization?.logo || ''}
									name={activeOrganization?.name || ''}
									size="size-8 shrink-0 rounded-lg"
								/>
								<span className="text-surface-700-300 text-base w-full truncate">
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
												className="group hover:bg-surface-100-900/50 flex items-center w-full p-3 gap-3 max-w-80 "
											>
												<Avatar src={org.logo || ''} name={org.name} size="size-8 rounded-lg shrink-0" />
												<span className="text-surface-700-300 text-base truncate ">
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
								className="btn bg-transparent hover:bg-surface-50-950 flex w-full items-center justify-start gap-3 p-3"
							>
								
								<div className='flex items-center justify-center shrink-0 size-8 bg-surface-200-800 border border-surface-300-700 border-dashed rounded-base'><Plus className="size-4" /></div>
								<span className='text-surface-700-300 text-sm'>Create Organization</span>
							</button>
							</div>
				</PopoverContent>
			</Popover>

			<Dialog open={openCreateOrganization} onOpenChange={setOpenCreateOrganization}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Organization</DialogTitle>
					</DialogHeader>
					<CreateOrganization onSuccessfulCreate={() => setOpenCreateOrganization(false)} />
					<DialogClose />
				</DialogContent>
			</Dialog>

			<Dialog open={openOrganizationProfile} onOpenChange={setOpenOrganizationProfile}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Organization Profile</DialogTitle>
					</DialogHeader>
					<OrganizationProfile onSuccessfulDelete={() => setOpenOrganizationProfile(false)} />
					<DialogClose />
				</DialogContent>
			</Dialog>
		</>
	);
}
