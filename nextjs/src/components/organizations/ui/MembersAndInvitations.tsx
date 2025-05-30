import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/primitives/ui/tabs';
import { Members } from '@/components/organizations/ui/Members';
import { Invitations } from '@/components/organizations/ui/Invitations';
import InviteMembers from './InviteMembers';

// API
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useIsOwnerOrAdmin } from '@/components/organizations/api/hooks';

export default function MembersAndInvitations() {
	const members = useQuery(api.organizations.members.getOrganizationMembers);
	const invitations = useQuery(api.organizations.invitations.db.getInvitations);
	const isOwnerOrAdmin = useIsOwnerOrAdmin();

	return (
		<Tabs defaultValue="members">
			<h6 className="border-surface-300-700 text-surface-700-300 border-b pb-6 text-center text-sm font-medium sm:text-left">
				Members
			</h6>
			<div className="border-surface-300-700 flex w-full flex-row justify-between border-b py-4 align-middle">
				<TabsList>
					<TabsTrigger value="members" className="gap-2">
						Members{' '}
						<span className="badge preset-filled-surface-300-700 size-6 rounded-full">
							{members && `${members.length}`}{' '}
						</span>
					</TabsTrigger>
					{isOwnerOrAdmin && (
						<TabsTrigger value="invitations" className="gap-2">
							Invitations{' '}
							<span className="badge preset-filled-surface-300-700 size-6 rounded-full">
								{invitations && `${invitations.length}`}
							</span>
						</TabsTrigger>
					)}
				</TabsList>
				<InviteMembers />
			</div>
			<TabsContent value="members" className="">
				<Members />
			</TabsContent>
			{isOwnerOrAdmin && (
				<TabsContent value="invitations">
					<Invitations />
				</TabsContent>
			)}
		</Tabs>
	);
}
