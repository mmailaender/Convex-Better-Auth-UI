/** UI **/
// Primitives
import * as Tabs from '@/components/primitives/ui/tabs';
import * as Dialog from '@/components/primitives/ui/dialog';
import * as Drawer from '@/components/primitives/ui/drawer';
// Icons
import { Plus } from 'lucide-react';
// Widgets
import Members from '@/components/organizations/ui/Members';
import Invitations from '@/components/organizations/ui/Invitations';
import InviteMembers from '@/components/organizations/ui/InviteMembers';

// API
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRoles } from '@/components/organizations/api/hooks';
import { useState } from 'react';

export default function MembersAndInvitations() {
	const activeOrganization = useQuery(api.organizations.queries.getActiveOrganization);
	const members = activeOrganization?.members;
	const invitations = useQuery(api.organizations.invitations.queries.listInvitations);
	const isOwnerOrAdmin = useRoles().hasOwnerOrAdminRole;
	const [inviteMembersDialogOpen, setInviteMembersDialogOpen] = useState(false);
	const [inviteMembersDrawerOpen, setInviteMembersDrawerOpen] = useState(false);

	const handleInviteMembersSuccess = () => {
		setInviteMembersDialogOpen(false);
		setInviteMembersDrawerOpen(false);
	};

	return (
		<Tabs.Root defaultValue="members">
			<div className="border-surface-300-700 flex w-full flex-row justify-between border-b pb-6 align-middle">
				<Tabs.List>
					<Tabs.Trigger value="members" className="gap-2">
						Members{' '}
						<span className="badge preset-filled-surface-300-700 size-6 rounded-full">
							{members && `${members.length}`}{' '}
						</span>
					</Tabs.Trigger>
					{isOwnerOrAdmin && (
						<Tabs.Trigger value="invitations" className="gap-2">
							Invitations{' '}
							<span className="badge preset-filled-surface-300-700 size-6 rounded-full">
								{invitations && `${invitations.length}`}
							</span>
						</Tabs.Trigger>
					)}
				</Tabs.List>
				{isOwnerOrAdmin && (
					<>
						<Dialog.Root open={inviteMembersDialogOpen} onOpenChange={setInviteMembersDialogOpen}>
							<Dialog.Trigger className="btn preset-filled-primary-500 hidden h-10 items-center gap-2 text-sm md:flex">
								<Plus className="size-5" />
								<span>Invite members</span>
							</Dialog.Trigger>
							<Dialog.Content className="max-w-108">
								<Dialog.Header>
									<Dialog.Title>Invite new members</Dialog.Title>
								</Dialog.Header>
								<InviteMembers onSuccess={handleInviteMembersSuccess} />
								<Dialog.CloseX />
							</Dialog.Content>
						</Dialog.Root>
						<Drawer.Root open={inviteMembersDrawerOpen} onOpenChange={setInviteMembersDrawerOpen}>
							<Drawer.Trigger className="btn preset-filled-primary-500 absolute right-4 bottom-4 z-10 h-10 text-sm md:hidden">
								<Plus className="size-5" /> Invite members
							</Drawer.Trigger>
							<Drawer.Content>
								<Drawer.Header>
									<Drawer.Title>Invite new members</Drawer.Title>
								</Drawer.Header>
								<InviteMembers onSuccess={handleInviteMembersSuccess} />
								<Drawer.CloseX />
							</Drawer.Content>
						</Drawer.Root>
					</>
				)}
			</div>
			<Tabs.Content value="members" className="">
				<Members />
			</Tabs.Content>
			{isOwnerOrAdmin && (
				<Tabs.Content value="invitations">
					<Invitations />
				</Tabs.Content>
			)}
		</Tabs.Root>
	);
}
