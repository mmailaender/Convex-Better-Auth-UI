import { useState } from 'react';
import { Tabs } from '@skeletonlabs/skeleton-react';
import { MembersList } from '@/components/organizations/ui/widget/Members';
import { InvitationsList } from '@/components/organizations/ui/widget/Invitations';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useIsOwnerOrAdmin } from '@/components/organizations/api/hooks';
import InviteMembers from './InviteMembers';

export default function Members() {
	const [group, setGroup] = useState('members');
	const members = useQuery(api.organizations.members.getOrganizationMembers);
	const invitations = useQuery(api.organizations.invitations.db.getInvitations);
	const isOwnerOrAdmin = useIsOwnerOrAdmin();

	return (
		<Tabs value={group} onValueChange={(e) => setGroup(e.value!)}>
			<Tabs.List>
				<Tabs.Control value="members">Members {members && `(${members.length})`}</Tabs.Control>
				{isOwnerOrAdmin && (
					<Tabs.Control value="invitations">
						Invitations {invitations && `(${invitations.length})`}
					</Tabs.Control>
				)}
			</Tabs.List>
			<Tabs.Content>
				<Tabs.Panel value="members">
					<InviteMembers />
					<MembersList />
				</Tabs.Panel>
				{isOwnerOrAdmin && (
					<Tabs.Panel value="invitations">
						<InvitationsList />
					</Tabs.Panel>
				)}
			</Tabs.Content>
		</Tabs>
	);
}
