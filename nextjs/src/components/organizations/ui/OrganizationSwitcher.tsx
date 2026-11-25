'use client';

import { ComponentProps, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useConvexAuth, useMutation } from 'convex/react';
import { Building2, ChevronsUpDown, Plus, Settings } from 'lucide-react';

import * as Avatar from '@/components/primitives/ui/avatar';
import * as Dialog from '@/components/primitives/ui/dialog';
import * as Popover from '@/components/primitives/ui/popover';
import CreateOrganization from '@/components/organizations/ui/CreateOrganization';
import LeaveOrganization from '@/components/organizations/ui/LeaveOrganization';
import { useRoles } from '@/components/organizations/api/hooks';
import { DIALOG_KEY } from '@/components/organizations/utils/organization.constants';
import { api } from '@/convex/_generated/api';
import { AUTH_CONSTANTS } from '@/convex/auth.constants';
import { useActiveOrganizationData, useOrganizationListData } from '@/lib/auth/hooks';

type PopoverRootProps = ComponentProps<typeof Popover.Root>;

export default function OrganizationSwitcher({
	popoverPlacement = 'bottom-end'
}: {
	popoverPlacement?: NonNullable<PopoverRootProps['positioning']>['placement'];
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { isLoading, isAuthenticated } = useConvexAuth();

	const organizations = useOrganizationListData();
	const activeOrganization = useActiveOrganizationData();
	const isOwnerOrAdmin = useRoles().hasOwnerOrAdminRole;
	const setActiveOrganization = useMutation(api.organizations.mutations.setActiveOrganization);

	const [openSwitcher, setOpenSwitcher] = useState(false);
	const [openCreateOrganization, setOpenCreateOrganization] = useState(false);

	useEffect(() => {
		if (!AUTH_CONSTANTS.organizations) {
			console.error(
				'Organizations are disabled, but OrganizationSwitcher is being used. Please turn them on in auth.constants.ts'
			);
		}
	}, []);

	useEffect(() => {
		const slug = activeOrganization?.slug;
		if (slug && /(?:^|\/)(active-organization|active-org)(?=\/|$)/.test(pathname)) {
			const newPathname = pathname.replace(
				/\/(active-organization|active-org)(?=\/|$)/g,
				`/${slug}`
			);
			router.replace(
				`${newPathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
				{
					scroll: false
				}
			);
		}
	}, [activeOrganization?.slug, pathname, router, searchParams]);

	const updateActiveOrg = useCallback(
		async (organizationId?: string) => {
			try {
				const currentActiveOrgSlug = activeOrganization?.slug;
				const urlContainsCurrentSlug =
					currentActiveOrgSlug &&
					(pathname.includes(`/${currentActiveOrgSlug}/`) ||
						pathname.endsWith(`/${currentActiveOrgSlug}`));

				const { changed } = await setActiveOrganization({ organizationId });
				// Filling in a missing organization (no id) that moved nothing leaves the page alone:
				// the active organization can answer empty for a moment, and the server kept it.
				if (!organizationId && !changed) return;

				if (urlContainsCurrentSlug && currentActiveOrgSlug) {
					const nextOrg = organizations?.find((org) => org?.id === organizationId);
					if (nextOrg?.slug && nextOrg.slug !== currentActiveOrgSlug) {
						router.replace(
							pathname.replace(
								new RegExp(`/${currentActiveOrgSlug}(?=/|$)`, 'g'),
								`/${nextOrg.slug}`
							)
						);
					} else {
						router.refresh();
					}
				} else {
					router.refresh();
				}
				setOpenSwitcher(false);
			} catch (err) {
				console.error('Error updating active organization:', err);
			}
		},
		[activeOrganization?.slug, organizations, pathname, router, setActiveOrganization]
	);

	// Only on a confirmed absence (null): not while the active organization loads or after its lookup failed
	useEffect(() => {
		if (organizations && organizations.length > 0 && activeOrganization === null) {
			void updateActiveOrg();
		}
	}, [organizations, activeOrganization, updateActiveOrg]);

	function openProfileModal() {
		setOpenSwitcher(false);
		const params = new URLSearchParams(searchParams.toString());
		if (params.get('dialog') !== DIALOG_KEY) {
			params.set('dialog', DIALOG_KEY);
			router.push(`${pathname}?${params.toString()}`, { scroll: false });
		}
	}

	function openCreateOrgModal() {
		setOpenCreateOrganization(true);
		setOpenSwitcher(false);
	}

	if (!AUTH_CONSTANTS.organizations) {
		return (
			<div className="text-error-600-400">
				Organizations are disabled, but OrganizationSwitcher is being used. Please turn them on in
				auth.constants.ts
			</div>
		);
	}
	if (!isAuthenticated) return null;
	if (
		(isLoading || organizations === undefined || activeOrganization === undefined) &&
		!organizations &&
		!activeOrganization
	) {
		return <div className="placeholder h-8 w-40 animate-pulse" />;
	}

	if (organizations && organizations.length === 0) {
		return (
			<Dialog.Root open={openCreateOrganization} onOpenChange={setOpenCreateOrganization}>
				<Dialog.Trigger className="btn preset-tonal flex items-center gap-2">
					<Plus className="size-4" />
					<span>Create Organization</span>
				</Dialog.Trigger>
				<Dialog.Content className="max-w-md">
					<CreateOrganization onSuccessfulCreate={() => setOpenCreateOrganization(false)} />
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
		);
	}

	if (!organizations) return null;

	return (
		<>
			<Popover.Root
				open={openSwitcher}
				onOpenChange={setOpenSwitcher}
				positioning={{ placement: popoverPlacement }}
			>
				{/* Named on its own: while the active organization loads, the button has no text. */}
				<Popover.Trigger
					className="border-surface-200-800 rounded-container flex w-32 flex-row items-center justify-between border p-1 pr-2 duration-200 ease-in-out sm:w-40"
					aria-label={
						activeOrganization?.name
							? `Organization: ${activeOrganization.name}`
							: 'Switch organization'
					}
				>
					<div className="flex w-full max-w-64 items-center gap-2 overflow-hidden sm:gap-3">
						<Avatar.Root className="rounded-container size-8 shrink-0">
							<Avatar.Image
								src={activeOrganization?.logo ?? undefined}
								alt={activeOrganization?.name ?? 'Organization'}
								className="rounded-container"
							/>
							<Avatar.Fallback className="rounded-container">
								<Building2 className="size-5" />
							</Avatar.Fallback>
						</Avatar.Root>
						<span className="text-surface-700-300 truncate text-sm">
							{activeOrganization?.name}
						</span>
					</div>
					<ChevronsUpDown className="size-4 opacity-40" />
				</Popover.Trigger>
				<Popover.Content>
					<div className="flex flex-col gap-1">
						<div
							role="list"
							className="bg-surface-50-950 rounded-container flex flex-col overflow-hidden"
						>
							{isOwnerOrAdmin ? (
								<button
									onClick={openProfileModal}
									className="btn hover:bg-surface-100-900/50 text-surface-700-300 flex h-14 w-full max-w-80 items-center gap-3 p-3 pr-5 text-left text-sm/6"
								>
									<Avatar.Root className="rounded-container size-8 shrink-0">
										<Avatar.Image
											src={activeOrganization?.logo ?? undefined}
											alt={activeOrganization?.name}
											className="rounded-container"
										/>
										<Avatar.Fallback className="rounded-container">
											<Building2 className="size-4" />
										</Avatar.Fallback>
									</Avatar.Root>
									<span className="text-surface-700-300 text-medium w-full truncate text-sm">
										{activeOrganization?.name}
									</span>
									<Settings className="size-6" />
								</button>
							) : (
								<div className="text-surface-700-300 border-surface-200-800 flex max-w-80 items-center gap-3 border-t p-3 text-sm/6">
									<Avatar.Root className="rounded-container size-8 shrink-0">
										<Avatar.Image
											src={activeOrganization?.logo ?? undefined}
											alt={activeOrganization?.name}
											className="rounded-container"
										/>
										<Avatar.Fallback className="rounded-container">
											<Building2 className="size-4" />
										</Avatar.Fallback>
									</Avatar.Root>
									<span className="text-surface-700-300 text-medium w-full truncate">
										{activeOrganization?.name}
									</span>
									<LeaveOrganization />
								</div>
							)}

							{organizations
								.filter((org) => org && org.id !== activeOrganization?.id)
								.map((org) =>
									org ? (
										<div key={org.id}>
											<button
												onClick={() => void updateActiveOrg(org.id)}
												className="group hover:bg-surface-100-900/50 border-surface-200-800 flex w-full max-w-80 items-center gap-3 border-t p-3"
											>
												<Avatar.Root className="rounded-container size-8 shrink-0">
													<Avatar.Image
														src={org.logo ?? undefined}
														alt={org.name}
														className="rounded-container"
													/>
													<Avatar.Fallback className="rounded-container">
														<Building2 className="size-4" />
													</Avatar.Fallback>
												</Avatar.Root>
												<span className="text-surface-700-300 truncate text-sm">{org.name}</span>
											</button>
										</div>
									) : null
								)}
						</div>
						<button
							onClick={openCreateOrgModal}
							className="btn hover:bg-surface-50-950/50 flex h-12 w-full items-center justify-start gap-3 bg-transparent p-3"
						>
							<div className="bg-surface-200-800 border-surface-300-700 rounded-base flex size-8 shrink-0 items-center justify-center border border-dashed">
								<Plus className="size-4" />
							</div>
							<span className="text-surface-700-300 text-sm">Create Organization</span>
						</button>
					</div>
				</Popover.Content>
			</Popover.Root>

			<Dialog.Root open={openCreateOrganization} onOpenChange={setOpenCreateOrganization}>
				<Dialog.Content className="max-w-md">
					<Dialog.Header>
						<Dialog.Title>Create Organization</Dialog.Title>
					</Dialog.Header>
					<CreateOrganization onSuccessfulCreate={() => setOpenCreateOrganization(false)} />
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
		</>
	);
}
