// Components
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
			<TabsList>
				<TabsTrigger value="members">Members {members && `(${members.length})`}</TabsTrigger>
				{isOwnerOrAdmin && (
					<TabsTrigger value="invitations">
						Invitations {invitations && `(${invitations.length})`}
					</TabsTrigger>
				)}
			</TabsList>
			<TabsContent value="members">
				<InviteMembers />
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
